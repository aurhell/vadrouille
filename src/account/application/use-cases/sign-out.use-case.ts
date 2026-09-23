import type { AuthRepository } from "../../domain/repositories/auth.repository"
import type { PushTokenRepository } from "../../domain/repositories/push-token.repository"

export class SignOut {
  constructor(
    private readonly auth: AuthRepository,
    private readonly pushTokens: PushTokenRepository,
  ) {}

  async execute(): Promise<void> {
    // Best-effort, before signing out (needs the still-active session to identify whose row
    // to delete) — a shared/reused device (see roadmap "no multi-device fan-out") would
    // otherwise keep receiving this account's push notifications after someone else signs in
    // on it, until they happen to re-register their own token over it.
    try {
      await this.pushTokens.remove()
    } catch {
      // Not worth blocking sign-out over — same best-effort posture as the rest of this app's
      // notification-adjacent features (see modele-de-donnees.md §Notifications push).
    }
    await this.auth.signOut()
  }
}
