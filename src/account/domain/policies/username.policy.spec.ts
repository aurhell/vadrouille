import { describe, expect, test } from "vitest"
import { validateUsername } from "./username.policy"

describe("validateUsername", () => {
  describe("Given a username respecting the expected format", () => {
    test("When validating, Then it is valid", () => {
      const result = validateUsername("Bob_2")

      expect(result).toEqual({ valid: true })
    })
  })

  describe("Given an empty username", () => {
    test("When validating, Then it is invalid with reason 'required'", () => {
      const result = validateUsername("")

      expect(result).toEqual({ valid: false, reason: "required" })
    })
  })

  describe("Given a username shorter than 3 characters", () => {
    test("When validating, Then it is invalid with reason 'invalid_format'", () => {
      const result = validateUsername("ab")

      expect(result).toEqual({ valid: false, reason: "invalid_format" })
    })
  })

  describe("Given a username longer than 20 characters", () => {
    test("When validating, Then it is invalid with reason 'invalid_format'", () => {
      const result = validateUsername("a".repeat(21))

      expect(result).toEqual({ valid: false, reason: "invalid_format" })
    })
  })

  describe("Given a username containing an unauthorized character", () => {
    test("When validating, Then it is invalid with reason 'invalid_format'", () => {
      const result = validateUsername("bob!")

      expect(result).toEqual({ valid: false, reason: "invalid_format" })
    })
  })

  describe("Given a username already used by another user", () => {
    test("When validating, Then it is still valid — usernames are not unique, only the email differentiates accounts", () => {
      const result = validateUsername("Bob")

      expect(result).toEqual({ valid: true })
    })
  })
})
