-- Live updates on a walk's detail screen — see walk.docs.md "Mise à jour en direct des
-- réponses": when another participant changes their RSVP, or a dog gets confirmed/removed,
-- everyone currently viewing that walk's detail sees it update without a manual refresh.
--
-- Both tables' PRIMARY KEY already includes walk_id (see 20260913211731_walks.sql), so the
-- default REPLICA IDENTITY (primary key columns) is enough for the client to filter events by
-- walk_id — no REPLICA IDENTITY FULL needed. Realtime still enforces each table's existing RLS
-- policies, so a client only receives events for walks it's already allowed to SELECT.
alter publication supabase_realtime add table public.walk_participants;
alter publication supabase_realtime add table public.walk_dogs;
