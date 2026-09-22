import type { PushTokenRepository } from "../../domain/repositories/push-token.repository"

export class RegisterPushToken {
  constructor(private readonly pushTokens: PushTokenRepository) {}

  async execute(token: string): Promise<void> {
    await this.pushTokens.register(token)
  }
}
