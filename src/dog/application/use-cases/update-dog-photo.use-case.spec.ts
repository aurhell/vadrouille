import { describe, expect, test, vi } from "vitest"
import { createDogFixture } from "../../fixtures/dog.fixture"
import { createDogRepositoryMock } from "../../fixtures/dog-repository.fixture"
import { createDogPhotoStorageRepositoryMock } from "../../fixtures/dog-photo-storage-repository.fixture"
import { UpdateDogPhoto } from "./update-dog-photo.use-case"

const FILE = { uri: "file://photo.jpg", mimeType: "image/jpeg", sizeBytes: 1_000 }

describe("UpdateDogPhoto", () => {
  describe("Given a valid image and no previous photo", () => {
    test("When updating, Then the photo is uploaded and the dog updated, without deleting anything", async () => {
      const dog = createDogFixture({ photoUrl: "https://cdn/new.jpg" })
      const dogs = createDogRepositoryMock({
        findById: vi.fn().mockResolvedValue(createDogFixture({ photoUrl: null })),
        updatePhoto: vi.fn().mockResolvedValue(dog),
      })
      const storage = createDogPhotoStorageRepositoryMock({ uploadPhoto: vi.fn().mockResolvedValue("https://cdn/new.jpg") })
      const useCase = new UpdateDogPhoto(dogs, storage)

      const result = await useCase.execute({ id: "dog-1", file: FILE })

      expect(result).toEqual({ success: true, dog })
      expect(storage.deletePhoto).not.toHaveBeenCalled()
      expect(dogs.updatePhoto).toHaveBeenCalledWith("dog-1", "https://cdn/new.jpg")
    })
  })

  describe("Given a valid image and an existing previous photo", () => {
    test("When updating, Then the old photo is deleted after the new one is uploaded", async () => {
      const dog = createDogFixture({ photoUrl: "https://cdn/new.jpg" })
      const dogs = createDogRepositoryMock({
        findById: vi.fn().mockResolvedValue(createDogFixture({ photoUrl: "https://cdn/old.jpg" })),
        updatePhoto: vi.fn().mockResolvedValue(dog),
      })
      const storage = createDogPhotoStorageRepositoryMock({ uploadPhoto: vi.fn().mockResolvedValue("https://cdn/new.jpg") })
      const useCase = new UpdateDogPhoto(dogs, storage)

      await useCase.execute({ id: "dog-1", file: FILE })

      expect(storage.deletePhoto).toHaveBeenCalledWith("https://cdn/old.jpg")
    })
  })

  describe("Given an unsupported file format", () => {
    test("When updating, Then it fails with reason 'unsupported_format' and nothing is uploaded", async () => {
      const dogs = createDogRepositoryMock()
      const storage = createDogPhotoStorageRepositoryMock()
      const useCase = new UpdateDogPhoto(dogs, storage)

      const result = await useCase.execute({ id: "dog-1", file: { ...FILE, mimeType: "application/pdf" } })

      expect(result).toEqual({ success: false, reason: "unsupported_format" })
      expect(storage.uploadPhoto).not.toHaveBeenCalled()
    })
  })

  describe("Given a file exceeding the maximum allowed size", () => {
    test("When updating, Then it fails with reason 'too_large' and nothing is uploaded", async () => {
      const dogs = createDogRepositoryMock()
      const storage = createDogPhotoStorageRepositoryMock()
      const useCase = new UpdateDogPhoto(dogs, storage)

      const result = await useCase.execute({ id: "dog-1", file: { ...FILE, sizeBytes: 10_000_000 } })

      expect(result).toEqual({ success: false, reason: "too_large" })
      expect(storage.uploadPhoto).not.toHaveBeenCalled()
    })
  })
})
