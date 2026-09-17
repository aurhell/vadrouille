export type DogSex = "male" | "female"

export interface DogCoOwner {
  id: string
  username: string
  avatarUrl: string | null
}

export interface Dog {
  id: string
  name: string
  breed: string | null
  birthDate: string | null
  sex: DogSex | null
  photoUrl: string | null
  /** Mine to edit either way, but only an owner can delete the dog or invite co-owners. */
  myRole: "owner" | "co-owner"
  /** Other accepted owners/co-owners — never includes me. Empty when the dog is solely mine. */
  coOwners: DogCoOwner[]
}

export interface DogCoOwnerInvite {
  dogId: string
  dogName: string
  dogPhotoUrl: string | null
  /** The other person: who I invited (sent) or who invited me (received). */
  otherUser: DogCoOwner
}
