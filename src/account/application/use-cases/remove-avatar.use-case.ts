import type { Profile } from "../../domain/entities/profile"
import type { ProfileRepository } from "../../domain/repositories/profile.repository"
import type { StorageRepository } from "../../domain/repositories/storage.repository"

export class RemoveAvatar {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly storage: StorageRepository,
  ) {}

  async execute(input: { id: string }): Promise<Profile> {
    const current = await this.profiles.findById(input.id)

    if (current?.avatarUrl) {
      await this.storage.deleteAvatar(current.avatarUrl)
    }

    return this.profiles.removeAvatar(input.id)
  }
}
