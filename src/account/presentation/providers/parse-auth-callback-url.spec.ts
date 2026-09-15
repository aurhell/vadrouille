import { describe, expect, test } from "vitest"
import { parseAuthCallbackUrl } from "./parse-auth-callback-url"

describe("parseAuthCallbackUrl", () => {
  describe("Given a magic link callback URL with tokens in the hash fragment", () => {
    test("When parsing, Then the access and refresh tokens are extracted", () => {
      const url = "vadrouille:///?#access_token=abc123&refresh_token=def456&type=magiclink"

      const result = parseAuthCallbackUrl(url)

      expect(result).toEqual({ accessToken: "abc123", refreshToken: "def456" })
    })
  })

  describe("Given a magic link callback URL with tokens in the query string", () => {
    test("When parsing, Then the access and refresh tokens are extracted", () => {
      const url = "exp://192.168.1.47:8090/--/?access_token=abc123&refresh_token=def456&type=magiclink"

      const result = parseAuthCallbackUrl(url)

      expect(result).toEqual({ accessToken: "abc123", refreshToken: "def456" })
    })
  })

  describe("Given a URL with no auth tokens (e.g. a plain app launch)", () => {
    test("When parsing, Then it returns null", () => {
      const result = parseAuthCallbackUrl("vadrouille:///")

      expect(result).toBeNull()
    })
  })

  describe("Given only one of the two required tokens", () => {
    test("When parsing, Then it returns null", () => {
      const result = parseAuthCallbackUrl("vadrouille:///?#access_token=abc123")

      expect(result).toBeNull()
    })
  })
})
