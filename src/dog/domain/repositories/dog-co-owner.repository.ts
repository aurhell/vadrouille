import type { DogCoOwnerInvite } from "../entities/dog"

export interface DogCoOwnerRepository {
  /** Pending invites I (as owner) sent for my dogs, awaiting the invitee's response. */
  listSentInvites(): Promise<DogCoOwnerInvite[]>
  /** Pending invites I received, awaiting my accept/decline. */
  listReceivedInvites(): Promise<DogCoOwnerInvite[]>
  /** RLS-enforced: only an accepted owner of the dog, inviting an accepted friend. */
  inviteCoOwner(dogId: string, friendId: string): Promise<void>
  acceptInvite(dogId: string): Promise<void>
  declineInvite(dogId: string): Promise<void>
  /** Owner withdraws an invite they sent, before the invitee has responded. */
  cancelInvite(dogId: string, inviteeId: string): Promise<void>
  /** An accepted co-owner voluntarily leaves — never the owner (see dog.docs.md). */
  leaveCoOwnership(dogId: string): Promise<void>
}
