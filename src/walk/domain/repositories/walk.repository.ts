import type { Walk, WalkRsvpStatus } from "../entities/walk"

export interface WalkInput {
  locationText: string
  startTime: string
  durationMinutes: number
  dogIds: string[]
  friendIds: string[]
}

export interface WalkRepository {
  /** Upcoming walks (organizer or invited participant), soonest first. */
  list(): Promise<Walk[]>
  findById(id: string): Promise<Walk | null>
  /** Creates the walk, enrolls the caller as "yes", invites each friend as "pending" and
   * confirms each dog as "yes" (server-side inserts, RLS-enforced). */
  create(input: WalkInput): Promise<Walk>
  /** RLS-enforced: only the organizer can cancel, and only before it has started — see
   * walk.docs.md "Annulation d'une balade". Cascades to every participant/dog row. */
  remove(id: string): Promise<void>
  /** My own RSVP on this walk. RLS-enforced: only my own row, only within the response
   * window (H+5min) — see walk.docs.md "Réponse à une invitation". */
  respond(walkId: string, status: WalkRsvpStatus): Promise<void>
  /** Confirms one of my (owned/co-owned) dogs for the walk. RLS-enforced ownership + response
   * window; capacity (max 10) enforced server-side by a trigger, client-checked first for UX. */
  confirmDog(walkId: string, dogId: string): Promise<void>
  removeDogFromWalk(walkId: string, dogId: string): Promise<void>
}
