import type { WalkRsvpStatus } from "../../domain/entities/walk"
import type { WalkRepository } from "../../domain/repositories/walk.repository"

export class RespondToWalkInvite {
  constructor(private readonly walks: WalkRepository) {}

  /** myDogIds: the caller's own (owned/co-owned) dog ids — supplied by the caller rather than
   * looked up here, so this use-case only ever depends on WalkRepository, not on the dog
   * domain's repository. */
  async execute(walkId: string, status: WalkRsvpStatus, myDogIds: string[]): Promise<void> {
    await this.walks.respond(walkId, status)
    if (status === "yes") return

    // Given "Changement de réponse" (walk.docs.md): switching away from "yes" releases any of
    // my own dogs I'd confirmed, freeing their quota slot — but never a co-owner's or another
    // participant's dog, so this only ever touches dogs I actually own/co-own.
    const walk = await this.walks.findById(walkId)
    if (!walk) return

    const myDogIdSet = new Set(myDogIds)
    const myConfirmedDogs = walk.dogs.filter((dog) => myDogIdSet.has(dog.id))
    await Promise.all(myConfirmedDogs.map((dog) => this.walks.removeDogFromWalk(walkId, dog.id)))
  }
}
