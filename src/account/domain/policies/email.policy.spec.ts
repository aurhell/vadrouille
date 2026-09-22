import { describe, expect, test } from "vitest"

import { validateEmail } from "./email.policy"

describe("validateEmail", () => {
  describe("Given a valid email address", () => {
    test("When validating, Then it is valid", () => {
      const result = validateEmail("alice@example.com")

      expect(result).toEqual({ valid: true })
    })
  })

  describe("Given an email address with an invalid format", () => {
    test("When validating, Then it is invalid with reason 'invalid_format'", () => {
      const result = validateEmail("not-an-email")

      expect(result).toEqual({ valid: false, reason: "invalid_format" })
    })
  })

  describe("Given an empty email address", () => {
    test("When validating, Then it is invalid with reason 'invalid_format'", () => {
      const result = validateEmail("")

      expect(result).toEqual({ valid: false, reason: "invalid_format" })
    })
  })
})
