import { describe, expect, test, vi } from "vitest"
import { createFriendRepositoryMock } from "../../fixtures/friend-repository.fixture"
import { LookupInviteCode } from "./lookup-invite-code.use-case"

describe("LookupInviteCode", () => {
  describe("Given a code belonging to a profile", () => {
    test("When looking it up, Then the owner's public profile is returned", async () => {
      const friend = { id: "alice-id", username: "alice", avatarUrl: null }
      const friends = createFriendRepositoryMock({ lookupInviteCode: vi.fn().mockResolvedValue(friend) })
      const useCase = new LookupInviteCode(friends)

      const result = await useCase.execute("AB12CD")

      expect(result).toEqual(friend)
      expect(friends.lookupInviteCode).toHaveBeenCalledWith("AB12CD")
    })
  })

  describe("Given a code that doesn't match any profile", () => {
    test("When looking it up, Then null is returned", async () => {
      const friends = createFriendRepositoryMock({ lookupInviteCode: vi.fn().mockResolvedValue(null) })
      const useCase = new LookupInviteCode(friends)

      const result = await useCase.execute("DOESNOTEXIST")

      expect(result).toBeNull()
    })
  })
})
