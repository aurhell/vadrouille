import { describe, expect, test } from "vitest"
import { parseAuthCallbackError } from "./parse-auth-callback-error"

describe("parseAuthCallbackError", () => {
  describe("Given a callback URL for an expired or already-used magic link", () => {
    test("When parsing, Then the error code and description are extracted", () => {
      const url = "vadrouille:#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb="

      const result = parseAuthCallbackError(url)

      expect(result).toEqual({ code: "otp_expired", description: "Email link is invalid or has expired" })
    })
  })

  describe("Given a successful callback URL with no error", () => {
    test("When parsing, Then it returns null", () => {
      const url = "vadrouille:///?#access_token=abc123&refresh_token=def456&type=magiclink"

      const result = parseAuthCallbackError(url)

      expect(result).toBeNull()
    })
  })

  describe("Given a plain app launch URL with no auth-related params at all", () => {
    test("When parsing, Then it returns null", () => {
      const result = parseAuthCallbackError("vadrouille:///")

      expect(result).toBeNull()
    })
  })
})
