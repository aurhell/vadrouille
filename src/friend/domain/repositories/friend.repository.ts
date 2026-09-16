import type { Friend } from "../entities/friend"

export type RedeemInviteCodeOutcome =
  | { outcome: "created" }
  | { outcome: "auto_accepted" }
  | { outcome: "already_friends" }
  | { outcome: "already_pending" }
  | { outcome: "invalid_code" }
  | { outcome: "own_code" }

export interface FriendRepository {
  /** Always the current authenticated user's own accepted friends — never someone else's. */
  list(): Promise<Friend[]>
  /** Pending requests I sent, still awaiting the other person's response. */
  listSentRequests(currentUserId: string): Promise<Friend[]>
  /** Pending requests I received, awaiting my accept/decline. */
  listReceivedRequests(currentUserId: string): Promise<Friend[]>
  /** Read-only preview of who owns a code, for the "Ajouter X comme ami ?" confirmation —
   * creates nothing. Null for an unknown code. */
  lookupInviteCode(code: string): Promise<Friend | null>
  /** Sends a friend request (or auto-accepts a crossed one already pending the other way). */
  redeemInviteCode(code: string): Promise<RedeemInviteCodeOutcome>
  acceptFriendRequest(requesterId: string): Promise<void>
  declineFriendRequest(requesterId: string): Promise<void>
  cancelFriendRequest(addresseeId: string): Promise<void>
  /** Ends an accepted friendship in both directions. No-op if the two aren't friends. */
  removeFriend(friendId: string): Promise<void>
  /** Replaces the caller's own invite code and returns the new one; the old one stops working. */
  regenerateInviteCode(): Promise<string>
}
