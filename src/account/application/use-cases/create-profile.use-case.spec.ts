import { beforeEach, describe, expect, test } from "vitest"

import { InMemoryProfileRepository } from "../../fixtures/profile-repository.fixture"

import { CreateProfile } from "./create-profile.use-case"

describe("CreateProfile", () => {
  let repository: InMemoryProfileRepository
  let createProfile: CreateProfile

  beforeEach(() => {
    repository = new InMemoryProfileRepository()
    createProfile = new CreateProfile(repository)
  })

  describe("Given a username respecting the expected format", () => {
    test("When creating the profile, Then it is persisted with that username and a generated invite code", async() => {
      const result = await createProfile.execute({ id: "user-1", username: "Alice" })

      expect(result).toEqual({
        success: true,
        profile: {
          id: "user-1",
          username: "Alice",
          avatarUrl: null,
          inviteCode: expect.any(String),
          createdAt: expect.any(String),
        },
      })
    })
  })

  describe("Given an empty username", () => {
    test("When creating the profile, Then it fails with reason 'required' and nothing is persisted", async() => {
      const result = await createProfile.execute({ id: "user-1", username: "" })

      expect(result).toEqual({ success: false, reason: "required" })
      expect(await repository.findById("user-1")).toBeNull()
    })
  })

  describe("Given a username with an invalid format", () => {
    test("When creating the profile, Then it fails with reason 'invalid_format' and nothing is persisted", async() => {
      const result = await createProfile.execute({ id: "user-1", username: "a" })

      expect(result).toEqual({ success: false, reason: "invalid_format" })
      expect(await repository.findById("user-1")).toBeNull()
    })
  })

  describe("Given a username already used by another profile", () => {
    test("When creating the profile, Then it still succeeds — usernames are not unique, the email differentiates accounts", async() => {
      await createProfile.execute({ id: "user-1", username: "Bob" })

      const result = await createProfile.execute({ id: "user-2", username: "Bob" })

      expect(result.success).toBe(true)
    })
  })
})
