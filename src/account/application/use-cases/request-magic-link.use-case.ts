import { validateEmail } from "../../domain/policies/email.policy"
import type { AuthRepository } from "../../domain/repositories/auth.repository"

export type RequestMagicLinkInput = { email: string }

export type RequestMagicLinkResult = { success: true } | { success: false; reason: "invalid_format" }

export class RequestMagicLink {
  constructor(private readonly auth: AuthRepository) {}

  async execute(input: RequestMagicLinkInput): Promise<RequestMagicLinkResult> {
    const validation = validateEmail(input.email)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    await this.auth.requestMagicLink(input.email)
    return { success: true }
  }
}
