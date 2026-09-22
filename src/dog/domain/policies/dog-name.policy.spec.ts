import { describe, expect, test } from "vitest"

import { validateDogName } from "./dog-name.policy"

describe("validateDogName", () => {
  describe("Given a non-empty name", () => {
    test("When validating, Then it is valid", () => {
      expect(validateDogName("Rex")).toEqual({ valid: true })
    })
  })

  describe("Given an empty name", () => {
    test("When validating, Then it is invalid with reason 'required'", () => {
      expect(validateDogName("")).toEqual({ valid: false, reason: "required" })
    })
  })

  describe("Given a name made only of whitespace", () => {
    test("When validating, Then it is invalid with reason 'required'", () => {
      expect(validateDogName("   ")).toEqual({ valid: false, reason: "required" })
    })
  })
})
