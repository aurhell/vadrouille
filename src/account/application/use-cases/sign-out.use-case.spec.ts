import { beforeEach, describe, expect, test, vi } from "vitest"
import type { AuthRepository } from "../../domain/repositories/auth.repository"
import { SignOut } from "./sign-out.use-case"

describe("SignOut", () => {
  let auth: AuthRepository
  let signOut: SignOut

  beforeEach(() => {
    auth = { requestMagicLink: vi.fn(), signOut: vi.fn() }
    signOut = new SignOut(auth)
  })

  describe("Given an authenticated user", () => {
    test("When signing out, Then the session is terminated (account and data are untouched)", async () => {
      await signOut.execute()

      expect(auth.signOut).toHaveBeenCalledOnce()
    })
  })
})
