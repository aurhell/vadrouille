export type WalkRsvpStatus = "pending" | "yes" | "no" | "maybe"

export interface WalkParticipant {
  id: string
  username: string
  avatarUrl: string | null
  status: WalkRsvpStatus
}

export interface WalkDog {
  id: string
  name: string
  photoUrl: string | null
  status: "yes" | "maybe"
}

export interface Walk {
  id: string
  locationText: string
  startTime: string
  durationMinutes: number
  organizerId: string | null
  myStatus: WalkRsvpStatus
  participants: WalkParticipant[]
  dogs: WalkDog[]
}
