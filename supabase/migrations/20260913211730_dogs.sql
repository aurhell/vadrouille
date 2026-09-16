create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  -- Redundant with dog_owners(role='owner'), kept so the dogs SELECT/INSERT RLS policies
  -- can check "did I just create this row" as a plain column comparison instead of a
  -- subquery on dog_owners. That subquery-based check works fine on its own, but combined
  -- with INSERT ... RETURNING (what every Supabase client insert does) it fails: Postgres
  -- evaluates the RETURNING re-check against a snapshot taken before the AFTER INSERT
  -- trigger below commits the matching dog_owners row, even though it's already visible to
  -- every later statement in the same transaction. A plain column avoids the whole class of
  -- bug.
  --
  -- SET NULL, not CASCADE: this column must never be the reason a dog gets deleted. A
  -- co-owned dog has to survive its creator's account deletion (see rgpd-securite.md —
  -- ownership for that purpose is dog_owners, not this column); actual deletion of a
  -- solely-owned dog is handled explicitly by supabase/functions/delete-account.
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  name text not null,
  breed text,
  birth_date date,
  photo_url text,
  created_at timestamptz not null default now()
);

create table public.dog_owners (
  dog_id uuid not null references public.dogs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'co-owner')),
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (dog_id, user_id)
);

comment on table public.dog_owners is
  'Ownership/co-ownership of a dog. A co-owner invite must be accepted before it grants access.';

-- SECURITY DEFINER helper so dog_owners' own SELECT policy doesn't reference dog_owners
-- from within itself — a direct self-referencing subquery triggers Postgres' "infinite
-- recursion detected in policy" guard.
create or replace function public.user_dog_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select dog_id from public.dog_owners where user_id = auth.uid();
$$;

-- Same rationale: any policy on dog_owners that needs to check "is auth.uid() an
-- owner/co-owner of this dog" must go through a SECURITY DEFINER function rather than a
-- raw subquery on dog_owners, or Postgres' RLS recursion guard rejects it outright — even
-- when, unlike user_dog_ids() above, the subquery is used from an INSERT/UPDATE policy
-- rather than dog_owners' own SELECT policy.
create or replace function public.is_dog_owner(target_dog_id uuid, required_role text default null, required_status text default 'accepted')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.dog_owners do_
    where do_.dog_id = target_dog_id
      and do_.user_id = auth.uid()
      and (required_role is null or do_.role = required_role)
      and (required_status is null or do_.status = required_status)
  );
$$;

-- On insert, the creator becomes the accepted owner (see architecture-technique.md
-- "zero API custom" principle: this replaces a would-be transactional client call).
create or replace function public.create_dog_owner_on_dog_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.dog_owners (dog_id, user_id, role, status)
  values (new.id, new.created_by, 'owner', 'accepted');
  return new;
end;
$$;

create trigger dogs_create_owner
  after insert on public.dogs
  for each row
  execute function public.create_dog_owner_on_dog_insert();

-- RLS: dogs -------------------------------------------------------------------

alter table public.dogs enable row level security;

-- Additional SELECT visibility ("dog confirmed on a shared walk") is added as a second,
-- OR'd policy in the walks migration, once walk_dogs/walk_participants exist.
create policy "dogs_select_owner"
  on public.dogs
  for select
  to authenticated
  using (created_by = auth.uid() or public.is_dog_owner(id));

create policy "dogs_insert_authenticated"
  on public.dogs
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "dogs_update_owner_or_accepted_co_owner"
  on public.dogs
  for update
  to authenticated
  using (public.is_dog_owner(id))
  with check (public.is_dog_owner(id));

create policy "dogs_delete_owner_only"
  on public.dogs
  for delete
  to authenticated
  using (public.is_dog_owner(id, required_role => 'owner', required_status => null));

-- RLS: dog_owners ---------------------------------------------------------------

alter table public.dog_owners enable row level security;

create policy "dog_owners_select_own_or_own_dogs"
  on public.dog_owners
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or dog_id in (select public.user_dog_ids())
  );

-- Co-owner invite: requester must be an accepted owner of the dog, and the invited user
-- must be a friend of the requester.
create policy "dog_owners_insert_owner_invites_friend"
  on public.dog_owners
  for insert
  to authenticated
  with check (
    role = 'co-owner'
    and status = 'pending'
    and public.is_dog_owner(dog_id, required_role => 'owner', required_status => 'accepted')
    and exists (
      select 1
      from public.friendships f
      where f.user_id = auth.uid()
        and f.friend_id = dog_owners.user_id
        and f.status = 'accepted'
    )
  );

-- Accepting a pending co-owner invite: only the invitee, only pending -> accepted.
create policy "dog_owners_update_accept_own_invite"
  on public.dog_owners
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and status = 'pending'
  )
  with check (
    user_id = auth.uid()
    and status = 'accepted'
    and role = 'co-owner'
  );

-- Decline a pending invite, or voluntarily leave as an accepted co-owner. The owner role
-- can never be removed through this policy (see modele-de-donnees.md "Points ouverts").
create policy "dog_owners_delete_own_non_owner_row"
  on public.dog_owners
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    and role = 'co-owner'
  );
