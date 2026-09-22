import { beforeEach, describe, expect, test, vi } from "vitest"
import type { PushTokenRepository } from "../../domain/repositories/push-token.repository"
import { RegisterPushToken } from "./register-push-token.use-case"

describe("RegisterPushToken", () => {
  let pushTokens: PushTokenRepository
  let registerPushToken: RegisterPushToken

  beforeEach(() => {
    pushTokens = { register: vi.fn() }
    registerPushToken = new RegisterPushToken(pushTokens)
  })

  describe("Given a fresh Expo push token", () => {
    test("When registering, Then it's stored against my account", async () => {
      await registerPushToken.execute("ExponentPushToken[abc]")

      expect(pushTokens.register).toHaveBeenCalledWith("ExponentPushToken[abc]")
    })
  })
})
