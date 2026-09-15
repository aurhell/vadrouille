import type { Profile } from "../../domain/entities/profile"

/** Shape of a row from the `profiles` table (see supabase/migrations/*_profiles.sql). */
export interface ProfileRow {
  id: string
  username: string
  avatar_url: string | null
  invite_code: string
  created_at: string
}

export function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url,
    inviteCode: row.invite_code,
    createdAt: row.created_at,
  }
}
