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
  /** Who confirmed this dog for the walk — an audit field (see modele-de-donnees.md), not an
   * ownership record (a dog can have several owners). Used to pair a dog with a participant
   * for display; null when the confirming account was since deleted (ON DELETE SET NULL). */
  updatedBy: string | null
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
