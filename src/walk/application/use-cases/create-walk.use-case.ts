import { validateWalkCreation } from "../../domain/policies/walk-creation.policy"

import type { Walk } from "../../domain/entities/walk"
import type { WalkInput, WalkRepository } from "../../domain/repositories/walk.repository"

export type CreateWalkResult =
  | { success: true; walk: Walk }
  | { success: false; reason: "location_required" | "start_time_past" | "too_many_dogs" }

export class CreateWalk {
  constructor(private readonly walks: WalkRepository) {}

  async execute(input: WalkInput): Promise<CreateWalkResult> {
    const validation = validateWalkCreation(input)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const walk = await this.walks.create(input)
    return { success: true, walk }
  }
}
