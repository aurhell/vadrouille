import type { DogCoOwner, DogCoOwnerInvite } from "../../domain/entities/dog"
import type { DogCoOwnerRepository } from "../../domain/repositories/dog-co-owner.repository"
import type { SupabaseClient } from "@supabase/supabase-js"

type UserRow = {
  id: string
  username: string
  avatar_url: string | null
}

function toCoOwner(row: UserRow): DogCoOwner {
  return { id: row.id, username: row.username, avatarUrl: row.avatar_url }
}

export class SupabaseDogCoOwnerRepository implements DogCoOwnerRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listSentInvites(): Promise<DogCoOwnerInvite[]> {
    const userId = await this.currentUserId()
    const { data, error } = await this.client
      .from("dog_owners")
      .select("dog:dogs!inner(id, name, photo_url, created_by), invitee:profiles!dog_owners_user_id_fkey(id, username, avatar_url)")
      .eq("status", "pending")
      .eq("role", "co-owner")
      .eq("dog.created_by", userId)

    if (error) throw error
    return ((data ?? []) as unknown as { dog: { id: string; name: string; photo_url: string | null }; invitee: UserRow }[]).map((row) => ({
      dogId: row.dog.id,
      dogName: row.dog.name,
      dogPhotoUrl: row.dog.photo_url,
      otherUser: toCoOwner(row.invitee),
    }))
  }

  async listReceivedInvites(): Promise<DogCoOwnerInvite[]> {
    const userId = await this.currentUserId()
    const { data, error } = await this.client
      .from("dog_owners")
      .select("dog:dogs(id, name, photo_url, owner:profiles!dogs_created_by_fkey(id, username, avatar_url))")
      .eq("user_id", userId)
      .eq("status", "pending")

    if (error) throw error
    return (
      (data ?? []) as unknown as { dog: { id: string; name: string; photo_url: string | null; owner: UserRow } }[]
    ).map((row) => ({
      dogId: row.dog.id,
      dogName: row.dog.name,
      dogPhotoUrl: row.dog.photo_url,
      otherUser: toCoOwner(row.dog.owner),
    }))
  }

  async inviteCoOwner(dogId: string, friendId: string): Promise<void> {
    const { error } = await this.client.from("dog_owners").insert({ dog_id: dogId, user_id: friendId, role: "co-owner", status: "pending" })
    if (error) throw error
  }

  async acceptInvite(dogId: string): Promise<void> {
    const userId = await this.currentUserId()
    const { error } = await this.client.from("dog_owners").update({ status: "accepted" }).eq("dog_id", dogId).eq("user_id", userId)
    if (error) throw error
  }

  async declineInvite(dogId: string): Promise<void> {
    const userId = await this.currentUserId()
    const { error } = await this.client.from("dog_owners").delete().eq("dog_id", dogId).eq("user_id", userId)
    if (error) throw error
  }

  async cancelInvite(dogId: string, inviteeId: string): Promise<void> {
    const { error } = await this.client.from("dog_owners").delete().eq("dog_id", dogId).eq("user_id", inviteeId)
    if (error) throw error
  }

  async leaveCoOwnership(dogId: string): Promise<void> {
    const userId = await this.currentUserId()
    const { error } = await this.client.from("dog_owners").delete().eq("dog_id", dogId).eq("user_id", userId)
    if (error) throw error
  }

  private async currentUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser()
    if (!user) throw new Error("SupabaseDogCoOwnerRepository called with no authenticated user")
    return user.id
  }
}
