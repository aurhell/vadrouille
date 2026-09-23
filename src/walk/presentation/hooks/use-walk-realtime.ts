import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { supabase } from "@/shared/supabase/client"

import { walkQueryKey } from "./use-walks"

// Module-scope, not per-render: guarantees every channel topic is unique even across a rapid
// unmount/remount of the same walkId (React dev-mode's double effect invocation, Fast
// Refresh). `supabase.removeChannel()` unregisters a channel asynchronously — if a new effect
// run creates a channel with the exact same topic before that finishes, supabase-js hands
// back the still-subscribed old channel instead of a fresh one, and the `.on()` calls below
// throw "cannot add postgres_changes callbacks ... after subscribe()". A unique suffix per
// mount sidesteps the race entirely instead of depending on cleanup timing.
let channelSeq = 0

/** Keeps a walk's detail screen live — see walk.docs.md "Mise à jour en direct des réponses":
 * when another participant changes their RSVP, or a dog is confirmed/removed, the screen
 * updates without a manual pull-to-refresh. Invalidates the query cache on any change rather
 * than patching it from the raw payload, so the existing `findById` merge (participants ×
 * dogs × my status) stays the single source of truth for that shape. RLS still applies:
 * Realtime only delivers rows the client is already allowed to SELECT. */
export function useWalkRealtime(walkId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!walkId) return

    const id = walkId
    function invalidate() {
      queryClient.invalidateQueries({ queryKey: walkQueryKey(id) })
    }

    channelSeq += 1
    const channel = supabase
      .channel(`walk-detail-${id}-${channelSeq}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "walk_participants", filter: `walk_id=eq.${id}` }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "walk_dogs", filter: `walk_id=eq.${id}` }, invalidate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [walkId, queryClient])
}
