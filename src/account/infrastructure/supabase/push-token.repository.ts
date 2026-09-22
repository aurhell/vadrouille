import type { SupabaseClient } from "@supabase/supabase-js"
import type { PushTokenRepository } from "../../domain/repositories/push-token.repository"

export class SupabasePushTokenRepository implements PushTokenRepository {
  constructor(private readonly client: SupabaseClient) {}

  async register(token: string): Promise<void> {
    const {
      data: { user },
    } = await this.client.auth.getUser()
    if (!user) throw new Error("SupabasePushTokenRepository.register called with no authenticated user")

    const { error } = await this.client
      .from("push_tokens")
      .upsert({ user_id: user.id, expo_push_token: token, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    if (error) throw error
  }
}
