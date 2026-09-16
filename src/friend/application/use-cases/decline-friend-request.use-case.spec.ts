import { describe, expect, test, vi } from "vitest"
import { createFriendRepositoryMock } from "../../fixtures/friend-repository.fixture"
import { DeclineFriendRequest } from "./decline-friend-request.use-case"

describe("DeclineFriendRequest", () => {
  describe("Given a pending request from someone", () => {
    test("When declining it, Then the repository declines that requester", async () => {
      const friends = createFriendRepositoryMock({ declineFriendRequest: vi.fn().mockResolvedValue(undefined) })
      const useCase = new DeclineFriendRequest(friends)

      await useCase.execute("bob-id")

      expect(friends.declineFriendRequest).toHaveBeenCalledWith("bob-id")
    })
  })
})
