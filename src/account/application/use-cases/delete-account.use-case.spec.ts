import { beforeEach, describe, expect, test, vi } from "vitest"
import type { AccountDeletionRepository } from "../../domain/repositories/account-deletion.repository"
import type { AuthRepository } from "../../domain/repositories/auth.repository"
import { DeleteAccount } from "./delete-account.use-case"

// The confirmation step ("Confirmation explicite requise") and the server-side deletion
// cascade for future/past walks and co-owned dogs (rgpd-securite.md) are out of scope here:
// the former is a presentation-layer flow (this use-case only runs after confirmation), the
// latter runs in the service_role Edge Function behind deleteAccount(), not in this client
// use-case.
describe("DeleteAccount", () => {
  let accountDeletion: AccountDeletionRepository
  let auth: AuthRepository
  let deleteAccount: DeleteAccount

  beforeEach(() => {
    accountDeletion = { deleteAccount: vi.fn() }
    auth = { requestMagicLink: vi.fn(), signOut: vi.fn() }
    deleteAccount = new DeleteAccount(accountDeletion, auth)
  })

  describe("Given a confirmed account deletion", () => {
    test("When executing, Then the account is deleted and the session is terminated", async () => {
      await deleteAccount.execute()

      expect(accountDeletion.deleteAccount).toHaveBeenCalledOnce()
      expect(auth.signOut).toHaveBeenCalledOnce()
    })
  })
})
