import type { Dog } from "../domain/entities/dog"

/** Deleting a dog cascades to every dog_owners row for it (FK ON DELETE CASCADE) — a
 * co-owner silently loses access too, with no warning of their own. Surfacing that here is
 * the only safeguard, since dog.docs.md doesn't otherwise cover deleting a shared dog. */
export function deleteDogMessage(dog: Dog): string {
  const base = "Cette action est définitive, y compris sa photo."
  if (dog.coOwners.length === 0) return base

  const names = dog.coOwners.map((coOwner) => coOwner.username).join(", ")
  return `${base} ${dog.name} disparaîtra aussi du foyer partagé de ${names}.`
}
