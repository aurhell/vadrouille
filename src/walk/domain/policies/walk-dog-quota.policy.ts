const MAX_DOGS_PER_WALK = 10

/** Mirrors the SQL trigger enforce_walk_dogs_capacity() — this copy is for immediate UI
 * feedback before the round trip, the trigger stays the actual source of truth (see
 * modele-de-donnees.md "Quota de chiens"). */
export function canConfirmDogForWalk(confirmedDogsCount: number): boolean {
  return confirmedDogsCount < MAX_DOGS_PER_WALK
}
