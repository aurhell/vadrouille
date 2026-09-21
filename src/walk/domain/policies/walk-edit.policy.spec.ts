import { describe, expect, test } from "vitest"
import { validateWalkEdit } from "./walk-edit.policy"

const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()

describe("validateWalkEdit", () => {
  describe("Given a valid location and a future start time", () => {
    test("When validating, Then it is valid", () => {
      expect(validateWalkEdit({ locationText: "Parc de la Tête d'Or", startTime: future })).toEqual({ valid: true })
    })
  })

  describe("Given an empty location", () => {
    test("When validating, Then it fails with reason 'location_required'", () => {
      expect(validateWalkEdit({ locationText: "  ", startTime: future })).toEqual({ valid: false, reason: "location_required" })
    })
  })

  describe("Given a start time already in the past", () => {
    test("When validating, Then it fails with reason 'start_time_past'", () => {
      expect(validateWalkEdit({ locationText: "Parc", startTime: past })).toEqual({ valid: false, reason: "start_time_past" })
    })
  })
})
