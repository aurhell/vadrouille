import { describe, expect, test, vi } from "vitest"
import { createWalkFixture } from "../../fixtures/walk.fixture"
import { createWalkRepositoryMock } from "../../fixtures/walk-repository.fixture"
import { RespondToWalkInvite } from "./respond-to-walk-invite.use-case"

describe("RespondToWalkInvite", () => {
  describe("Given I respond 'yes'", () => {
    test("When responding, Then my RSVP is recorded and no dog is touched", async () => {
      const walks = createWalkRepositoryMock()
      const useCase = new RespondToWalkInvite(walks)

      await useCase.execute("walk-1", "yes", ["rex"])

      expect(walks.respond).toHaveBeenCalledWith("walk-1", "yes")
      expect(walks.findById).not.toHaveBeenCalled()
      expect(walks.removeDogFromWalk).not.toHaveBeenCalled()
    })
  })

  describe("Given I already had a dog confirmed and I change my response to 'no'", () => {
    test("When responding, Then my confirmed dog is released from the walk", async () => {
      const walk = createWalkFixture({ dogs: [{ id: "rex", name: "Rex", photoUrl: null, status: "yes" }] })
      const walks = createWalkRepositoryMock({ findById: vi.fn().mockResolvedValue(walk) })
      const useCase = new RespondToWalkInvite(walks)

      await useCase.execute("walk-1", "no", ["rex"])

      expect(walks.respond).toHaveBeenCalledWith("walk-1", "no")
      expect(walks.removeDogFromWalk).toHaveBeenCalledWith("walk-1", "rex")
    })
  })

  describe("Given I change my response to 'no' but a confirmed dog isn't mine", () => {
    test("When responding, Then that dog is left untouched", async () => {
      const walk = createWalkFixture({ dogs: [{ id: "not-mine", name: "Milo", photoUrl: null, status: "yes" }] })
      const walks = createWalkRepositoryMock({ findById: vi.fn().mockResolvedValue(walk) })
      const useCase = new RespondToWalkInvite(walks)

      await useCase.execute("walk-1", "no", [])

      expect(walks.removeDogFromWalk).not.toHaveBeenCalled()
    })
  })
})
