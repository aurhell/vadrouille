import { beforeEach, describe, expect, test, vi } from "vitest"
import { createFriendRepositoryMock } from "../../fixtures/friend-repository.fixture"
import type { FriendRepository } from "../../domain/repositories/friend.repository"
import { RedeemInviteCode } from "./redeem-invite-code.use-case"

describe("RedeemInviteCode", () => {
  let friends: FriendRepository
  let redeemInviteCode: RedeemInviteCode

  beforeEach(() => {
    friends = createFriendRepositoryMock()
    redeemInviteCode = new RedeemInviteCode(friends)
  })

  describe("Given a valid invite code belonging to someone I'm not yet friends or pending with", () => {
    test("When redeeming, Then a friend request is sent", async () => {
      vi.mocked(friends.redeemInviteCode).mockResolvedValue({ outcome: "created" })

      const result = await redeemInviteCode.execute({ code: "AB12CD" })

      expect(result).toEqual({ outcome: "created" })
      expect(friends.redeemInviteCode).toHaveBeenCalledWith("AB12CD")
    })
  })

  describe("Given a code belonging to someone who already sent me a pending request", () => {
    test("When redeeming, Then their request is auto-accepted instead of creating a duplicate", async () => {
      vi.mocked(friends.redeemInviteCode).mockResolvedValue({ outcome: "auto_accepted" })

      const result = await redeemInviteCode.execute({ code: "AB12CD" })

      expect(result).toEqual({ outcome: "auto_accepted" })
    })
  })

  describe("Given a code that doesn't match any profile", () => {
    test("When redeeming, Then it fails with reason 'invalid_code'", async () => {
      vi.mocked(friends.redeemInviteCode).mockResolvedValue({ outcome: "invalid_code" })

      const result = await redeemInviteCode.execute({ code: "DOESNOTEXIST" })

      expect(result).toEqual({ outcome: "invalid_code" })
    })
  })

  describe("Given my own invite code", () => {
    test("When redeeming, Then it fails with reason 'own_code'", async () => {
      vi.mocked(friends.redeemInviteCode).mockResolvedValue({ outcome: "own_code" })

      const result = await redeemInviteCode.execute({ code: "XY99ZZ" })

      expect(result).toEqual({ outcome: "own_code" })
    })
  })

  describe("Given a code belonging to someone I'm already friends with", () => {
    test("When redeeming, Then no new request is created and the outcome says so", async () => {
      vi.mocked(friends.redeemInviteCode).mockResolvedValue({ outcome: "already_friends" })

      const result = await redeemInviteCode.execute({ code: "AB12CD" })

      expect(result).toEqual({ outcome: "already_friends" })
    })
  })

  describe("Given a code belonging to someone I already sent a pending request to", () => {
    test("When redeeming, Then no duplicate request is created and the outcome says so", async () => {
      vi.mocked(friends.redeemInviteCode).mockResolvedValue({ outcome: "already_pending" })

      const result = await redeemInviteCode.execute({ code: "AB12CD" })

      expect(result).toEqual({ outcome: "already_pending" })
    })
  })
})
