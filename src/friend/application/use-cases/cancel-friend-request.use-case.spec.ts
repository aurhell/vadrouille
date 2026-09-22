import { describe, expect, test, vi } from "vitest"

import { createFriendRepositoryMock } from "../../fixtures/friend-repository.fixture"

import { CancelFriendRequest } from "./cancel-friend-request.use-case"

describe("CancelFriendRequest", () => {
  describe("Given a pending request I sent to someone", () => {
    test("When cancelling it, Then the repository cancels that addressee", async() => {
      const friends = createFriendRepositoryMock({ cancelFriendRequest: vi.fn().mockResolvedValue(undefined) })
      const useCase = new CancelFriendRequest(friends)

      await useCase.execute("alice-id")

      expect(friends.cancelFriendRequest).toHaveBeenCalledWith("alice-id")
    })
  })
})
