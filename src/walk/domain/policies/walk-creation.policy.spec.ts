import { describe, expect, test } from "vitest"

import { validateWalkCreation } from "./walk-creation.policy"

const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()

describe("validateWalkCreation", () => {
  describe("Given a valid location, a future start time and a reasonable number of dogs", () => {
    test("When validating, Then it is valid", () => {
      expect(validateWalkCreation({ locationText: "Parc de la Tête d'Or", startTime: future, dogIds: ["d1"] })).toEqual({ valid: true })
    })
  })

  describe("Given an empty location", () => {
    test("When validating, Then it fails with reason 'location_required'", () => {
      expect(validateWalkCreation({ locationText: "  ", startTime: future, dogIds: [] })).toEqual({
        valid: false,
        reason: "location_required",
      })
    })
  })

  describe("Given a start time already in the past", () => {
    test("When validating, Then it fails with reason 'start_time_past'", () => {
      expect(validateWalkCreation({ locationText: "Parc", startTime: past, dogIds: [] })).toEqual({
        valid: false,
        reason: "start_time_past",
      })
    })
  })

  describe("Given more than 10 of my own dogs selected", () => {
    test("When validating, Then it fails with reason 'too_many_dogs'", () => {
      const dogIds = Array.from({ length: 11 }, (_, i) => `d${i}`)
      expect(validateWalkCreation({ locationText: "Parc", startTime: future, dogIds })).toEqual({
        valid: false,
        reason: "too_many_dogs",
      })
    })
  })
})
