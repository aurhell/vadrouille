import { describe, expect, test, vi } from "vitest"
import { createDogFixture } from "../../fixtures/dog.fixture"
import { createDogRepositoryMock } from "../../fixtures/dog-repository.fixture"
import { createDogPhotoStorageRepositoryMock } from "../../fixtures/dog-photo-storage-repository.fixture"
import { RemoveDog } from "./remove-dog.use-case"

describe("RemoveDog", () => {
  describe("Given a dog I own with a photo", () => {
    test("When removing it, Then the photo is deleted from storage and the dog removed", async () => {
      const dogs = createDogRepositoryMock({
        findById: vi.fn().mockResolvedValue(createDogFixture({ photoUrl: "https://cdn/rex.jpg" })),
        remove: vi.fn().mockResolvedValue(undefined),
      })
      const storage = createDogPhotoStorageRepositoryMock()
      const useCase = new RemoveDog(dogs, storage)

      await useCase.execute("dog-1")

      expect(storage.deletePhoto).toHaveBeenCalledWith("https://cdn/rex.jpg")
      expect(dogs.remove).toHaveBeenCalledWith("dog-1")
    })
  })

  describe("Given a dog I own with no photo", () => {
    test("When removing it, Then storage is not touched", async () => {
      const dogs = createDogRepositoryMock({
        findById: vi.fn().mockResolvedValue(createDogFixture({ photoUrl: null })),
        remove: vi.fn().mockResolvedValue(undefined),
      })
      const storage = createDogPhotoStorageRepositoryMock()
      const useCase = new RemoveDog(dogs, storage)

      await useCase.execute("dog-1")

      expect(storage.deletePhoto).not.toHaveBeenCalled()
      expect(dogs.remove).toHaveBeenCalledWith("dog-1")
    })
  })
})
