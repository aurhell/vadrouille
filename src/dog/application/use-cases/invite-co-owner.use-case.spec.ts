import { describe, expect, test, vi } from "vitest"

import { createDogCoOwnerRepositoryMock } from "../../fixtures/dog-co-owner-repository.fixture"

import { InviteCoOwner } from "./invite-co-owner.use-case"

describe("InviteCoOwner", () => {
  describe("Given I own a dog and the target is my friend", () => {
    test("When inviting, Then the repository sends the invite", async() => {
      const coOwners = createDogCoOwnerRepositoryMock({ inviteCoOwner: vi.fn().mockResolvedValue(undefined) })
      const useCase = new InviteCoOwner(coOwners)

      await useCase.execute("dog-1", "alice-id")

      expect(coOwners.inviteCoOwner).toHaveBeenCalledWith("dog-1", "alice-id")
    })
  })
})
