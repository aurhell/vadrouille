import type { FriendRepository, RedeemInviteCodeOutcome } from "../../domain/repositories/friend.repository"

export type RedeemInviteCodeInput = { code: string }

export class RedeemInviteCode {
  constructor(private readonly friends: FriendRepository) {}

  async execute(input: RedeemInviteCodeInput): Promise<RedeemInviteCodeOutcome> {
    return this.friends.redeemInviteCode(input.code)
  }
}
