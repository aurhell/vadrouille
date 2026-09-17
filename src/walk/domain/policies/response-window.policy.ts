const RESPONSE_WINDOW_MS = 5 * 60 * 1000

/** Mirrors the SQL function walk_response_window_open() — this copy is for immediate UI
 * feedback (disabling the RSVP bar), RLS on walk_participants/walk_dogs stays the actual
 * enforcement (see modele-de-donnees.md "Fenêtre de réponse"). */
export function canRespondToWalk(walk: { startTime: string }): boolean {
  return Date.now() < new Date(walk.startTime).getTime() + RESPONSE_WINDOW_MS
}
