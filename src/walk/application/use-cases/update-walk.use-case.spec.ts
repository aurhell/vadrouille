import { describe, expect, test, vi } from "vitest"

import { createWalkRepositoryMock } from "../../fixtures/walk-repository.fixture"
import { createWalkFixture } from "../../fixtures/walk.fixture"

import { UpdateWalk } from "./update-walk.use-case"

const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()

const validInput = { locationText: "Parc de la Tête d'Or", startTime: future, durationMinutes: 60, newFriendIds: ["f2"] }

describe("UpdateWalk", () => {
  describe("Given a valid input", () => {
    test("When updating, Then the walk is updated and returned", async() => {
      const walk = createWalkFixture()
      const walks = createWalkRepositoryMock({ update: vi.fn().mockResolvedValue(walk) })
      const useCase = new UpdateWalk(walks)

      const result = await useCase.execute("walk-1", validInput)

      expect(result).toEqual({ success: true, walk })
      expect(walks.update).toHaveBeenCalledWith("walk-1", validInput)
    })
  })

  describe("Given an empty location", () => {
    test("When updating, Then it fails with reason 'location_required' and nothing is updated", async() => {
      const walks = createWalkRepositoryMock()
      const useCase = new UpdateWalk(walks)

      const result = await useCase.execute("walk-1", { ...validInput, locationText: "  " })

      expect(result).toEqual({ success: false, reason: "location_required" })
      expect(walks.update).not.toHaveBeenCalled()
    })
  })

  describe("Given a start time already in the past", () => {
    test("When updating, Then it fails with reason 'start_time_past' and nothing is updated", async() => {
      const walks = createWalkRepositoryMock()
      const useCase = new UpdateWalk(walks)

      const result = await useCase.execute("walk-1", { ...validInput, startTime: past })

      expect(result).toEqual({ success: false, reason: "start_time_past" })
      expect(walks.update).not.toHaveBeenCalled()
    })
  })
})
