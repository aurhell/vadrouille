import type { FriendRepository } from "../../domain/repositories/friend.repository"

export class CancelFriendRequest {
  constructor(private readonly friends: FriendRepository) {}

  async execute(addresseeId: string): Promise<void> {
    return this.friends.cancelFriendRequest(addresseeId)
  }
}
