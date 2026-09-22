import type { Walk, WalkRsvpStatus } from "../domain/entities/walk"
import type { Walk as DesignSystemWalk, WalkParticipant as DesignSystemParticipant } from "@/shared/ui/types"

const RSVP_STATUS: Record<WalkRsvpStatus, DesignSystemParticipant["status"]> = {
  yes: "confirmed",
  no: "declined",
  maybe: "maybe",
  pending: "pending",
}

/** WalkCard only needs a friend/rsvp shape and a dog count — it doesn't otherwise care which
 * participant a dog is tied to, so every confirmed dog is attached to the organizer's entry.
 * Shared by the upcoming and past walk lists, both of which render walks as `WalkCard`. */
export function toDisplayWalk(walk: Walk): DesignSystemWalk {
  const organizer = walk.participants.find((p) => p.id === walk.organizerId)
  const dogs = walk.dogs.map((dog) => ({ id: dog.id, name: dog.name, breed: "", ageYears: 0, photoUrl: dog.photoUrl ?? undefined }))

  return {
    id: walk.id,
    place: walk.locationText,
    startsAt: walk.startTime,
    durationMinutes: walk.durationMinutes,
    dogCapacity: 10,
    host: organizer ? { id: organizer.id, username: organizer.username, avatarUrl: organizer.avatarUrl ?? undefined } : { id: "", username: "?" },
    myStatus: RSVP_STATUS[walk.myStatus],
    participants: walk.participants.map((participant) => ({
      friend: { id: participant.id, username: participant.username, avatarUrl: participant.avatarUrl ?? undefined },
      status: RSVP_STATUS[participant.status],
      dogs: participant.id === walk.organizerId ? dogs : [],
    })),
  }
}
