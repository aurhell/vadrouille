export interface PushTokenRepository {
  /** Upserts my Expo push token (one row per user — see push_notifications.sql migration).
   * RLS-enforced: only my own row. */
  register(token: string): Promise<void>
}
