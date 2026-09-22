import { describe, expect, test } from "vitest"

import { canConfirmDogForWalk, dogQuotaMessage } from "./walk-dog-quota.policy"

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

describe("dogQuotaMessage", () => {
  describe("Given fewer than 8 dogs confirmed (quota 10)", () => {
    test("When checking, Then no message is shown — staying subtle far from the limit", () => {
      expect(dogQuotaMessage(0)).toBeUndefined()
      expect(dogQuotaMessage(7)).toBeUndefined()
    })
  })

  describe("Given 8 dogs confirmed (2 slots left)", () => {
    test("When checking, Then it shows the plural remaining-slots message", () => {
      expect(dogQuotaMessage(8)).toBe("Plus que 2 places")
    })
  })

  describe("Given 9 dogs confirmed (1 slot left)", () => {
    test("When checking, Then it shows the singular remaining-slot message", () => {
      expect(dogQuotaMessage(9)).toBe("Plus qu'une place")
    })
  })

  describe("Given 10 dogs confirmed (quota reached)", () => {
    test("When checking, Then it shows 'Complet'", () => {
      expect(dogQuotaMessage(10)).toBe("Complet")
    })
  })
})
