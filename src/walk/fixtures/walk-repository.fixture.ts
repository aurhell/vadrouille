import { vi } from "vitest"
import type { WalkRepository } from "../domain/repositories/walk.repository"

export function createWalkRepositoryMock(overrides: Partial<WalkRepository> = {}): WalkRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    remove: vi.fn().mockResolvedValue(undefined),
    respond: vi.fn().mockResolvedValue(undefined),
    confirmDog: vi.fn().mockResolvedValue(undefined),
    removeDogFromWalk: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}
