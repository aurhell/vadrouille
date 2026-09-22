import type { Profile } from "../entities/profile"

export type ProfileRepository = {
  create(input: { id: string; username: string }): Promise<Profile>
  findById(id: string): Promise<Profile | null>
  updateUsername(id: string, username: string): Promise<Profile>
  updateAvatar(id: string, avatarUrl: string): Promise<Profile>
  removeAvatar(id: string): Promise<Profile>
}
