import { describe, expect, test } from "vitest"
import { createWalkFixture } from "../fixtures/walk.fixture"
import { organizerDisplayName, pairParticipantsWithDogs } from "./pair-participants-with-dogs"

describe("pairParticipantsWithDogs", () => {
  describe("Given a dog confirmed by a participant", () => {
    test("When pairing, Then the dog is attached to that participant", () => {
      const walk = createWalkFixture({
        participants: [{ id: "alice", username: "alice", avatarUrl: null, status: "yes" }],
        dogs: [{ id: "rex", name: "Rex", photoUrl: null, status: "yes", updatedBy: "alice" }],
      })

      const result = pairParticipantsWithDogs(walk)

      expect(result.participants).toEqual([{ id: "alice", username: "alice", avatarUrl: null, status: "yes", dogs: walk.dogs }])
      expect(result.unattributed).toEqual([])
    })
  })

  describe("Given a shared dog confirmed by one of its two co-owners, both participants", () => {
    test("When pairing, Then the dog appears only under the confirming participant, not both", () => {
      const walk = createWalkFixture({
        participants: [
          { id: "alice", username: "alice", avatarUrl: null, status: "yes" },
          { id: "bob", username: "bob", avatarUrl: null, status: "yes" },
        ],
        dogs: [{ id: "rex", name: "Rex", photoUrl: null, status: "yes", updatedBy: "alice" }],
      })

      const result = pairParticipantsWithDogs(walk)

      expect(result.participants.find((p) => p.id === "alice")?.dogs).toHaveLength(1)
      expect(result.participants.find((p) => p.id === "bob")?.dogs).toHaveLength(0)
    })
  })

  describe("Given a participant with no confirmed dog", () => {
    test("When pairing, Then their dogs list is empty", () => {
      const walk = createWalkFixture({
        participants: [{ id: "alice", username: "alice", avatarUrl: null, status: "pending" }],
        dogs: [],
      })

      const result = pairParticipantsWithDogs(walk)

      expect(result.participants).toEqual([{ id: "alice", username: "alice", avatarUrl: null, status: "pending", dogs: [] }])
    })
  })

  describe("Given a confirmed dog whose confirming account no longer exists (updatedBy null)", () => {
    test("When pairing, Then the dog is unattributed rather than dropped", () => {
      const walk = createWalkFixture({
        participants: [{ id: "alice", username: "alice", avatarUrl: null, status: "yes" }],
        dogs: [{ id: "rex", name: "Rex", photoUrl: null, status: "yes", updatedBy: null }],
      })

      const result = pairParticipantsWithDogs(walk)

      expect(result.participants[0].dogs).toEqual([])
      expect(result.unattributed).toEqual(walk.dogs)
    })
  })

  describe("Given a confirmed dog attributed to a user who is no longer a participant", () => {
    test("When pairing, Then the dog is unattributed rather than silently dropped", () => {
      const walk = createWalkFixture({
        participants: [{ id: "alice", username: "alice", avatarUrl: null, status: "yes" }],
        dogs: [{ id: "rex", name: "Rex", photoUrl: null, status: "yes", updatedBy: "someone-who-left" }],
      })

      const result = pairParticipantsWithDogs(walk)

      expect(result.unattributed).toEqual(walk.dogs)
    })
  })
})

describe("organizerDisplayName", () => {
  describe("Given the organizer is me", () => {
    test("When computing the name, Then it returns 'toi'", () => {
      const walk = createWalkFixture({ organizerId: "me", participants: [{ id: "me", username: "me", avatarUrl: null, status: "yes" }] })

      expect(organizerDisplayName(walk, "me")).toBe("toi")
    })
  })

  describe("Given the organizer is someone else still a participant", () => {
    test("When computing the name, Then it returns their username", () => {
      const walk = createWalkFixture({ organizerId: "alice", participants: [{ id: "alice", username: "alice", avatarUrl: null, status: "yes" }] })

      expect(organizerDisplayName(walk, "me")).toBe("alice")
    })
  })

  describe("Given the organizer's account has since been deleted (organizerId null)", () => {
    test("When computing the name, Then it returns 'Utilisateur supprimé'", () => {
      const walk = createWalkFixture({ organizerId: null, participants: [] })

      expect(organizerDisplayName(walk, "me")).toBe("Utilisateur supprimé")
    })
  })

  describe("Given an organizerId with no matching participant (defensive case)", () => {
    test("When computing the name, Then it falls back to 'Utilisateur supprimé'", () => {
      const walk = createWalkFixture({ organizerId: "ghost", participants: [] })

      expect(organizerDisplayName(walk, "me")).toBe("Utilisateur supprimé")
    })
  })
})
