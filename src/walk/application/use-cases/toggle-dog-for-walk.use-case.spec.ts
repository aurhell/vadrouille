import { describe, expect, test } from "vitest"
import { createWalkRepositoryMock } from "../../fixtures/walk-repository.fixture"
import { ToggleDogForWalk } from "./toggle-dog-for-walk.use-case"

describe("ToggleDogForWalk", () => {
  describe("Given my dog isn't confirmed and the walk is below quota", () => {
    test("When toggling, Then the dog is confirmed", async () => {
      const walks = createWalkRepositoryMock()
      const useCase = new ToggleDogForWalk(walks)

      const result = await useCase.execute({ walkId: "walk-1", dogId: "rex", isConfirmed: false, confirmedDogsCount: 8 })

      expect(result).toEqual({ success: true })
      expect(walks.confirmDog).toHaveBeenCalledWith("walk-1", "rex")
    })
  })

  describe("Given my dog isn't confirmed and the walk is already at quota (10)", () => {
    test("When toggling, Then it fails with reason 'quota_exceeded' and nothing is confirmed", async () => {
      const walks = createWalkRepositoryMock()
      const useCase = new ToggleDogForWalk(walks)

      const result = await useCase.execute({ walkId: "walk-1", dogId: "rex", isConfirmed: false, confirmedDogsCount: 10 })

      expect(result).toEqual({ success: false, reason: "quota_exceeded" })
      expect(walks.confirmDog).not.toHaveBeenCalled()
    })
  })

  describe("Given my dog is already confirmed", () => {
    test("When toggling, Then the dog is removed from the walk, regardless of quota", async () => {
      const walks = createWalkRepositoryMock()
      const useCase = new ToggleDogForWalk(walks)

      const result = await useCase.execute({ walkId: "walk-1", dogId: "rex", isConfirmed: true, confirmedDogsCount: 10 })

      expect(result).toEqual({ success: true })
      expect(walks.removeDogFromWalk).toHaveBeenCalledWith("walk-1", "rex")
    })
  })
})
