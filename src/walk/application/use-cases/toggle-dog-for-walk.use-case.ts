import { canConfirmDogForWalk } from "../../domain/policies/walk-dog-quota.policy"
import type { WalkRepository } from "../../domain/repositories/walk.repository"

export type ToggleDogForWalkInput = { walkId: string; dogId: string; isConfirmed: boolean; confirmedDogsCount: number }
export type ToggleDogForWalkResult = { success: true } | { success: false; reason: "quota_exceeded" }

export class ToggleDogForWalk {
  constructor(private readonly walks: WalkRepository) {}

  async execute(input: ToggleDogForWalkInput): Promise<ToggleDogForWalkResult> {
    if (input.isConfirmed) {
      await this.walks.removeDogFromWalk(input.walkId, input.dogId)
      return { success: true }
    }

    if (!canConfirmDogForWalk(input.confirmedDogsCount)) {
      return { success: false, reason: "quota_exceeded" }
    }

    await this.walks.confirmDog(input.walkId, input.dogId)
    return { success: true }
  }
}
