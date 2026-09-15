import type { Profile } from "../domain/entities/profile"

export const createProfileFixture = (overrides: Partial<Profile> = {}): Profile => ({
  id: "user-1",
  username: "alice",
  avatarUrl: null,
  inviteCode: "INVITE1",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})
