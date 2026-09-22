import { describe, expect, it, vi } from "vitest"

import { createFriendRepositoryMock } from "../../fixtures/friend-repository.fixture"

import { RegenerateInviteCode } from "./regenerate-invite-code.use-case"

describe("RegenerateInviteCode", () => {
  it("Given a signed-in user, When they regenerate their invite code, Then the new code is returned", async() => {
    const friends = createFriendRepositoryMock({
      regenerateInviteCode: vi.fn().mockResolvedValue("NEWCODE1"),
    })
    const useCase = new RegenerateInviteCode(friends)

    const result = await useCase.execute()

    expect(result).toBe("NEWCODE1")
    expect(friends.regenerateInviteCode).toHaveBeenCalledOnce()
  })
})
