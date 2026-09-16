import type { FriendRepository } from "../../domain/repositories/friend.repository"

export class DeclineFriendRequest {
  constructor(private readonly friends: FriendRepository) {}

  async execute(requesterId: string): Promise<void> {
    return this.friends.declineFriendRequest(requesterId)
  }
}
