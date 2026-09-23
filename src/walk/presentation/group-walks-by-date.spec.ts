import { describe, expect, test } from "vitest"

import { createWalkFixture } from "../fixtures/walk.fixture"

import { groupWalksByDate } from "./group-walks-by-date"

// Wednesday 2026-09-23, 10:00 local — mid-week, so "Cette semaine"/"La semaine prochaine" both
// have real room either side of it.
const NOW = new Date(2026, 8, 23, 10, 0, 0)

function walkAt(id: string, date: Date): ReturnType<typeof createWalkFixture> {
  return createWalkFixture({ id, startTime: date.toISOString() })
}

describe("groupWalksByDate", () => {
  describe("Given a walk later today", () => {
    test("When grouping, Then it's in \"Aujourd'hui\"", () => {
      const walk = walkAt("w1", new Date(2026, 8, 23, 18, 0))

      const result = groupWalksByDate([walk], NOW)

      expect(result).toEqual([{ title: "Aujourd'hui", data: [walk] }])
    })
  })

  describe("Given a walk tomorrow", () => {
    test("When grouping, Then it's in \"Demain\"", () => {
      const walk = walkAt("w1", new Date(2026, 8, 24, 9, 0))

      const result = groupWalksByDate([walk], NOW)

      expect(result).toEqual([{ title: "Demain", data: [walk] }])
    })
  })

  describe("Given a walk later this week (after tomorrow, before next Monday)", () => {
    test("When grouping, Then it's in \"Cette semaine\"", () => {
      // NOW is Wednesday — Friday is later this week, day-after-tomorrow.
      const walk = walkAt("w1", new Date(2026, 8, 25, 9, 0))

      const result = groupWalksByDate([walk], NOW)

      expect(result).toEqual([{ title: "Cette semaine", data: [walk] }])
    })
  })

  describe("Given a walk next week (Monday through Sunday after this one)", () => {
    test("When grouping, Then it's in \"La semaine prochaine\"", () => {
      const walk = walkAt("w1", new Date(2026, 8, 29, 9, 0)) // next Tuesday

      const result = groupWalksByDate([walk], NOW)

      expect(result).toEqual([{ title: "La semaine prochaine", data: [walk] }])
    })
  })

  describe("Given a walk more than two weeks out", () => {
    test("When grouping, Then it's in \"Plus tard\"", () => {
      const walk = walkAt("w1", new Date(2026, 9, 15, 9, 0))

      const result = groupWalksByDate([walk], NOW)

      expect(result).toEqual([{ title: "Plus tard", data: [walk] }])
    })
  })

  describe("Given \"demain\" falls in the next calendar week (today is Sunday)", () => {
    test("When grouping, Then it's still \"Demain\", not \"La semaine prochaine\"", () => {
      const sunday = new Date(2026, 8, 27, 20, 0) // Sunday
      const monday = new Date(2026, 8, 28, 9, 0) // next-day Monday, next ISO week

      const walk = walkAt("w1", monday)
      const result = groupWalksByDate([walk], sunday)

      expect(result).toEqual([{ title: "Demain", data: [walk] }])
    })
  })

  describe("Given walks spread across several groups", () => {
    test("When grouping, Then groups come back non-empty only, in chronological bucket order", () => {
      const today = walkAt("today", new Date(2026, 8, 23, 12, 0))
      const nextWeek = walkAt("next-week", new Date(2026, 8, 29, 9, 0))
      const later = walkAt("later", new Date(2026, 9, 15, 9, 0))

      const result = groupWalksByDate([today, nextWeek, later], NOW)

      expect(result.map((g) => g.title)).toEqual(["Aujourd'hui", "La semaine prochaine", "Plus tard"])
    })
  })

  describe("Given no walks", () => {
    test("When grouping, Then no groups come back", () => {
      expect(groupWalksByDate([], NOW)).toEqual([])
    })
  })
})
