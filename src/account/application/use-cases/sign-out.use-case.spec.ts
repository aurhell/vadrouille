import { beforeEach, describe, expect, test, vi } from "vitest"

import { SignOut } from "./sign-out.use-case"

import type { AuthRepository } from "../../domain/repositories/auth.repository"
import type { PushTokenRepository } from "../../domain/repositories/push-token.repository"

describe("SignOut", () => {
  let auth: AuthRepository
  let pushTokens: PushTokenRepository
  let signOut: SignOut

  beforeEach(() => {
    auth = { requestMagicLink: vi.fn(), signOut: vi.fn() }
    pushTokens = { register: vi.fn(), remove: vi.fn() }
    signOut = new SignOut(auth, pushTokens)
  })

  describe("Given an authenticated user", () => {
    test("When signing out, Then the session is terminated (account and data are untouched)", async() => {
      await signOut.execute()

      expect(auth.signOut).toHaveBeenCalledOnce()
    })

    test("When signing out, Then this device's push token is removed first, so a reused device stops receiving this account's notifications", async() => {
      await signOut.execute()

      expect(pushTokens.remove).toHaveBeenCalledOnce()
    })
  })

  describe("Given the push token removal fails (e.g. offline)", () => {
    test("When signing out, Then the sign-out itself still succeeds (best effort, not blocking)", async() => {
      pushTokens.remove = vi.fn().mockRejectedValue(new Error("network error"))

      await signOut.execute()

      expect(auth.signOut).toHaveBeenCalledOnce()
    })
  })
})
