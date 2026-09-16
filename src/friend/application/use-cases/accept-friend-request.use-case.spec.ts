import { describe, expect, test, vi } from "vitest"
import { createFriendRepositoryMock } from "../../fixtures/friend-repository.fixture"
import { AcceptFriendRequest } from "./accept-friend-request.use-case"

describe("AcceptFriendRequest", () => {
  describe("Given a pending request from someone", () => {
    test("When accepting it, Then the repository accepts that requester", async () => {
      const friends = createFriendRepositoryMock({ acceptFriendRequest: vi.fn().mockResolvedValue(undefined) })
      const useCase = new AcceptFriendRequest(friends)

      await useCase.execute("bob-id")

      expect(friends.acceptFriendRequest).toHaveBeenCalledWith("bob-id")
    })
  })
})
