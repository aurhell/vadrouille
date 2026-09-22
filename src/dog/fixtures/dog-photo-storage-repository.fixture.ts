import { vi } from "vitest"

import type { DogPhotoStorageRepository } from "../domain/repositories/dog-photo-storage.repository"

export function createDogPhotoStorageRepositoryMock(overrides: Partial<DogPhotoStorageRepository> = {}): DogPhotoStorageRepository {
  return {
    uploadPhoto: vi.fn(),
    deletePhoto: vi.fn(),
    ...overrides,
  }
}
