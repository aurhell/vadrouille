-- The original policy only checked that the inserter is the walk's organizer, not that each
-- invited user_id is actually one of their friends — unlike the equivalent co-owner-invite
-- policy on dog_owners (dog_owners_insert_owner_invites_friend). Client-side, WalkFormScreen
-- only ever lists friends to invite, but nothing stopped a crafted request from adding an
-- arbitrary user as a walk participant. See walk.docs.md "Sélection d'un ami qui n'est pas
-- dans ma liste".

drop policy "walk_participants_insert_by_organizer" on public.walk_participants;

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
    and (
      -- The organizer's own row (status='yes'), inserted alongside invited friends.
      walk_participants.user_id = auth.uid()
      or exists (
        select 1
        from public.friendships f
        where f.user_id = auth.uid()
          and f.friend_id = walk_participants.user_id
          and f.status = 'accepted'
      )
    )
  );
