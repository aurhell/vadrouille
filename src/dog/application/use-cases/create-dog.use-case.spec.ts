import { describe, expect, test, vi } from "vitest"
import { createDogFixture } from "../../fixtures/dog.fixture"
import { createDogRepositoryMock } from "../../fixtures/dog-repository.fixture"
import { CreateDog } from "./create-dog.use-case"

describe("CreateDog", () => {
  describe("Given a non-empty name", () => {
    test("When creating, Then the dog is created and returned", async () => {
      const dog = createDogFixture({ name: "Rex" })
      const dogs = createDogRepositoryMock({ create: vi.fn().mockResolvedValue(dog) })
      const useCase = new CreateDog(dogs)

      const result = await useCase.execute({ name: "Rex" })

      expect(result).toEqual({ success: true, dog })
      expect(dogs.create).toHaveBeenCalledWith({ name: "Rex" })
    })
  })

  describe("Given an empty name", () => {
    test("When creating, Then it fails with reason 'required' and nothing is created", async () => {
      const dogs = createDogRepositoryMock()
      const useCase = new CreateDog(dogs)

      const result = await useCase.execute({ name: "" })

      expect(result).toEqual({ success: false, reason: "required" })
      expect(dogs.create).not.toHaveBeenCalled()
    })
  })
})
