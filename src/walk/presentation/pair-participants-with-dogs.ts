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
 * never duplicated under every co-owner present — see walk.docs.md "Une seule carte
 * Participants". */
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
