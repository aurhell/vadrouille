import { describe, expect, test } from "vitest"

import { canRespondToWalk } from "./response-window.policy"

describe("canRespondToWalk", () => {
  describe("Given a walk that started less than 5 minutes ago", () => {
    test("When checking, Then responses are still allowed", () => {
      const startTime = new Date(Date.now() - 4 * 60 * 1000).toISOString()
      expect(canRespondToWalk({ startTime })).toBe(true)
    })
  })

  describe("Given a walk that started more than 5 minutes ago", () => {
    test("When checking, Then responses are refused", () => {
      const startTime = new Date(Date.now() - 6 * 60 * 1000).toISOString()
      expect(canRespondToWalk({ startTime })).toBe(false)
    })
  })

  describe("Given a walk that hasn't started yet", () => {
    test("When checking, Then responses are allowed", () => {
      const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      expect(canRespondToWalk({ startTime })).toBe(true)
    })
  })
})
