import { describe, expect, test, vi } from "vitest"
import { createDogFixture } from "../../fixtures/dog.fixture"
import { createDogRepositoryMock } from "../../fixtures/dog-repository.fixture"
import { createDogPhotoStorageRepositoryMock } from "../../fixtures/dog-photo-storage-repository.fixture"
import { RemoveDogPhoto } from "./remove-dog-photo.use-case"

describe("RemoveDogPhoto", () => {
  describe("Given a dog with an existing photo", () => {
    test("When removing it, Then the storage file is deleted and the dog updated", async () => {
      const updated = createDogFixture({ photoUrl: null })
      const dogs = createDogRepositoryMock({
        findById: vi.fn().mockResolvedValue(createDogFixture({ photoUrl: "https://cdn/old.jpg" })),
        removePhoto: vi.fn().mockResolvedValue(updated),
      })
      const storage = createDogPhotoStorageRepositoryMock()
      const useCase = new RemoveDogPhoto(dogs, storage)

      const result = await useCase.execute("dog-1")

      expect(storage.deletePhoto).toHaveBeenCalledWith("https://cdn/old.jpg")
      expect(result).toEqual(updated)
    })
  })

  describe("Given a dog with no photo", () => {
    test("When removing it, Then storage is not touched", async () => {
      const updated = createDogFixture({ photoUrl: null })
      const dogs = createDogRepositoryMock({
        findById: vi.fn().mockResolvedValue(createDogFixture({ photoUrl: null })),
        removePhoto: vi.fn().mockResolvedValue(updated),
      })
      const storage = createDogPhotoStorageRepositoryMock()
      const useCase = new RemoveDogPhoto(dogs, storage)

      await useCase.execute("dog-1")

      expect(storage.deletePhoto).not.toHaveBeenCalled()
    })
  })
})
