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

-- Note: the SELECT policy needs `dog_owners` and `walk_participants`, created in later
-- migrations — it is added at the end of the walks migration once every table exists.

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
