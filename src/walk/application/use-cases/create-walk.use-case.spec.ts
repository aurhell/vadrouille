import { describe, expect, test, vi } from "vitest"

import { createWalkRepositoryMock } from "../../fixtures/walk-repository.fixture"
import { createWalkFixture } from "../../fixtures/walk.fixture"

import { CreateWalk } from "./create-walk.use-case"

const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
const past = new Date(Date.now() - 60 * 60 * 1000).toISOString()

const validInput = { locationText: "Parc de la Tête d'Or", startTime: future, durationMinutes: 60, dogIds: ["d1"], friendIds: ["f1"] }

describe("CreateWalk", () => {
  describe("Given a valid input", () => {
    test("When creating, Then the walk is created and returned", async() => {
      const walk = createWalkFixture()
      const walks = createWalkRepositoryMock({ create: vi.fn().mockResolvedValue(walk) })
      const useCase = new CreateWalk(walks)

      const result = await useCase.execute(validInput)

      expect(result).toEqual({ success: true, walk })
      expect(walks.create).toHaveBeenCalledWith(validInput)
    })
  })

  describe("Given an empty location", () => {
    test("When creating, Then it fails with reason 'location_required' and nothing is created", async() => {
      const walks = createWalkRepositoryMock()
      const useCase = new CreateWalk(walks)

      const result = await useCase.execute({ ...validInput, locationText: "  " })

      expect(result).toEqual({ success: false, reason: "location_required" })
      expect(walks.create).not.toHaveBeenCalled()
    })
  })

  describe("Given a start time already in the past", () => {
    test("When creating, Then it fails with reason 'start_time_past' and nothing is created", async() => {
      const walks = createWalkRepositoryMock()
      const useCase = new CreateWalk(walks)

      const result = await useCase.execute({ ...validInput, startTime: past })

      expect(result).toEqual({ success: false, reason: "start_time_past" })
      expect(walks.create).not.toHaveBeenCalled()
    })
  })

  describe("Given more than 10 dogs selected", () => {
    test("When creating, Then it fails with reason 'too_many_dogs' and nothing is created", async() => {
      const walks = createWalkRepositoryMock()
      const useCase = new CreateWalk(walks)

      const result = await useCase.execute({ ...validInput, dogIds: Array.from({ length: 11 }, (_, i) => `d${i}`) })

      expect(result).toEqual({ success: false, reason: "too_many_dogs" })
      expect(walks.create).not.toHaveBeenCalled()
    })
  })
})
