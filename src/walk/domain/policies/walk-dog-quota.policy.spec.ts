import { describe, expect, test } from "vitest"
import { canConfirmDogForWalk } from "./walk-dog-quota.policy"

describe("canConfirmDogForWalk", () => {
  describe("Given 8 dogs already confirmed (quota 10)", () => {
    test("When checking, Then confirming one more is allowed", () => {
      expect(canConfirmDogForWalk(8)).toBe(true)
    })
  })

  describe("Given 10 dogs already confirmed (quota 10)", () => {
    test("When checking, Then confirming one more is refused", () => {
      expect(canConfirmDogForWalk(10)).toBe(false)
    })
  })
})
