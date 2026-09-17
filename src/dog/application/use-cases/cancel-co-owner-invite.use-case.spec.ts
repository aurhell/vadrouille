import { describe, expect, test, vi } from "vitest"
import { createDogCoOwnerRepositoryMock } from "../../fixtures/dog-co-owner-repository.fixture"
import { CancelCoOwnerInvite } from "./cancel-co-owner-invite.use-case"

describe("CancelCoOwnerInvite", () => {
  describe("Given a pending invite I sent as owner", () => {
    test("When cancelling it, Then the repository cancels that invite", async () => {
      const coOwners = createDogCoOwnerRepositoryMock({ cancelInvite: vi.fn().mockResolvedValue(undefined) })
      const useCase = new CancelCoOwnerInvite(coOwners)

      await useCase.execute("dog-1", "bob-id")

      expect(coOwners.cancelInvite).toHaveBeenCalledWith("dog-1", "bob-id")
    })
  })
})
