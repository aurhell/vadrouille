-- Push notifications (US8.1 and friends — see architecture-technique.md §Backend). One row
-- per user (not per device): re-registering on a new device just overwrites it — multi-device
-- fan-out is out of scope for the MVP, see walk.docs.md-style Hypothèses notes in the domain
-- docs for this decision.
--
-- Design note vs. architecture-technique.md's original "trigger DB → Edge Function → Expo
-- Push": the DB triggers below call the Expo Push API directly via pg_net instead of relaying
-- through a dedicated Edge Function. Expo's send endpoint needs no server-side secret, so the
-- extra hop would only have bought us a single lookup query — which the triggers already do
-- in SQL — at the cost of an Edge Function URL that differs between local dev and a cloud
-- project (and, along with it, a shared secret to authenticate the trigger's own call). Same
-- reasoning applies to delete-account, which already runs with service_role and can call Expo
-- directly. See docs update alongside this migration.
create extension if not exists pg_net;

create table public.push_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  expo_push_token text not null,
  updated_at timestamptz not null default now()
);

comment on table public.push_tokens is
  'One Expo push token per user (last device to register wins — no multi-device fan-out at '
  'the MVP). Written by the client on login/permission grant, read only by SECURITY DEFINER '
  'trigger functions (see send_push_notifications below), never by another user directly.';

alter table public.push_tokens enable row level security;

create policy "push_tokens_owner_only"
  on public.push_tokens
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Fire-and-forget: looks up each user's token and POSTs the batch to Expo. No delivery
-- tracking/retry at the MVP (same "best effort" posture already documented for the rest of
-- this app's notification-adjacent features) — pg_net records the response in
-- net._http_response if it's ever needed for debugging, but nothing here waits on it.
create or replace function public.send_push_notifications(p_user_ids uuid[], p_title text, p_body text, p_data jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  messages jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object('to', pt.expo_push_token, 'title', p_title, 'body', p_body, 'data', p_data)), '[]'::jsonb)
  into messages
  from public.push_tokens pt
  where pt.user_id = any(p_user_ids);

  if jsonb_array_length(messages) = 0 then
    return;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb,
    body := messages
  );
end;
$$;

-- 1. Walk invite — new "pending" row on walk_participants (see walk.docs.md "Création d'une
-- balade" and "Feature: Notifications liées aux balades").
create or replace function public.notify_walk_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organizer_name text;
begin
  if new.status = 'pending' then
    select p.username into organizer_name
    from public.walks w
    join public.profiles p on p.id = w.organizer_id
    where w.id = new.walk_id;

    if organizer_name is not null then
      perform public.send_push_notifications(
        array[new.user_id],
        '🦮 ' || organizer_name || ' t''invite à une balade',
        'Réponds pour lui faire savoir si tu viens.',
        jsonb_build_object('type', 'walk_invite', 'walk_id', new.walk_id)
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger walk_participants_notify_invite
  after insert on public.walk_participants
  for each row
  execute function public.notify_walk_invite();

-- 2. Reprogrammation — extends the existing reset trigger (see walks.sql
-- reset_walk_responses_on_reschedule) rather than adding a second trigger on the same table,
-- so the "did anything actually change" check isn't duplicated. Notifies every participant,
-- including those still "pending" — see walk.docs.md "Reprogrammation d'une balade".
create or replace function public.reset_walk_responses_on_reschedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organizer_name text;
  participant_ids uuid[];
begin
  if new.start_time is distinct from old.start_time
     or new.location_text is distinct from old.location_text
     or new.duration_minutes is distinct from old.duration_minutes
  then
    update public.walk_participants
    set status = 'pending', responded_at = null
    where walk_id = new.id
      and status <> 'pending';

    select array_agg(user_id), max(p.username) into participant_ids, organizer_name
    from public.walk_participants wp
    join public.profiles p on p.id = new.organizer_id
    where wp.walk_id = new.id;

    if participant_ids is not null and organizer_name is not null then
      perform public.send_push_notifications(
        participant_ids,
        '🦮 ' || organizer_name || ' a mis à jour la balade',
        'Confirme ta présence !',
        jsonb_build_object('type', 'walk_rescheduled', 'walk_id', new.id)
      );
    end if;
  end if;

  return new;
end;
$$;

-- 3. Co-ownership invite — new "pending" co-owner row on dog_owners (see dog.docs.md "Foyer
-- partagé", US8.2). The inviter is whoever the RLS policy required to be the accepted owner
-- making the request — auth.uid() at insert time.
create or replace function public.notify_co_owner_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inviter_name text;
  dog_name text;
begin
  if new.status = 'pending' and new.role = 'co-owner' then
    select username into inviter_name from public.profiles where id = auth.uid();
    select name into dog_name from public.dogs where id = new.dog_id;

    if inviter_name is not null and dog_name is not null then
      perform public.send_push_notifications(
        array[new.user_id],
        '🐾 ' || inviter_name || ' t''invite à co-gérer ' || dog_name,
        'Accepte pour l''ajouter à tes chiens.',
        jsonb_build_object('type', 'co_owner_invite', 'dog_id', new.dog_id)
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger dog_owners_notify_invite
  after insert on public.dog_owners
  for each row
  execute function public.notify_co_owner_invite();

-- 4. Friend request — new "pending" row on friendships (see friend.docs.md "Notification
-- 'demande d'ami reçue'"). user_id is the requester, friend_id the addressee being notified.
create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_name text;
begin
  if new.status = 'pending' then
    select username into requester_name from public.profiles where id = new.user_id;

    if requester_name is not null then
      perform public.send_push_notifications(
        array[new.friend_id],
        '👋 ' || requester_name || ' veut devenir ton ami',
        'Accepte pour l''ajouter à ta liste.',
        jsonb_build_object('type', 'friend_request', 'requester_id', new.user_id)
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger friendships_notify_request
  after insert on public.friendships
  for each row
  execute function public.notify_friend_request();
