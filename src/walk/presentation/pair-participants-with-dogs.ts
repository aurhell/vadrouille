import type { Walk, WalkDog, WalkRsvpStatus } from "../domain/entities/walk"

export interface ParticipantWithDogs {
  id: string
  username: string
  avatarUrl: string | null
  status: WalkRsvpStatus
  dogs: WalkDog[]
}

export interface PairedWalkDogs {
  participants: ParticipantWithDogs[]
  /** A confirmed dog whose confirming account has since been deleted (`updated_by` set to
   * null), or — in principle — one attributed to someone no longer a participant. Kept
   * visible rather than silently dropped, just not attached to a specific person. */
  unattributed: WalkDog[]
}

/** One dog is only ever paired with the single participant who confirmed it (`updatedBy`),
 * never duplicated under every co-owner present — see walk.docs.md "Détail de balade — deux
 * cartes séparées, pas fusionnées". */
export function pairParticipantsWithDogs(walk: Walk): PairedWalkDogs {
  const participantIds = new Set(walk.participants.map((p) => p.id))
  const dogsByParticipant = new Map<string, WalkDog[]>()
  const unattributed: WalkDog[] = []

  for (const dog of walk.dogs) {
    if (dog.updatedBy && participantIds.has(dog.updatedBy)) {
      const list = dogsByParticipant.get(dog.updatedBy) ?? []
      list.push(dog)
      dogsByParticipant.set(dog.updatedBy, list)
    } else {
      unattributed.push(dog)
    }
  }

  return {
    participants: walk.participants.map((p) => ({ ...p, dogs: dogsByParticipant.get(p.id) ?? [] })),
    unattributed,
  }
}

/** Name to show for whoever organized the walk. `organizerId` is `ON DELETE SET NULL` on
 * `walks` (see modele-de-donnees.md) — a deleted account's future walks are cancelled by the
 * delete-account Edge Function, but a past walk they organized survives with a null
 * `organizerId` and no participant row for them either (`walk_participants.user_id` cascades),
 * so there is no username left to recover — see account.docs.md "Utilisateur supprimé". */
export function organizerDisplayName(walk: Walk, userId: string | undefined): string {
  if (walk.organizerId === null) return "Utilisateur supprimé"
  if (walk.organizerId === userId) return "toi"
  return walk.participants.find((p) => p.id === walk.organizerId)?.username ?? "Utilisateur supprimé"
}
