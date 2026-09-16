import type { FriendRepository } from "../../domain/repositories/friend.repository"

export class AcceptFriendRequest {
  constructor(private readonly friends: FriendRepository) {}

  async execute(requesterId: string): Promise<void> {
    return this.friends.acceptFriendRequest(requesterId)
  }
}
