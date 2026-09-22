import type { Friend } from "../../domain/entities/friend"

/** Shape of a row from the `profiles` table, as selected through a `friendships` join
 * (see supabase/migrations/*_friendships.sql). */
export type FriendRow = {
  id: string
  username: string
  avatar_url: string | null
}

export function toFriend(row: FriendRow): Friend {
  return { id: row.id, username: row.username, avatarUrl: row.avatar_url }
}
