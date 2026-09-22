import { validateImageFile } from "@/shared/domain/policies/image-file.policy"

import type { Profile } from "../../domain/entities/profile"
import type { ProfileRepository } from "../../domain/repositories/profile.repository"
import type { StorageRepository } from "../../domain/repositories/storage.repository"

export type UpdateAvatarInput = { id: string; file: { uri: string; mimeType: string; sizeBytes: number } }

export type UpdateAvatarResult = { success: true; profile: Profile } | { success: false; reason: "unsupported_format" | "too_large" }

export class UpdateAvatar {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly storage: StorageRepository,
  ) {}

  async execute(input: UpdateAvatarInput): Promise<UpdateAvatarResult> {
    const validation = validateImageFile({ mimeType: input.file.mimeType, sizeBytes: input.file.sizeBytes })
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const current = await this.profiles.findById(input.id)
    const avatarUrl = await this.storage.uploadAvatar(input.id, input.file)

    if (current?.avatarUrl) {
      await this.storage.deleteAvatar(current.avatarUrl)
    }

    const profile = await this.profiles.updateAvatar(input.id, avatarUrl)
    return { success: true, profile }
  }
}
