import type { DogCoOwnerRepository } from "../../domain/repositories/dog-co-owner.repository"

export class LeaveCoOwnership {
  constructor(private readonly coOwners: DogCoOwnerRepository) {}

  async execute(dogId: string): Promise<void> {
    return this.coOwners.leaveCoOwnership(dogId)
  }
}
