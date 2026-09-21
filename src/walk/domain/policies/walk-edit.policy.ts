export type WalkEditValidationResult = { valid: true } | { valid: false; reason: "location_required" | "start_time_past" }

/** Same location/start-time rules as walk creation (see walk-creation.policy.ts) — no dog
 * quota check here: reprogramming no longer touches confirmed dogs at all (only the RSVP
 * status resets, see modele-de-donnees.md "Modification d'une balade déjà envoyée"), so
 * there's no dog selection on this screen to validate against the quota. */
export function validateWalkEdit(input: { locationText: string; startTime: string }): WalkEditValidationResult {
  if (input.locationText.trim().length === 0) {
    return { valid: false, reason: "location_required" }
  }
  if (new Date(input.startTime).getTime() <= Date.now()) {
    return { valid: false, reason: "start_time_past" }
  }
  return { valid: true }
}
