-- profiles: one row per auth.users, created by the client during onboarding (not by trigger,
-- since choosing a username is a required onboarding step, see rgpd-securite.md).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  avatar_url text,
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_.]{3,20}$')
);

comment on table public.profiles is 'App-level user profile, one per auth.users row.';
comment on column public.profiles.invite_code is 'Permanent, regenerable personal code used to add friends (see redeem_invite_code).';

-- Invite code generation --------------------------------------------------

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(
      substr(
        translate(
          encode(extensions.gen_random_bytes(6), 'base64'),
          '+/=', ''
        ),
        1, 8
      )
    );

    exit when not exists (
      select 1 from public.profiles where invite_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

comment on function public.generate_invite_code() is
  'Generates a unique 8-character invite code candidate for profiles.invite_code.';

-- security invoker (not definer): the UPDATE only needs to satisfy the ordinary
-- profiles_update_self policy below, on the caller's own row. generate_invite_code() itself
-- is still security definer, since checking uniqueness needs to read invite_code values the
-- caller can't otherwise SELECT.
create or replace function public.regenerate_invite_code()
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_code text;
begin
  new_code := public.generate_invite_code();

  update public.profiles
  set invite_code = new_code
  where id = auth.uid();

  return new_code;
end;
$$;

comment on function public.regenerate_invite_code() is
  'Replaces the caller''s own invite code with a freshly generated one — the old code stops '
  'working immediately (see friend.docs.md "Régénération du code").';

grant execute on function public.regenerate_invite_code() to authenticated;

create or replace function public.set_profile_invite_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.invite_code is null then
    new.invite_code := public.generate_invite_code();
  end if;
  return new;
end;
$$;

create trigger profiles_set_invite_code
  before insert on public.profiles
  for each row
  execute function public.set_profile_invite_code();

-- RLS -----------------------------------------------------------------------

alter table public.profiles enable row level security;

-- Own profile is always visible — no dependency on later tables, so added here directly.
-- The friend / shared-walk / shared-dog clauses are added as further OR'd policies once
-- their tables exist (friendships.sql, walks.sql).
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_self"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No DELETE policy: account deletion goes exclusively through the service_role Edge Function.
