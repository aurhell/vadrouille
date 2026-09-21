import type { SupabaseClient } from "@supabase/supabase-js"
import type { Walk, WalkRsvpStatus } from "../../domain/entities/walk"
import type { UpdateWalkInput, WalkInput, WalkRepository } from "../../domain/repositories/walk.repository"
import { toWalk, type ParticipantRow, type WalkDogRow, type WalkRow } from "./walk.mapper"

const WALK_COLUMNS = "id, organizer_id, location_text, start_time, duration_minutes"

export class SupabaseWalkRepository implements WalkRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<Walk[]> {
    const { data, error } = await this.client
      .from("walks")
      .select(WALK_COLUMNS)
      .gt("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })

    if (error) throw error
    return this.hydrate((data ?? []) as unknown as WalkRow[])
  }

  async listPast(): Promise<Walk[]> {
    const { data, error } = await this.client
      .from("walks")
      .select(WALK_COLUMNS)
      .lte("start_time", new Date().toISOString())
      .order("start_time", { ascending: false })

    if (error) throw error
    return this.hydrate((data ?? []) as unknown as WalkRow[])
  }

  async findById(id: string): Promise<Walk | null> {
    const { data, error } = await this.client.from("walks").select(WALK_COLUMNS).eq("id", id).maybeSingle<WalkRow>()

    if (error) throw error
    if (!data) return null
    const [walk] = await this.hydrate([data])
    return walk
  }

  async create(input: WalkInput): Promise<Walk> {
    const userId = await this.currentUserId()

    const { data: walkRow, error } = await this.client
      .from("walks")
      .insert({
        organizer_id: userId,
        location_text: input.locationText,
        start_time: input.startTime,
        duration_minutes: input.durationMinutes,
      })
      .select(WALK_COLUMNS)
      .single<WalkRow>()

    if (error) throw error

    const participantRows = [
      { walk_id: walkRow.id, user_id: userId, status: "yes", responded_at: new Date().toISOString() },
      ...input.friendIds.map((friendId) => ({ walk_id: walkRow.id, user_id: friendId, status: "pending" })),
    ]
    const { error: participantsError } = await this.client.from("walk_participants").insert(participantRows)
    if (participantsError) throw participantsError

    if (input.dogIds.length > 0) {
      const dogRows = input.dogIds.map((dogId) => ({ walk_id: walkRow.id, dog_id: dogId, status: "yes", updated_by: userId }))
      const { error: dogsError } = await this.client.from("walk_dogs").insert(dogRows)
      if (dogsError) throw dogsError
    }

    const created = await this.findById(walkRow.id)
    if (!created) throw new Error("Walk not found right after creation")
    return created
  }

  async update(id: string, input: UpdateWalkInput): Promise<Walk> {
    const { error } = await this.client
      .from("walks")
      .update({
        location_text: input.locationText,
        start_time: input.startTime,
        duration_minutes: input.durationMinutes,
      })
      .eq("id", id)
    if (error) throw error

    if (input.newFriendIds.length > 0) {
      const participantRows = input.newFriendIds.map((friendId) => ({ walk_id: id, user_id: friendId, status: "pending" }))
      // ignoreDuplicates, not a plain insert: never touch an existing participant's row (own
      // RSVP status) if a friend already invited is passed in by mistake — see
      // UpdateWalkInput.newFriendIds.
      const { error: participantsError } = await this.client
        .from("walk_participants")
        .upsert(participantRows, { onConflict: "walk_id,user_id", ignoreDuplicates: true })
      if (participantsError) throw participantsError
    }

    const updated = await this.findById(id)
    if (!updated) throw new Error("Walk not found right after update")
    return updated
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from("walks").delete().eq("id", id)
    if (error) throw error
  }

  async respond(walkId: string, status: WalkRsvpStatus): Promise<void> {
    const userId = await this.currentUserId()
    const { error } = await this.client
      .from("walk_participants")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("walk_id", walkId)
      .eq("user_id", userId)
    if (error) throw error
  }

  async confirmDog(walkId: string, dogId: string): Promise<void> {
    const userId = await this.currentUserId()
    const { error } = await this.client
      .from("walk_dogs")
      .upsert(
        { walk_id: walkId, dog_id: dogId, status: "yes", updated_by: userId, responded_at: new Date().toISOString() },
        { onConflict: "walk_id,dog_id" },
      )
    if (error) throw error
  }

  async removeDogFromWalk(walkId: string, dogId: string): Promise<void> {
    const { error } = await this.client.from("walk_dogs").delete().eq("walk_id", walkId).eq("dog_id", dogId)
    if (error) throw error
  }

  private async hydrate(rows: WalkRow[]): Promise<Walk[]> {
    if (rows.length === 0) return []
    const userId = await this.currentUserId()
    const walkIds = rows.map((row) => row.id)
    const [participantsByWalk, dogsByWalk] = await Promise.all([this.participantsFor(walkIds), this.dogsFor(walkIds)])
    return rows.map((row) => toWalk(row, participantsByWalk.get(row.id) ?? [], dogsByWalk.get(row.id) ?? [], userId))
  }

  private async participantsFor(walkIds: string[]): Promise<Map<string, ParticipantRow[]>> {
    const byWalk = new Map<string, ParticipantRow[]>()
    const { data, error } = await this.client
      .from("walk_participants")
      .select("walk_id, status, user:profiles!walk_participants_user_id_fkey(id, username, avatar_url)")
      .in("walk_id", walkIds)

    if (error) throw error
    for (const row of (data ?? []) as unknown as { walk_id: string; status: string; user: ParticipantRow["user"] }[]) {
      const list = byWalk.get(row.walk_id) ?? []
      list.push({ status: row.status as ParticipantRow["status"], user: row.user })
      byWalk.set(row.walk_id, list)
    }
    return byWalk
  }

  private async dogsFor(walkIds: string[]): Promise<Map<string, WalkDogRow[]>> {
    const byWalk = new Map<string, WalkDogRow[]>()
    const { data, error } = await this.client
      .from("walk_dogs")
      .select("walk_id, status, updated_by, dog:dogs(id, name, photo_url)")
      .in("walk_id", walkIds)

    if (error) throw error
    for (const row of (data ?? []) as unknown as { walk_id: string; status: "yes" | "maybe"; updated_by: string | null; dog: WalkDogRow["dog"] }[]) {
      const list = byWalk.get(row.walk_id) ?? []
      list.push({ status: row.status, updated_by: row.updated_by, dog: row.dog })
      byWalk.set(row.walk_id, list)
    }
    return byWalk
  }

  private async currentUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser()
    if (!user) throw new Error("SupabaseWalkRepository called with no authenticated user")
    return user.id
  }
}
