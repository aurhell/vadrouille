import { describe, expect, test, vi } from "vitest"
import { createDogCoOwnerRepositoryMock } from "../../fixtures/dog-co-owner-repository.fixture"
import { AcceptCoOwnerInvite } from "./accept-co-owner-invite.use-case"

describe("AcceptCoOwnerInvite", () => {
  describe("Given a pending co-owner invite", () => {
    test("When accepting it, Then the repository accepts that dog", async () => {
      const coOwners = createDogCoOwnerRepositoryMock({ acceptInvite: vi.fn().mockResolvedValue(undefined) })
      const useCase = new AcceptCoOwnerInvite(coOwners)

      await useCase.execute("dog-1")

      expect(coOwners.acceptInvite).toHaveBeenCalledWith("dog-1")
    })
  })
})
