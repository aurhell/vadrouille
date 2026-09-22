import { describe, expect, test, vi } from "vitest"

import { createDogCoOwnerRepositoryMock } from "../../fixtures/dog-co-owner-repository.fixture"

import { LeaveCoOwnership } from "./leave-co-ownership.use-case"

describe("LeaveCoOwnership", () => {
  describe("Given I'm an accepted co-owner of a dog", () => {
    test("When leaving, Then the repository removes my co-ownership", async() => {
      const coOwners = createDogCoOwnerRepositoryMock({ leaveCoOwnership: vi.fn().mockResolvedValue(undefined) })
      const useCase = new LeaveCoOwnership(coOwners)

      await useCase.execute("dog-1")

      expect(coOwners.leaveCoOwnership).toHaveBeenCalledWith("dog-1")
    })
  })
})
