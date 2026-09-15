/** Invokes the service_role Edge Function that runs the full deletion cascade
 * (see rgpd-securite.md) — the client can never perform this itself. */
export interface AccountDeletionRepository {
  deleteAccount(): Promise<void>
}
