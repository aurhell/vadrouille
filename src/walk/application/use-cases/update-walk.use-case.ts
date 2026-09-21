import { validateWalkEdit } from "../../domain/policies/walk-edit.policy"
import type { Walk } from "../../domain/entities/walk"
import type { UpdateWalkInput, WalkRepository } from "../../domain/repositories/walk.repository"

export type UpdateWalkResult = { success: true; walk: Walk } | { success: false; reason: "location_required" | "start_time_past" }

export class UpdateWalk {
  constructor(private readonly walks: WalkRepository) {}

  async execute(walkId: string, input: UpdateWalkInput): Promise<UpdateWalkResult> {
    const validation = validateWalkEdit(input)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const walk = await this.walks.update(walkId, input)
    return { success: true, walk }
  }
}
