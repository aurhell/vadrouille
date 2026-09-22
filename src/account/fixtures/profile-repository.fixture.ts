import type { Profile } from "../domain/entities/profile"
import type { ProfileRepository } from "../domain/repositories/profile.repository"

/** Test double — mirrors the Supabase-backed repository's observable behavior
 * (invite_code auto-generated on create, no username uniqueness check). */
export class InMemoryProfileRepository implements ProfileRepository {
  private profiles = new Map<string, Profile>()
  private nextInviteCodeSeed = 1

  async create(input: { id: string; username: string }): Promise<Profile> {
    const profile: Profile = {
      id: input.id,
      username: input.username,
      avatarUrl: null,
      inviteCode: `INVITE${this.nextInviteCodeSeed++}`,
      createdAt: new Date().toISOString(),
    }
    this.profiles.set(profile.id, profile)
    return profile
  }

  async findById(id: string): Promise<Profile | null> {
    return this.profiles.get(id) ?? null
  }

  async updateUsername(id: string, username: string): Promise<Profile> {
    return this.update(id, { username })
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<Profile> {
    return this.update(id, { avatarUrl })
  }

  async removeAvatar(id: string): Promise<Profile> {
    return this.update(id, { avatarUrl: null })
  }

  private update(id: string, patch: Partial<Omit<Profile, "id">>): Profile {
    const existing = this.profiles.get(id)
    if (!existing) {
      throw new Error(`InMemoryProfileRepository: no profile with id "${id}"`)
    }
    const updated = { ...existing, ...patch }
    this.profiles.set(id, updated)
    return updated
  }
}
