import { describe, expect, test, vi } from "vitest"

import { createFriendRepositoryMock } from "../../fixtures/friend-repository.fixture"

import { RemoveFriend } from "./remove-friend.use-case"

describe("RemoveFriend", () => {
  describe("Given an accepted friend", () => {
    test("When removing them, Then the repository removes that friend", async() => {
      const friends = createFriendRepositoryMock({ removeFriend: vi.fn().mockResolvedValue(undefined) })
      const useCase = new RemoveFriend(friends)

      await useCase.execute("alice-id")

      expect(friends.removeFriend).toHaveBeenCalledWith("alice-id")
    })
  })
})
