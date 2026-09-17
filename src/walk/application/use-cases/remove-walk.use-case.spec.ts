import { describe, expect, test, vi } from "vitest"
import { createWalkRepositoryMock } from "../../fixtures/walk-repository.fixture"
import { RemoveWalk } from "./remove-walk.use-case"

describe("RemoveWalk", () => {
  describe("Given a walk I organize", () => {
    test("When removing it, Then the repository is asked to remove it", async () => {
      const walks = createWalkRepositoryMock({ remove: vi.fn().mockResolvedValue(undefined) })
      const useCase = new RemoveWalk(walks)

      await useCase.execute("walk-1")

      expect(walks.remove).toHaveBeenCalledWith("walk-1")
    })
  })
})
