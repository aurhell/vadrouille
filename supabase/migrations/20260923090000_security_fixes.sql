-- Security audit fixes — see the audit report for exploit details. Five issues, all in
-- previously-shipped migrations:
--
-- 1. CRITICAL: send_push_notifications() had no revoke/grant, unlike every other RPC in this
--    project (compare lookup_invite_code, redeem_invite_code, etc. in
--    20260913211729_friendships.sql) — PostgREST exposes any public-schema function callable
--    by its role by default, so any authenticated client could spam/phish an arbitrary push
--    to any user.
-- 2 & 3. HIGH: two UPDATE policies (dog_owners, walk_participants) check `user_id = auth.uid()`
--    on both USING and WITH CHECK, but never pin the row's other identity column (dog_id /
--    walk_id) — RLS's USING evaluates against the OLD row and WITH CHECK against the NEW row,
--    with no built-in way to compare the two in a single policy expression, so nothing stopped
--    a client from UPDATEing their own row's dog_id/walk_id to someone else's target row,
--    effectively "moving" a legitimate invite/RSVP onto an arbitrary dog/walk they were never
--    invited to. Fixed with a BEFORE UPDATE trigger enforcing key immutability — the standard
--    Postgres pattern for this, since RLS policies alone can't cross-reference OLD/NEW.
-- 4. MEDIUM: walk_dogs INSERT/UPDATE only checked dog ownership + response window, never that
--    the confirming user is actually a participant of that walk — in every legitimate flow
--    this is already implied (you can't even SELECT/see a walk to confirm a dog on it unless
--    you're the organizer or a participant, see modele-de-donnees.md walk_dogs SELECT policy),
--    so this closes a direct-request bypass without changing any real user flow.
-- 5. MEDIUM: walks_update_organizer_future_only's WITH CHECK didn't re-verify start_time in
--    the future on the NEW row, unlike the INSERT policy — an organizer could reprogram their
--    own walk into the past.

-- 1a. Lock down send_push_notifications() — internal-only, called by the SECURITY DEFINER
-- trigger functions below it (20260922000000_push_notifications.sql), which run as their
-- owner and don't need an explicit grant to call a function that owner already owns.
--
-- `revoke ... from public` alone is NOT enough here, and turns out never to have been enough
-- anywhere else in this project either (see 1b below) — this local Supabase stack grants
-- EXECUTE on every new `public` schema function directly to the named roles anon/
-- authenticated/service_role at creation time (not via the PUBLIC pseudo-role), so `revoke
-- ... from public` is a no-op against them. Confirmed directly against pg_proc.proacl: every
-- existing "revoke all from public; grant execute to authenticated" RPC in this codebase
-- (lookup_invite_code, redeem_invite_code, accept/decline/cancel_friend_request,
-- remove_friend, regenerate_invite_code) still had `anon` in its ACL despite that migration
-- statement's own intent. The fix is to name the roles to revoke from explicitly.
revoke execute on function public.send_push_notifications(uuid[], text, text, jsonb) from public, anon, authenticated, service_role;

-- 1b. Same root cause, same fix, applied to every existing RPC that was already meant to be
-- authenticated-only per its own "grant execute ... to authenticated" statement — anon has
-- been able to call all of these since they first shipped. Of these, lookup_invite_code is
-- the one with real exploitable impact: it does no auth.uid() check at all (by design — any
-- code holder should get the preview), so a fully anonymous caller (no account, just the
-- public anon key already in the app bundle) could look up any profile by invite code with
-- zero authentication. The other five safely no-op for a NULL auth.uid() (their WHERE
-- clauses/inserts never match/succeed), so this closes an availability/defense-in-depth gap
-- for them rather than a live data leak, but restores every migration's own stated intent
-- either way. regenerate_invite_code() is SECURITY INVOKER (RLS-protected regardless) —
-- revoked here too only for consistency with its own migration's stated intent.
revoke execute on function public.lookup_invite_code(text) from anon, service_role;
revoke execute on function public.redeem_invite_code(text) from anon, service_role;
revoke execute on function public.accept_friend_request(uuid) from anon, service_role;
revoke execute on function public.decline_friend_request(uuid) from anon, service_role;
revoke execute on function public.cancel_friend_request(uuid) from anon, service_role;
revoke execute on function public.remove_friend(uuid) from anon, service_role;
-- regenerate_invite_code() never had a `revoke all from public` in its own migration at all
-- (unlike the six above) — added here too, even though it's SECURITY INVOKER and therefore
-- already RLS-protected (its UPDATE can only ever touch the caller's own profiles row).
revoke execute on function public.regenerate_invite_code() from public, anon, service_role;

-- 2. dog_owners: pin dog_id/user_id immutable on UPDATE (only `status`/`role` should change).
create or replace function public.prevent_dog_owners_key_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.dog_id is distinct from old.dog_id or new.user_id is distinct from old.user_id then
    raise exception 'dog_owners: dog_id and user_id are immutable, update rejected' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger dog_owners_immutable_keys
  before update on public.dog_owners
  for each row
  execute function public.prevent_dog_owners_key_change();

-- 3. walk_participants: pin walk_id/user_id immutable on UPDATE (only `status`/`responded_at`
-- should change).
create or replace function public.prevent_walk_participants_key_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.walk_id is distinct from old.walk_id or new.user_id is distinct from old.user_id then
    raise exception 'walk_participants: walk_id and user_id are immutable, update rejected' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger walk_participants_immutable_keys
  before update on public.walk_participants
  for each row
  execute function public.prevent_walk_participants_key_change();

-- 4. walk_dogs: also require the confirming user to already be a participant of that walk.
drop policy "walk_dogs_insert_owner_within_window" on public.walk_dogs;
create policy "walk_dogs_insert_owner_within_window"
  on public.walk_dogs
  for insert
  to authenticated
  with check (
    public.is_dog_owner(dog_id)
    and public.walk_response_window_open(walk_id)
    and exists (
      select 1
      from public.walk_participants wp
      where wp.walk_id = walk_dogs.walk_id
        and wp.user_id = auth.uid()
    )
  );

drop policy "walk_dogs_update_owner_within_window" on public.walk_dogs;
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
    and exists (
      select 1
      from public.walk_participants wp
      where wp.walk_id = walk_dogs.walk_id
        and wp.user_id = auth.uid()
    )
  );

-- 5. walks: re-verify start_time is still in the future on the reprogrammed row.
drop policy "walks_update_organizer_future_only" on public.walks;
create policy "walks_update_organizer_future_only"
  on public.walks
  for update
  to authenticated
  using (organizer_id = auth.uid() and start_time > now())
  with check (organizer_id = auth.uid() and start_time > now());
