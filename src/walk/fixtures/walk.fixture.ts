import type { Walk } from "../domain/entities/walk"

export function createWalkFixture(overrides: Partial<Walk> = {}): Walk {
  return {
    id: "walk-1",
    locationText: "Parc de la Tête d'Or",
    startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    organizerId: "organizer-1",
    myStatus: "yes",
    participants: [],
    dogs: [],
    ...overrides,
  }
}
