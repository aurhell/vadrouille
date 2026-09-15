import type { AuthRepository } from "../../domain/repositories/auth.repository"

export class SignOut {
  constructor(private readonly auth: AuthRepository) {}

  async execute(): Promise<void> {
    await this.auth.signOut()
  }
}
