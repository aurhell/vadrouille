import { describe, expect, test, vi } from "vitest"
import { createDogFixture } from "../../fixtures/dog.fixture"
import { createDogRepositoryMock } from "../../fixtures/dog-repository.fixture"
import { UpdateDog } from "./update-dog.use-case"

describe("UpdateDog", () => {
  describe("Given a non-empty name", () => {
    test("When updating, Then the dog is updated and returned", async () => {
      const dog = createDogFixture({ name: "Rexy" })
      const dogs = createDogRepositoryMock({ update: vi.fn().mockResolvedValue(dog) })
      const useCase = new UpdateDog(dogs)

      const result = await useCase.execute("dog-1", { name: "Rexy" })

      expect(result).toEqual({ success: true, dog })
      expect(dogs.update).toHaveBeenCalledWith("dog-1", { name: "Rexy" })
    })
  })

  describe("Given an empty name", () => {
    test("When updating, Then it fails with reason 'required' and nothing is updated", async () => {
      const dogs = createDogRepositoryMock()
      const useCase = new UpdateDog(dogs)

      const result = await useCase.execute("dog-1", { name: "" })

      expect(result).toEqual({ success: false, reason: "required" })
      expect(dogs.update).not.toHaveBeenCalled()
    })
  })
})
