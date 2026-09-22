import type { AccountDeletionRepository } from "../../domain/repositories/account-deletion.repository"
import type { SupabaseClient } from "@supabase/supabase-js"

export class SupabaseAccountDeletionRepository implements AccountDeletionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async deleteAccount(): Promise<void> {
    // The `delete-account` Edge Function itself (service_role cascade — see
    // rgpd-securite.md) doesn't exist yet; this wires the client-side call ahead of it.
    const { error } = await this.client.functions.invoke("delete-account")
    if (error) throw error
  }
}
