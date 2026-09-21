-- Rescheduling (see reset_walk_responses_on_reschedule, walks.sql) still resets every
-- non-pending RSVP to 'pending' when start_time/location_text/duration_minutes changes, but
-- no longer clears walk_dogs: a previously confirmed dog stays confirmed, so a co-owner
-- doesn't have to re-pick it after every edit — only the RSVP itself needs re-confirming.
-- See walk.docs.md "Reprogrammation d'une balade".
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
  end if;

  return new;
end;
$$;
