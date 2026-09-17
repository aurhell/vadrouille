-- Cancelling a walk (organizer only, before it has started) — see walk.docs.md "Annulation
-- d'une balade". Deleting the walks row cascades to walk_participants and walk_dogs (both
-- ON DELETE CASCADE, see 20260913211731_walks.sql), so a single DELETE removes it for every
-- participant in one shot — same "no per-participant notification at MVP" tradeoff already
-- accepted for co-ownership removal (see dog.docs.md).

create policy "walks_delete_organizer_future_only"
  on public.walks
  for delete
  to authenticated
  using (organizer_id = auth.uid() and start_time > now());
