import type { DogCoOwnerRepository } from "../../domain/repositories/dog-co-owner.repository"

export class AcceptCoOwnerInvite {
  constructor(private readonly coOwners: DogCoOwnerRepository) {}

  async execute(dogId: string): Promise<void> {
    return this.coOwners.acceptInvite(dogId)
  }
}
