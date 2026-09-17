import { describe, expect, test, vi } from "vitest"
import { createDogCoOwnerRepositoryMock } from "../../fixtures/dog-co-owner-repository.fixture"
import { DeclineCoOwnerInvite } from "./decline-co-owner-invite.use-case"

describe("DeclineCoOwnerInvite", () => {
  describe("Given a pending co-owner invite", () => {
    test("When declining it, Then the repository declines that dog", async () => {
      const coOwners = createDogCoOwnerRepositoryMock({ declineInvite: vi.fn().mockResolvedValue(undefined) })
      const useCase = new DeclineCoOwnerInvite(coOwners)

      await useCase.execute("dog-1")

      expect(coOwners.declineInvite).toHaveBeenCalledWith("dog-1")
    })
  })
})
