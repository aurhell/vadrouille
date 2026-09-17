import type { Walk, WalkDog, WalkParticipant, WalkRsvpStatus } from "../../domain/entities/walk"

/** Shape of a row from the `walks` table (see supabase/migrations/*_walks.sql). */
export interface WalkRow {
  id: string
  organizer_id: string | null
  location_text: string
  start_time: string
  duration_minutes: number
}

export interface ParticipantRow {
  status: WalkRsvpStatus
  user: { id: string; username: string; avatar_url: string | null }
}

export interface WalkDogRow {
  status: "yes" | "maybe"
  dog: { id: string; name: string; photo_url: string | null }
}

export function toWalk(row: WalkRow, participantRows: ParticipantRow[], dogRows: WalkDogRow[], userId: string): Walk {
  const participants: WalkParticipant[] = participantRows.map((p) => ({
    id: p.user.id,
    username: p.user.username,
    avatarUrl: p.user.avatar_url,
    status: p.status,
  }))
  const dogs: WalkDog[] = dogRows.map((d) => ({ id: d.dog.id, name: d.dog.name, photoUrl: d.dog.photo_url, status: d.status }))

  return {
    id: row.id,
    locationText: row.location_text,
    startTime: row.start_time,
    durationMinutes: row.duration_minutes,
    organizerId: row.organizer_id,
    myStatus: participants.find((p) => p.id === userId)?.status ?? "pending",
    participants,
    dogs,
  }
}
