import { vi } from "vitest"

import type { FriendRepository } from "../domain/repositories/friend.repository"

export function createFriendRepositoryMock(overrides: Partial<FriendRepository> = {}): FriendRepository {
  return {
    list: vi.fn(),
    listSentRequests: vi.fn(),
    listReceivedRequests: vi.fn(),
    lookupInviteCode: vi.fn(),
    redeemInviteCode: vi.fn(),
    acceptFriendRequest: vi.fn(),
    declineFriendRequest: vi.fn(),
    cancelFriendRequest: vi.fn(),
    removeFriend: vi.fn(),
    regenerateInviteCode: vi.fn(),
    ...overrides,
  }
}
