import { beforeEach, describe, expect, test, vi } from "vitest"

import { RequestMagicLink } from "./request-magic-link.use-case"

import type { AuthRepository } from "../../domain/repositories/auth.repository"

describe("RequestMagicLink", () => {
  let auth: AuthRepository
  let requestMagicLink: RequestMagicLink

  beforeEach(() => {
    auth = { requestMagicLink: vi.fn(), signOut: vi.fn() }
    requestMagicLink = new RequestMagicLink(auth)
  })

  describe("Given a valid email address", () => {
    test("When requesting a magic link, Then a magic link email is sent", async() => {
      const result = await requestMagicLink.execute({ email: "alice@example.com" })

      expect(result).toEqual({ success: true })
      expect(auth.requestMagicLink).toHaveBeenCalledWith("alice@example.com")
    })
  })

  describe("Given an email address with an invalid format", () => {
    test("When requesting a magic link, Then it fails with reason 'invalid_format' and no email is sent", async() => {
      const result = await requestMagicLink.execute({ email: "not-an-email" })

      expect(result).toEqual({ success: false, reason: "invalid_format" })
      expect(auth.requestMagicLink).not.toHaveBeenCalled()
    })
  })
})
