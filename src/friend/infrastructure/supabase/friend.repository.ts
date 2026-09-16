import type { SupabaseClient } from "@supabase/supabase-js"
import type { Friend } from "../../domain/entities/friend"
import type { FriendRepository, RedeemInviteCodeOutcome } from "../../domain/repositories/friend.repository"

interface FriendRow {
  id: string
  username: string
  avatar_url: string | null
}

function toFriend(row: FriendRow): Friend {
  return { id: row.id, username: row.username, avatarUrl: row.avatar_url }
}

const REDEEM_OUTCOMES: RedeemInviteCodeOutcome["outcome"][] = ["created", "auto_accepted", "already_friends", "already_pending"]

export class SupabaseFriendRepository implements FriendRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Friend[]> {
    const { data, error } = await this.client
      .from("friendships")
      .select("friend:profiles!friendships_friend_id_fkey(id, username, avatar_url)")
      .eq("status", "accepted")

    if (error) throw error
    return ((data ?? []) as unknown as { friend: FriendRow }[]).map((row) => toFriend(row.friend))
  }

  async listSentRequests(currentUserId: string): Promise<Friend[]> {
    const { data, error } = await this.client
      .from("friendships")
      .select("friend:profiles!friendships_friend_id_fkey(id, username, avatar_url)")
      .eq("status", "pending")
      .eq("user_id", currentUserId)

    if (error) throw error
    return ((data ?? []) as unknown as { friend: FriendRow }[]).map((row) => toFriend(row.friend))
  }

  async listReceivedRequests(currentUserId: string): Promise<Friend[]> {
    const { data, error } = await this.client
      .from("friendships")
      .select("requester:profiles!friendships_user_id_fkey(id, username, avatar_url)")
      .eq("status", "pending")
      .eq("friend_id", currentUserId)

    if (error) throw error
    return ((data ?? []) as unknown as { requester: FriendRow }[]).map((row) => toFriend(row.requester))
  }

  async lookupInviteCode(code: string): Promise<Friend | null> {
    const { data, error } = await this.client.rpc("lookup_invite_code", { code })

    if (error) throw error
    const row = (data as FriendRow[] | null)?.[0]
    return row ? toFriend(row) : null
  }

  async redeemInviteCode(code: string): Promise<RedeemInviteCodeOutcome> {
    const { data, error } = await this.client.rpc("redeem_invite_code", { code })

    if (error) {
      if (error.message === "invalid_invite_code") return { outcome: "invalid_code" }
      if (error.message === "cannot_redeem_own_code") return { outcome: "own_code" }
      throw error
    }

    const outcome = REDEEM_OUTCOMES.find((candidate) => candidate === data)
    if (!outcome) throw new Error(`redeem_invite_code returned an unexpected outcome: ${String(data)}`)
    return { outcome }
  }

  async acceptFriendRequest(requesterId: string): Promise<void> {
    const { error } = await this.client.rpc("accept_friend_request", { requester_id: requesterId })
    if (error) throw error
  }

  async declineFriendRequest(requesterId: string): Promise<void> {
    const { error } = await this.client.rpc("decline_friend_request", { requester_id: requesterId })
    if (error) throw error
  }

  async cancelFriendRequest(addresseeId: string): Promise<void> {
    const { error } = await this.client.rpc("cancel_friend_request", { addressee_id: addresseeId })
    if (error) throw error
  }

  async removeFriend(friendId: string): Promise<void> {
    const { error } = await this.client.rpc("remove_friend", { target_user_id: friendId })
    if (error) throw error
  }

  async regenerateInviteCode(): Promise<string> {
    const { data, error } = await this.client.rpc("regenerate_invite_code")

    if (error) throw error
    return data as string
  }
}
