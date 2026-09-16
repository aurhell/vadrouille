import type { Friend } from "../../domain/entities/friend"
import type { FriendRepository } from "../../domain/repositories/friend.repository"

export class LookupInviteCode {
  constructor(private readonly friends: FriendRepository) {}

  async execute(code: string): Promise<Friend | null> {
    return this.friends.lookupInviteCode(code)
  }
}
