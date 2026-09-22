import { beforeEach, describe, expect, test, vi } from "vitest"
import { InMemoryProfileRepository } from "../../fixtures/profile-repository.fixture"
import type { StorageRepository } from "../../domain/repositories/storage.repository"
import { UpdateAvatar } from "./update-avatar.use-case"

const validFile = { uri: "file://photo.jpg", mimeType: "image/jpeg", sizeBytes: 1_000_000 }

describe("UpdateAvatar", () => {
  let profiles: InMemoryProfileRepository
  let storage: StorageRepository
  let updateAvatar: UpdateAvatar

  beforeEach(async () => {
    profiles = new InMemoryProfileRepository()
    storage = { uploadAvatar: vi.fn(async () => "https://storage.test/avatars/user-1/new.jpg"), deleteAvatar: vi.fn() }
    updateAvatar = new UpdateAvatar(profiles, storage)
    await profiles.create({ id: "user-1", username: "alice" })
  })

  describe("Given a user with no profile photo yet", () => {
    test("When adding a valid image, Then it is uploaded and becomes the profile photo", async () => {
      const result = await updateAvatar.execute({ id: "user-1", file: validFile })

      expect(result).toEqual({ success: true, profile: expect.objectContaining({ avatarUrl: "https://storage.test/avatars/user-1/new.jpg" }) })
      expect(storage.uploadAvatar).toHaveBeenCalledWith("user-1", validFile)
      expect(storage.deleteAvatar).not.toHaveBeenCalled()
    })
  })

  describe("Given a user who already has a profile photo", () => {
    test("When replacing it with a valid image, Then the new image is uploaded and the old one is deleted from storage", async () => {
      await profiles.updateAvatar("user-1", "https://storage.test/avatars/user-1/old.jpg")

      const result = await updateAvatar.execute({ id: "user-1", file: validFile })

      expect(result).toEqual({ success: true, profile: expect.objectContaining({ avatarUrl: "https://storage.test/avatars/user-1/new.jpg" }) })
      expect(storage.deleteAvatar).toHaveBeenCalledWith("https://storage.test/avatars/user-1/old.jpg")
    })
  })

  describe("Given a file in an unsupported format", () => {
    test("When updating the avatar, Then it fails with reason 'unsupported_format' and nothing is uploaded", async () => {
      const result = await updateAvatar.execute({ id: "user-1", file: { uri: "file://doc.pdf", mimeType: "application/pdf", sizeBytes: 1_000 } })

      expect(result).toEqual({ success: false, reason: "unsupported_format" })
      expect(storage.uploadAvatar).not.toHaveBeenCalled()
    })
  })

  describe("Given a file exceeding the maximum allowed size", () => {
    test("When updating the avatar, Then it fails with reason 'too_large' and the previous photo is kept", async () => {
      await profiles.updateAvatar("user-1", "https://storage.test/avatars/user-1/old.jpg")

      const result = await updateAvatar.execute({ id: "user-1", file: { uri: "file://big.jpg", mimeType: "image/jpeg", sizeBytes: 10_000_000 } })

      expect(result).toEqual({ success: false, reason: "too_large" })
      expect((await profiles.findById("user-1"))?.avatarUrl).toBe("https://storage.test/avatars/user-1/old.jpg")
    })
  })
})
