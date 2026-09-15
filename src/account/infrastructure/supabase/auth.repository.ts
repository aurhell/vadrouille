import type { SupabaseClient } from "@supabase/supabase-js"
import * as Linking from "expo-linking"
import type { AuthRepository } from "../../domain/repositories/auth.repository"

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async requestMagicLink(email: string): Promise<void> {
    // Without this, the magic link redirects to Supabase's default site_url (a placeholder
    // web URL, see supabase/config.toml) instead of back into the app. Linking.createURL
    // resolves to the right scheme automatically (exp://... in Expo Go, vadrouille://... in
    // a standalone/dev-client build) — see supabase/config.toml's additional_redirect_urls
    // for the matching allow-list entries, and SessionProvider for how the returned tokens
    // are picked back up.
    const { error } = await this.client.auth.signInWithOtp({ email, options: { emailRedirectTo: Linking.createURL("/") } })
    if (error) throw error
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error) throw error
  }
}
