import type { DogCoOwnerRepository } from "../../domain/repositories/dog-co-owner.repository"

export class CancelCoOwnerInvite {
  constructor(private readonly coOwners: DogCoOwnerRepository) {}

  async execute(dogId: string, inviteeId: string): Promise<void> {
    return this.coOwners.cancelInvite(dogId, inviteeId)
  }
}
