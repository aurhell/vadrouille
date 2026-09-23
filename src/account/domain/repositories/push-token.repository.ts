export type PushTokenRepository = {
  /** Upserts my Expo push token (one row per user — see push_notifications.sql migration).
   * RLS-enforced: only my own row. */
  register(token: string): Promise<void>

  /** Deletes my push token row, if any — called on sign-out so a shared/reused device doesn't
   * keep receiving the previous account's push notifications until someone else re-registers
   * their own token over it (see sign-out.use-case.ts). Idempotent: no error if there was no
   * row to begin with. */
  remove(): Promise<void>
}
