create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  constraint friendships_no_self_friend check (user_id <> friend_id)
);

comment on table public.friendships is
  'Directed friendship edge. A pending request is a single row (requester -> addressee, '
  'status=pending). Acceptance adds the mirror row (addressee -> requester, status=accepted) '
  'and flips the original to accepted, so an accepted friendship is always the familiar pair '
  'of symmetric accepted rows. See redeem_invite_code() / accept_friend_request() / '
  'decline_friend_request() / cancel_friend_request() below.';

create or replace function public.is_friend_of(target_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.friendships f
    where f.user_id = auth.uid()
      and f.friend_id = target_user_id
      and f.status = 'accepted'
  );
$$;

comment on function public.is_friend_of(uuid) is
  'True if target_user_id is an *accepted* friend of the current authenticated user — a '
  'pending request either way does not count. Used to gate accepted-friend-only actions '
  'like the dog_owners co-owner invite.';

create or replace function public.has_friendship_edge(target_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.friendships f
    where (f.user_id = auth.uid() and f.friend_id = target_user_id)
       or (f.user_id = target_user_id and f.friend_id = auth.uid())
  );
$$;

comment on function public.has_friendship_edge(uuid) is
  'True if target_user_id and the current user have *any* friendships row between them, '
  'pending or accepted, in either direction. Deliberately broader than is_friend_of(): the '
  'pending-requests screens need to show the other person''s username/avatar before either '
  'side has accepted (see friend.docs.md "Aperçu avant confirmation" / "Invitations reçues" '
  '/ "Invitations envoyées") — this is exactly the identity the requester already asserted '
  'by looking up or sending the code, not new exposure.';

-- Deferred from profiles.sql: needs has_friendship_edge(), just defined above (multiple
-- permissive policies for the same command are combined with OR, alongside profiles_select_own).
create policy "profiles_select_friend"
  on public.profiles
  for select
  to authenticated
  using (public.has_friendship_edge(id));

-- RLS -------------------------------------------------------------------------

alter table public.friendships enable row level security;

-- Own outgoing edges (accepted friends + requests I sent) — plus incoming pending requests
-- addressed to me, where I'm friend_id, not user_id, so they need their own clause.
create policy "friendships_select_own_or_incoming_pending"
  on public.friendships
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or (friend_id = auth.uid() and status = 'pending')
  );

-- No INSERT/UPDATE/DELETE client policy: every mutation goes through the SECURITY DEFINER
-- RPCs below — a plain RLS policy can't express "also touch the other person's row"
-- atomically, which accepting/declining/cancelling all need.

-- Invite code lookup & redemption --------------------------------------------------------

create or replace function public.lookup_invite_code(code text)
returns table (id uuid, username text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.avatar_url
  from public.profiles p
  where p.invite_code = code;
$$;

comment on function public.lookup_invite_code(text) is
  'Preview the owner of an invite code before redeeming it (confirmation UI: "Ajouter Alice '
  'comme amie ?" with avatar, see friend.docs.md). Returns no row for an unknown code and '
  'creates nothing. SECURITY DEFINER for the same reason as redeem_invite_code() — clients '
  'can never SELECT a stranger''s profile or profiles.invite_code directly.';

revoke all on function public.lookup_invite_code(text) from public;
grant execute on function public.lookup_invite_code(text) to authenticated;

create or replace function public.redeem_invite_code(code text)
returns text -- 'created' | 'already_friends' | 'already_pending' | 'auto_accepted'
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
  existing_status text;
  reverse_status text;
begin
  select id into target_user_id
  from public.profiles
  where invite_code = code;

  if target_user_id is null then
    raise exception 'invalid_invite_code' using errcode = 'P0001';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'cannot_redeem_own_code' using errcode = 'P0001';
  end if;

  select status into existing_status
  from public.friendships
  where user_id = auth.uid() and friend_id = target_user_id;

  if existing_status = 'accepted' then
    return 'already_friends';
  end if;

  if existing_status = 'pending' then
    return 'already_pending';
  end if;

  -- Crossed requests: the target already sent *me* a pending request — redeeming their code
  -- now expresses the same intent as accepting it, so accept instead of creating a second,
  -- redundant pending edge the other way.
  select status into reverse_status
  from public.friendships
  where user_id = target_user_id and friend_id = auth.uid();

  if reverse_status = 'pending' then
    update public.friendships
    set status = 'accepted'
    where user_id = target_user_id and friend_id = auth.uid();

    insert into public.friendships (user_id, friend_id, status)
    values (auth.uid(), target_user_id, 'accepted');

    return 'auto_accepted';
  end if;

  -- ON CONFLICT DO NOTHING covers two simultaneous redemptions of the same code racing each
  -- other: whichever loses the race just silently no-ops instead of erroring.
  insert into public.friendships (user_id, friend_id, status)
  values (auth.uid(), target_user_id, 'pending')
  on conflict (user_id, friend_id) do nothing;

  return 'created';
end;
$$;

comment on function public.redeem_invite_code(text) is
  'Redeems a friend''s invite code: verifies it, blocks self-redemption, then sends a pending '
  'friend request (or auto-accepts one already pending the other way — see friend.docs.md '
  '"Demandes croisées"). Runs as SECURITY DEFINER because clients must never be able to '
  'SELECT profiles.invite_code directly. Returns an outcome: created / already_friends / '
  'already_pending / auto_accepted.';

revoke all on function public.redeem_invite_code(text) from public;
grant execute on function public.redeem_invite_code(text) to authenticated;

-- Responding to a request ------------------------------------------------------------------

create or replace function public.accept_friend_request(requester_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.friendships
  set status = 'accepted'
  where user_id = requester_id and friend_id = auth.uid() and status = 'pending';

  if not found then
    raise exception 'request_not_found' using errcode = 'P0001';
  end if;

  insert into public.friendships (user_id, friend_id, status)
  values (auth.uid(), requester_id, 'accepted')
  on conflict (user_id, friend_id) do update set status = 'accepted';
end;
$$;

comment on function public.accept_friend_request(uuid) is
  'Addressee accepts a pending request from requester_id: flips their row to accepted and '
  'inserts the mirror row, completing the symmetric accepted pair. Raises request_not_found '
  'if there is no such pending request (already accepted/declined/cancelled).';

revoke all on function public.accept_friend_request(uuid) from public;
grant execute on function public.accept_friend_request(uuid) to authenticated;

create or replace function public.decline_friend_request(requester_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.friendships
  where user_id = requester_id and friend_id = auth.uid() and status = 'pending';
end;
$$;

comment on function public.decline_friend_request(uuid) is
  'Addressee declines a pending request from requester_id: deletes it. Idempotent (no error '
  'if already gone — e.g. the requester cancelled it concurrently) so the requester can send '
  'a fresh request later without being permanently blocked (no MVP cooldown, see roadmap.md).';

revoke all on function public.decline_friend_request(uuid) from public;
grant execute on function public.decline_friend_request(uuid) to authenticated;

create or replace function public.cancel_friend_request(addressee_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.friendships
  where user_id = auth.uid() and friend_id = addressee_id and status = 'pending';
end;
$$;

comment on function public.cancel_friend_request(uuid) is
  'Requester withdraws their own pending request to addressee_id. Idempotent, same reasoning '
  'as decline_friend_request().';

revoke all on function public.cancel_friend_request(uuid) from public;
grant execute on function public.cancel_friend_request(uuid) to authenticated;

-- Removing an existing friendship ------------------------------------------------------------

create or replace function public.remove_friend(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.friendships
  where status = 'accepted'
    and (
      (user_id = auth.uid() and friend_id = target_user_id)
      or (user_id = target_user_id and friend_id = auth.uid())
    );
end;
$$;

comment on function public.remove_friend(uuid) is
  'Ends an accepted friendship: deletes both symmetric rows. Idempotent (no error if the two '
  'are not friends). Only touches status=accepted rows — a pending request is cancelled or '
  'declined instead, via cancel/decline_friend_request(). Either side can re-add the other '
  'later via a fresh invite-code redemption (see friend.docs.md "Suppression d''un ami").';

revoke all on function public.remove_friend(uuid) from public;
grant execute on function public.remove_friend(uuid) to authenticated;
