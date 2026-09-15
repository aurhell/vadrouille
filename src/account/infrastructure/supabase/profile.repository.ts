import type { SupabaseClient } from "@supabase/supabase-js"
import type { Profile } from "../../domain/entities/profile"
import type { ProfileRepository } from "../../domain/repositories/profile.repository"
import { toProfile, type ProfileRow } from "./profile.mapper"

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: { id: string; username: string }): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .insert({ id: input.id, username: input.username })
      .select()
      .single<ProfileRow>()

    if (error) throw error
    return toProfile(data)
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.client.from("profiles").select().eq("id", id).maybeSingle<ProfileRow>()

    if (error) throw error
    return data ? toProfile(data) : null
  }

  async updateUsername(id: string, username: string): Promise<Profile> {
    const { data, error } = await this.client.from("profiles").update({ username }).eq("id", id).select().single<ProfileRow>()

    if (error) throw error
    return toProfile(data)
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", id)
      .select()
      .single<ProfileRow>()

    if (error) throw error
    return toProfile(data)
  }

  async removeAvatar(id: string): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", id)
      .select()
      .single<ProfileRow>()

    if (error) throw error
    return toProfile(data)
  }
}
