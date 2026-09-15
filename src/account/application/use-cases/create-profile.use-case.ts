import { validateUsername } from "../../domain/policies/username.policy"
import type { Profile } from "../../domain/entities/profile"
import type { ProfileRepository } from "../../domain/repositories/profile.repository"

export type CreateProfileInput = { id: string; username: string }

export type CreateProfileResult = { success: true; profile: Profile } | { success: false; reason: "required" | "invalid_format" }

export class CreateProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(input: CreateProfileInput): Promise<CreateProfileResult> {
    const validation = validateUsername(input.username)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const profile = await this.profiles.create({ id: input.id, username: input.username })
    return { success: true, profile }
  }
}
