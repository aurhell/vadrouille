import type { SupabaseClient } from "@supabase/supabase-js"
import type { Dog, DogCoOwner } from "../../domain/entities/dog"
import type { DogInput, DogRepository } from "../../domain/repositories/dog.repository"
import { toDog, type DogRow } from "./dog.mapper"

const DOG_COLUMNS = "id, name, breed, birth_date, sex, photo_url"

interface CoOwnerRow {
  id: string
  username: string
  avatar_url: string | null
}

export class SupabaseDogRepository implements DogRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Dog[]> {
    const userId = await this.currentUserId()
    // Explicit user_id filter, not left to RLS alone: an owner is also allowed to see their
    // co-owners' dog_owners rows (needed for coOwnersFor() below), so without this filter a
    // shared dog would come back once per person sharing it instead of once for me.
    const { data, error } = await this.client
      .from("dog_owners")
      .select(`role, dog:dogs(${DOG_COLUMNS})`)
      .eq("status", "accepted")
      .eq("user_id", userId)

    if (error) throw error
    const rows = (data ?? []) as unknown as { role: "owner" | "co-owner"; dog: DogRow }[]
    const coOwnersByDog = await this.coOwnersFor(
      rows.map((row) => row.dog.id),
      userId,
    )
    return rows.map((row) => toDog(row.dog, row.role, coOwnersByDog.get(row.dog.id) ?? []))
  }

  async findById(id: string): Promise<Dog | null> {
    const userId = await this.currentUserId()
    const { data, error } = await this.client
      .from("dog_owners")
      .select(`role, dog:dogs(${DOG_COLUMNS})`)
      .eq("dog_id", id)
      .eq("status", "accepted")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    const row = data as unknown as { role: "owner" | "co-owner"; dog: DogRow }
    const coOwnersByDog = await this.coOwnersFor([row.dog.id], userId)
    return toDog(row.dog, row.role, coOwnersByDog.get(row.dog.id) ?? [])
  }

  async create(input: DogInput): Promise<Dog> {
    const { data, error } = await this.client
      .from("dogs")
      .insert({ name: input.name, breed: input.breed ?? null, birth_date: input.birthDate ?? null, sex: input.sex ?? null })
      .select(DOG_COLUMNS)
      .single<DogRow>()

    if (error) throw error
    // The AFTER INSERT trigger always makes the creator the accepted owner, and a brand new
    // dog has no co-owners yet — no need to re-query for either.
    return toDog(data, "owner", [])
  }

  async update(id: string, input: DogInput): Promise<Dog> {
    const { data, error } = await this.client
      .from("dogs")
      .update({ name: input.name, breed: input.breed ?? null, birth_date: input.birthDate ?? null, sex: input.sex ?? null })
      .eq("id", id)
      .select(DOG_COLUMNS)
      .single<DogRow>()

    if (error) throw error
    return this.withRoleAndCoOwners(data)
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("dogs").delete().eq("id", id)
    if (error) throw error
  }

  async updatePhoto(id: string, photoUrl: string): Promise<Dog> {
    const { data, error } = await this.client.from("dogs").update({ photo_url: photoUrl }).eq("id", id).select(DOG_COLUMNS).single<DogRow>()

    if (error) throw error
    return this.withRoleAndCoOwners(data)
  }

  async removePhoto(id: string): Promise<Dog> {
    const { data, error } = await this.client.from("dogs").update({ photo_url: null }).eq("id", id).select(DOG_COLUMNS).single<DogRow>()

    if (error) throw error
    return this.withRoleAndCoOwners(data)
  }

  private async withRoleAndCoOwners(row: DogRow): Promise<Dog> {
    const userId = await this.currentUserId()
    const [role, coOwnersByDog] = await Promise.all([this.myRole(row.id, userId), this.coOwnersFor([row.id], userId)])
    return toDog(row, role, coOwnersByDog.get(row.id) ?? [])
  }

  private async currentUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser()
    if (!user) throw new Error("SupabaseDogRepository called with no authenticated user")
    return user.id
  }

  private async myRole(dogId: string, userId: string): Promise<"owner" | "co-owner"> {
    const { data, error } = await this.client.from("dog_owners").select("role").eq("dog_id", dogId).eq("user_id", userId).single<{
      role: "owner" | "co-owner"
    }>()

    if (error) throw error
    return data.role
  }

  /** Other accepted owners/co-owners per dog id, excluding the caller themselves. */
  private async coOwnersFor(dogIds: string[], excludeUserId: string): Promise<Map<string, DogCoOwner[]>> {
    const byDog = new Map<string, DogCoOwner[]>()
    if (dogIds.length === 0) return byDog

    const { data, error } = await this.client
      .from("dog_owners")
      .select("dog_id, user:profiles!dog_owners_user_id_fkey(id, username, avatar_url)")
      .in("dog_id", dogIds)
      .eq("status", "accepted")
      .neq("user_id", excludeUserId)

    if (error) throw error
    for (const row of (data ?? []) as unknown as { dog_id: string; user: CoOwnerRow }[]) {
      const list = byDog.get(row.dog_id) ?? []
      list.push({ id: row.user.id, username: row.user.username, avatarUrl: row.user.avatar_url })
      byDog.set(row.dog_id, list)
    }
    return byDog
  }
}
