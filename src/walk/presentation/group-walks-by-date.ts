import type { Walk } from "../domain/entities/walk"

export type WalkGroup = {
  title: string
  data: Walk[]
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Monday-based, matching the French convention "cette semaine" implies — not a rolling 7-day
 * window from `now`. */
function startOfWeek(date: Date): Date {
  const day = date.getDay() // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day
  return addDays(startOfDay(date), diffToMonday)
}

const GROUP_ORDER = ["Aujourd'hui", "Demain", "Cette semaine", "La semaine prochaine", "Plus tard"] as const

/** Buckets upcoming walks into simple date groups for `WalksListScreen` — see walk.docs.md.
 * Only non-empty groups are returned, already in `GROUP_ORDER`. `walks` is assumed already
 * sorted by `startTime` ascending (the repository query does this) — this function only
 * partitions, it doesn't re-sort. */
export function groupWalksByDate(walks: Walk[], now: Date = new Date()): WalkGroup[] {
  const today = startOfDay(now)
  const tomorrow = addDays(today, 1)
  const dayAfterTomorrow = addDays(today, 2)
  const thisWeekEnd = addDays(startOfWeek(now), 7)
  const nextWeekEnd = addDays(thisWeekEnd, 7)

  const byTitle = new Map<string, Walk[]>()

  function push(title: string, walk: Walk) {
    const existing = byTitle.get(title)
    if (existing) existing.push(walk)
    else byTitle.set(title, [walk])
  }

  for (const walk of walks) {
    const start = new Date(walk.startTime)
    if (start < tomorrow) push("Aujourd'hui", walk)
    else if (start < dayAfterTomorrow) push("Demain", walk)
    else if (start < thisWeekEnd) push("Cette semaine", walk)
    else if (start < nextWeekEnd) push("La semaine prochaine", walk)
    else push("Plus tard", walk)
  }

  return GROUP_ORDER.map((title) => ({ title, data: byTitle.get(title) ?? [] })).filter((group) => group.data.length > 0)
}
