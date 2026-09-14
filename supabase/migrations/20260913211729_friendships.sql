create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  constraint friendships_no_self_friend check (user_id <> friend_id)
);

comment on table public.friendships is
  'Directed friendship edge. A mutual friendship is two rows (user->friend and friend->user), '
  'created together by redeem_invite_code().';

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
  );
$$;

comment on function public.is_friend_of(uuid) is
  'True if target_user_id is a friend of the current authenticated user.';

-- RLS -------------------------------------------------------------------------

alter table public.friendships enable row level security;

create policy "friendships_select_own"
  on public.friendships
  for select
  to authenticated
  using (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE client policy: creation goes exclusively through
-- redeem_invite_code() below (SECURITY DEFINER bypasses RLS for that one transaction).
-- There is no friend-removal feature at MVP (see roadmap.md).

-- Friend code redemption --------------------------------------------------------

create or replace function public.redeem_invite_code(code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user_id uuid;
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

  insert into public.friendships (user_id, friend_id)
  values (auth.uid(), target_user_id)
  on conflict (user_id, friend_id) do nothing;

  insert into public.friendships (user_id, friend_id)
  values (target_user_id, auth.uid())
  on conflict (user_id, friend_id) do nothing;
end;
$$;

comment on function public.redeem_invite_code(text) is
  'Redeems a friend''s invite code: verifies it, blocks self-redemption, and creates the '
  'bidirectional friendships rows. Runs as SECURITY DEFINER because clients must never be '
  'able to SELECT profiles.invite_code directly (see modele-de-donnees.md).';

revoke all on function public.redeem_invite_code(text) from public;
grant execute on function public.redeem_invite_code(text) to authenticated;
