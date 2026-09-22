import { vi } from "vitest"

import type { DogCoOwnerRepository } from "../domain/repositories/dog-co-owner.repository"

export function createDogCoOwnerRepositoryMock(overrides: Partial<DogCoOwnerRepository> = {}): DogCoOwnerRepository {
  return {
    listSentInvites: vi.fn(),
    listReceivedInvites: vi.fn(),
    inviteCoOwner: vi.fn(),
    acceptInvite: vi.fn(),
    declineInvite: vi.fn(),
    cancelInvite: vi.fn(),
    leaveCoOwnership: vi.fn(),
    ...overrides,
  }
}
