import type { AccountDeletionRepository } from "../../domain/repositories/account-deletion.repository"
import type { AuthRepository } from "../../domain/repositories/auth.repository"

export class DeleteAccount {
  constructor(
    private readonly accountDeletion: AccountDeletionRepository,
    private readonly auth: AuthRepository,
  ) {}

  async execute(): Promise<void> {
    await this.accountDeletion.deleteAccount()
    await this.auth.signOut()
  }
}
