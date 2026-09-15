create table public.walks (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references public.profiles (id) on delete set null,
  location_text text not null,
  start_time timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  created_at timestamptz not null default now()
);

comment on column public.walks.organizer_id is
  'Nullable: set to NULL when the organizer''s account is deleted, past walks are kept for '
  'other participants'' history (see rgpd-securite.md).';

-- Personal RSVP, independent of which dogs attend.
create table public.walk_participants (
  walk_id uuid not null references public.walks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'yes', 'no', 'maybe')),
  responded_at timestamptz,
  primary key (walk_id, user_id)
);

-- Per-dog confirmation, shared between co-owners. No 'no' status: an unconfirmed dog is
-- simply absent from this table (see modele-de-donnees.md).
create table public.walk_dogs (
  walk_id uuid not null references public.walks (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  status text not null check (status in ('yes', 'maybe')),
  -- SET NULL, not CASCADE: this is only an audit column ("who last confirmed"), the
  -- confirmation itself (this row) must survive its author's account being deleted — see
  -- rgpd-securite.md's deletion cascade, and supabase/functions/delete-account.
  updated_by uuid references public.profiles (id) on delete set null,
  responded_at timestamptz not null default now(),
  primary key (walk_id, dog_id)
);

comment on table public.walk_dogs is
  'One row per (walk, dog) — the PRIMARY KEY natively prevents double-counting a shared dog '
  'confirmed by two different co-owners.';

-- Response window: RSVP and dog confirmation lock 5 minutes after start_time.
create or replace function public.walk_response_window_open(p_walk_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.walks w
    where w.id = p_walk_id
      and now() < w.start_time + interval '5 minutes'
  );
$$;

comment on function public.walk_response_window_open(uuid) is
  'True until 5 minutes after the walk''s start_time (see modele-de-donnees.md "Fenetre de reponse").';

-- Capacity: 10 confirmed ('yes') dogs max per walk. Deduplication is native via the
-- (walk_id, dog_id) primary key, so this is a simple COUNT guard. SECURITY DEFINER so the
-- count is always the true source of truth, independent of the caller's RLS visibility.
create or replace function public.enforce_walk_dogs_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  confirmed_count integer;
begin
  if new.status = 'yes' then
    select count(*) into confirmed_count
    from public.walk_dogs
    where walk_id = new.walk_id
      and status = 'yes'
      and dog_id <> new.dog_id;

    if confirmed_count >= 10 then
      raise exception 'walk_dogs_capacity_exceeded' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create trigger walk_dogs_enforce_capacity
  before insert or update on public.walk_dogs
  for each row
  execute function public.enforce_walk_dogs_capacity();

-- Rescheduling (start_time, location_text or duration_minutes changes on an already
-- notified walk) resets every response: non-pending participants go back to 'pending', and
-- all walk_dogs rows are deleted. SECURITY DEFINER because the organizer must be able to
-- reset other participants' rows, which their own RLS policies would otherwise forbid.
create or replace function public.reset_walk_responses_on_reschedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.start_time is distinct from old.start_time
     or new.location_text is distinct from old.location_text
     or new.duration_minutes is distinct from old.duration_minutes
  then
    update public.walk_participants
    set status = 'pending', responded_at = null
    where walk_id = new.id
      and status <> 'pending';

    delete from public.walk_dogs
    where walk_id = new.id;
  end if;

  return new;
end;
$$;

create trigger walks_reset_responses_on_reschedule
  after update on public.walks
  for each row
  execute function public.reset_walk_responses_on_reschedule();

-- RLS: walks --------------------------------------------------------------------

-- walks' SELECT policy is defined further down, right after the user_walk_ids() helper it
-- needs (see that section for why a raw walk_participants subquery here would create an
-- indirect RLS recursion cycle: walk_participants insert -> walks select -> walk_participants
-- select).

alter table public.walks enable row level security;

create policy "walks_insert_as_organizer_future_only"
  on public.walks
  for insert
  to authenticated
  with check (organizer_id = auth.uid() and start_time > now());

-- USING checks the existing row (edit forbidden once start_time has passed); WITH CHECK
-- keeps the organizer unchanged.
create policy "walks_update_organizer_future_only"
  on public.walks
  for update
  to authenticated
  using (organizer_id = auth.uid() and start_time > now())
  with check (organizer_id = auth.uid());

-- No DELETE policy at MVP (see modele-de-donnees.md — cancellation is a post-MVP feature;
-- account deletion cascades via the service_role Edge Function instead).

-- RLS: walk_participants ---------------------------------------------------------

-- SECURITY DEFINER helper so walk_participants' own SELECT policy doesn't reference
-- walk_participants from within itself (see the same pattern/rationale for user_dog_ids()
-- in the dogs migration — a direct self-referencing subquery triggers Postgres' "infinite
-- recursion detected in policy" guard).
create or replace function public.user_walk_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select walk_id from public.walk_participants where user_id = auth.uid();
$$;

create policy "walks_select_organizer_or_participant"
  on public.walks
  for select
  to authenticated
  using (
    organizer_id = auth.uid()
    or id in (select public.user_walk_ids())
  );

alter table public.walk_participants enable row level security;

-- Visibility mirrors the parent walk: any participant of a walk can see every participant row.
-- Three clauses rather than one: `user_id = auth.uid()` (own row) and the organizer-of-the-
-- parent-walk check are both plain/cross-table comparisons so they hold even for the very row
-- just inserted in the current statement — `walk_id in (select user_walk_ids())` alone would
-- not, since a row cannot see itself via a self-referential subquery within the same INSERT
-- ... RETURNING (its cmin equals, rather than precedes, the checking command's command id).
create policy "walk_participants_select_shared_walk"
  on public.walk_participants
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or walk_id in (select public.user_walk_ids())
    or exists (
      select 1
      from public.walks w
      where w.id = walk_participants.walk_id
        and w.organizer_id = auth.uid()
    )
  );

-- The organizer creates their own 'yes' row and every invited friend's 'pending' row at
-- walk creation.
create policy "walk_participants_insert_by_organizer"
  on public.walk_participants
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.walks w
      where w.id = walk_participants.walk_id
        and w.organizer_id = auth.uid()
    )
  );

create policy "walk_participants_update_own_rsvp_within_window"
  on public.walk_participants
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and public.walk_response_window_open(walk_id)
  )
  with check (user_id = auth.uid());

-- No DELETE policy: resetting a response is an UPDATE back to 'pending', not a row deletion.

-- RLS: walk_dogs ------------------------------------------------------------------

alter table public.walk_dogs enable row level security;

create policy "walk_dogs_select_shared_walk"
  on public.walk_dogs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.walk_participants wp
      where wp.walk_id = walk_dogs.walk_id
        and wp.user_id = auth.uid()
    )
  );

create policy "walk_dogs_insert_owner_within_window"
  on public.walk_dogs
  for insert
  to authenticated
  with check (
    public.is_dog_owner(dog_id)
    and public.walk_response_window_open(walk_id)
  );

create policy "walk_dogs_update_owner_within_window"
  on public.walk_dogs
  for update
  to authenticated
  using (
    public.is_dog_owner(dog_id)
    and public.walk_response_window_open(walk_id)
  )
  with check (
    public.is_dog_owner(dog_id)
    and public.walk_response_window_open(walk_id)
  );

create policy "walk_dogs_delete_owner_within_window"
  on public.walk_dogs
  for delete
  to authenticated
  using (
    public.is_dog_owner(dog_id)
    and public.walk_response_window_open(walk_id)
  );

-- Deferred cross-table policies -----------------------------------------------------
-- These need tables from this migration, so they were deferred from profiles.sql/dogs.sql
-- (multiple permissive policies for the same command are combined with OR).

create policy "profiles_select_shared_walk_or_dog"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.walk_participants mine
      join public.walk_participants theirs
        on theirs.walk_id = mine.walk_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
    or exists (
      select 1
      from public.dog_owners mine
      join public.dog_owners theirs
        on theirs.dog_id = mine.dog_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

create policy "dogs_select_confirmed_on_shared_walk"
  on public.dogs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.walk_dogs wd
      join public.walk_participants wp
        on wp.walk_id = wd.walk_id
      where wd.dog_id = dogs.id
        and wp.user_id = auth.uid()
    )
  );
