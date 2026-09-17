import type { DogCoOwnerRepository } from "../../domain/repositories/dog-co-owner.repository"

export class DeclineCoOwnerInvite {
  constructor(private readonly coOwners: DogCoOwnerRepository) {}

  async execute(dogId: string): Promise<void> {
    return this.coOwners.declineInvite(dogId)
  }
}
