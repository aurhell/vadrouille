import { beforeEach, describe, expect, test } from "vitest"
import { InMemoryProfileRepository } from "../../domain/repositories/profile.repository"
import { UpdateUsername } from "./update-username.use-case"

describe("UpdateUsername", () => {
  let repository: InMemoryProfileRepository
  let updateUsername: UpdateUsername

  beforeEach(async () => {
    repository = new InMemoryProfileRepository()
    updateUsername = new UpdateUsername(repository)
    await repository.create({ id: "user-1", username: "alice" })
  })

  describe("Given a username respecting the expected format", () => {
    test("When updating, Then the profile's username is updated, with no uniqueness check", async () => {
      const result = await updateUsername.execute({ id: "user-1", username: "alice2" })

      expect(result).toEqual({ success: true, profile: expect.objectContaining({ username: "alice2" }) })
      expect((await repository.findById("user-1"))?.username).toBe("alice2")
    })
  })

  describe("Given an empty username", () => {
    test("When updating, Then it fails with reason 'required' and the previous username is kept", async () => {
      const result = await updateUsername.execute({ id: "user-1", username: "" })

      expect(result).toEqual({ success: false, reason: "required" })
      expect((await repository.findById("user-1"))?.username).toBe("alice")
    })
  })

  describe("Given a username with an invalid format", () => {
    test("When updating, Then it fails with reason 'invalid_format' and the previous username is kept", async () => {
      const result = await updateUsername.execute({ id: "user-1", username: "a" })

      expect(result).toEqual({ success: false, reason: "invalid_format" })
      expect((await repository.findById("user-1"))?.username).toBe("alice")
    })
  })
})
