import { describe, expect, test } from "vitest"
import { createDogFixture } from "../fixtures/dog.fixture"
import { deleteDogMessage } from "./delete-dog-message"

describe("deleteDogMessage", () => {
  describe("Given a dog with no co-owners", () => {
    test("When building the message, Then it only mentions the photo", () => {
      const dog = createDogFixture({ coOwners: [] })

      expect(deleteDogMessage(dog)).toBe("Cette action est définitive, y compris sa photo.")
    })
  })

  describe("Given a dog shared with one co-owner", () => {
    test("When building the message, Then it warns that co-owner loses the dog too", () => {
      const dog = createDogFixture({ name: "Rex", coOwners: [{ id: "alice-id", username: "alice", avatarUrl: null }] })

      expect(deleteDogMessage(dog)).toBe(
        "Cette action est définitive, y compris sa photo. Rex disparaîtra aussi du foyer partagé de alice.",
      )
    })
  })

  describe("Given a dog shared with several co-owners", () => {
    test("When building the message, Then all of them are named", () => {
      const dog = createDogFixture({
        name: "Rex",
        coOwners: [
          { id: "alice-id", username: "alice", avatarUrl: null },
          { id: "bob-id", username: "bob", avatarUrl: null },
        ],
      })

      expect(deleteDogMessage(dog)).toBe(
        "Cette action est définitive, y compris sa photo. Rex disparaîtra aussi du foyer partagé de alice, bob.",
      )
    })
  })
})
