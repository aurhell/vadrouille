import type { FriendRepository } from "../../domain/repositories/friend.repository"

export class RegenerateInviteCode {
  constructor(private readonly friends: FriendRepository) {}

  async execute(): Promise<string> {
    return this.friends.regenerateInviteCode()
  }
}
