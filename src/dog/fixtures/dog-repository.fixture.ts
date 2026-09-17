import { vi } from "vitest"
import type { DogRepository } from "../domain/repositories/dog.repository"

export function createDogRepositoryMock(overrides: Partial<DogRepository> = {}): DogRepository {
  return {
    list: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    updatePhoto: vi.fn(),
    removePhoto: vi.fn(),
    ...overrides,
  }
}
