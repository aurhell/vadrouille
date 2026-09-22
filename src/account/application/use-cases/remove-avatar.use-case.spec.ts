import { beforeEach, describe, expect, test, vi } from "vitest"
import { InMemoryProfileRepository } from "../../fixtures/profile-repository.fixture"
import type { StorageRepository } from "../../domain/repositories/storage.repository"
import { RemoveAvatar } from "./remove-avatar.use-case"

describe("RemoveAvatar", () => {
  let profiles: InMemoryProfileRepository
  let storage: StorageRepository
  let removeAvatar: RemoveAvatar

  beforeEach(async () => {
    profiles = new InMemoryProfileRepository()
    storage = { uploadAvatar: vi.fn(), deleteAvatar: vi.fn() }
    removeAvatar = new RemoveAvatar(profiles, storage)
    await profiles.create({ id: "user-1", username: "alice" })
    await profiles.updateAvatar("user-1", "https://storage.test/avatars/user-1/old.jpg")
  })

  describe("Given a user with a profile photo", () => {
    test("When removing it, Then the profile has no more photo and the image is deleted from storage", async () => {
      const profile = await removeAvatar.execute({ id: "user-1" })

      expect(profile.avatarUrl).toBeNull()
      expect(storage.deleteAvatar).toHaveBeenCalledWith("https://storage.test/avatars/user-1/old.jpg")
    })
  })
})
