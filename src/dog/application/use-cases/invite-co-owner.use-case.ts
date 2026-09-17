import type { DogCoOwnerRepository } from "../../domain/repositories/dog-co-owner.repository"

export class InviteCoOwner {
  constructor(private readonly coOwners: DogCoOwnerRepository) {}

  async execute(dogId: string, friendId: string): Promise<void> {
    return this.coOwners.inviteCoOwner(dogId, friendId)
  }
}
