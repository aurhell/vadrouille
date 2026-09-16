import type { FriendRepository } from "../../domain/repositories/friend.repository"

export class RemoveFriend {
  constructor(private readonly friends: FriendRepository) {}

  async execute(friendId: string): Promise<void> {
    return this.friends.removeFriend(friendId)
  }
}
