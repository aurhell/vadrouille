import { validateUsername } from "../../domain/policies/username.policy"

import type { Profile } from "../../domain/entities/profile"
import type { ProfileRepository } from "../../domain/repositories/profile.repository"

export type UpdateUsernameInput = { id: string; username: string }

export type UpdateUsernameResult = { success: true; profile: Profile } | { success: false; reason: "required" | "invalid_format" }

export class UpdateUsername {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(input: UpdateUsernameInput): Promise<UpdateUsernameResult> {
    const validation = validateUsername(input.username)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const profile = await this.profiles.updateUsername(input.id, input.username)
    return { success: true, profile }
  }
}
