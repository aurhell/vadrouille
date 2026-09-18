const MAX_DOGS_PER_WALK = 10
const NEAR_LIMIT_THRESHOLD = 2

/** Mirrors the SQL trigger enforce_walk_dogs_capacity() — this copy is for immediate UI
 * feedback before the round trip, the trigger stays the actual source of truth (see
 * modele-de-donnees.md "Quota de chiens"). */
export function canConfirmDogForWalk(confirmedDogsCount: number): boolean {
  return confirmedDogsCount < MAX_DOGS_PER_WALK
}

/** Deliberately quiet until the quota actually matters — no running "X/10" count anywhere in
 * the UI (see walk.docs.md "Quota de 10 chiens" for why), just a nudge once slots are scarce. */
export function dogQuotaMessage(confirmedDogsCount: number): string | undefined {
  const remaining = MAX_DOGS_PER_WALK - confirmedDogsCount
  if (remaining <= 0) return "Complet"
  if (remaining > NEAR_LIMIT_THRESHOLD) return undefined
  return remaining === 1 ? "Plus qu'une place" : `Plus que ${remaining} places`
}
