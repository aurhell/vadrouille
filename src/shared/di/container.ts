import { CreateProfile } from "@/account/application/use-cases/create-profile.use-case"
import { DeleteAccount } from "@/account/application/use-cases/delete-account.use-case"
import { RemoveAvatar } from "@/account/application/use-cases/remove-avatar.use-case"
import { RequestMagicLink } from "@/account/application/use-cases/request-magic-link.use-case"
import { SignOut } from "@/account/application/use-cases/sign-out.use-case"
import { UpdateAvatar } from "@/account/application/use-cases/update-avatar.use-case"
import { UpdateUsername } from "@/account/application/use-cases/update-username.use-case"
import { SupabaseAccountDeletionRepository } from "@/account/infrastructure/supabase/account-deletion.repository"
import { SupabaseAuthRepository } from "@/account/infrastructure/supabase/auth.repository"
import { SupabaseProfileRepository } from "@/account/infrastructure/supabase/profile.repository"
import { SupabaseStorageRepository } from "@/account/infrastructure/supabase/storage.repository"
import { AcceptFriendRequest } from "@/friend/application/use-cases/accept-friend-request.use-case"
import { CancelFriendRequest } from "@/friend/application/use-cases/cancel-friend-request.use-case"
import { DeclineFriendRequest } from "@/friend/application/use-cases/decline-friend-request.use-case"
import { LookupInviteCode } from "@/friend/application/use-cases/lookup-invite-code.use-case"
import { RedeemInviteCode } from "@/friend/application/use-cases/redeem-invite-code.use-case"
import { RegenerateInviteCode } from "@/friend/application/use-cases/regenerate-invite-code.use-case"
import { RemoveFriend } from "@/friend/application/use-cases/remove-friend.use-case"
import { SupabaseFriendRepository } from "@/friend/infrastructure/supabase/friend.repository"
import { AcceptCoOwnerInvite } from "@/dog/application/use-cases/accept-co-owner-invite.use-case"
import { CancelCoOwnerInvite } from "@/dog/application/use-cases/cancel-co-owner-invite.use-case"
import { CreateDog } from "@/dog/application/use-cases/create-dog.use-case"
import { DeclineCoOwnerInvite } from "@/dog/application/use-cases/decline-co-owner-invite.use-case"
import { InviteCoOwner } from "@/dog/application/use-cases/invite-co-owner.use-case"
import { LeaveCoOwnership } from "@/dog/application/use-cases/leave-co-ownership.use-case"
import { RemoveDog } from "@/dog/application/use-cases/remove-dog.use-case"
import { RemoveDogPhoto } from "@/dog/application/use-cases/remove-dog-photo.use-case"
import { UpdateDog } from "@/dog/application/use-cases/update-dog.use-case"
import { UpdateDogPhoto } from "@/dog/application/use-cases/update-dog-photo.use-case"
import { SupabaseDogCoOwnerRepository } from "@/dog/infrastructure/supabase/dog-co-owner.repository"
import { SupabaseDogPhotoStorageRepository } from "@/dog/infrastructure/supabase/dog-photo-storage.repository"
import { SupabaseDogRepository } from "@/dog/infrastructure/supabase/dog.repository"
import { CreateWalk } from "@/walk/application/use-cases/create-walk.use-case"
import { RemoveWalk } from "@/walk/application/use-cases/remove-walk.use-case"
import { RespondToWalkInvite } from "@/walk/application/use-cases/respond-to-walk-invite.use-case"
import { ToggleDogForWalk } from "@/walk/application/use-cases/toggle-dog-for-walk.use-case"
import { UpdateWalk } from "@/walk/application/use-cases/update-walk.use-case"
import { SupabaseWalkRepository } from "@/walk/infrastructure/supabase/walk.repository"
import { supabase } from "@/shared/supabase/client"

const profileRepository = new SupabaseProfileRepository(supabase)
const authRepository = new SupabaseAuthRepository(supabase)
const storageRepository = new SupabaseStorageRepository(supabase)
const accountDeletionRepository = new SupabaseAccountDeletionRepository(supabase)
const friendRepository = new SupabaseFriendRepository(supabase)
const dogRepository = new SupabaseDogRepository(supabase)
const dogPhotoStorageRepository = new SupabaseDogPhotoStorageRepository(supabase)
const dogCoOwnerRepository = new SupabaseDogCoOwnerRepository(supabase)
const walkRepository = new SupabaseWalkRepository(supabase)

export const container = {
  account: {
    // Reads bypass the use-case layer (no business rule to enforce on a plain fetch) —
    // mutations below all go through their use-case for validation/orchestration.
    profiles: profileRepository,
    requestMagicLink: new RequestMagicLink(authRepository),
    signOut: new SignOut(authRepository),
    createProfile: new CreateProfile(profileRepository),
    updateUsername: new UpdateUsername(profileRepository),
    updateAvatar: new UpdateAvatar(profileRepository, storageRepository),
    removeAvatar: new RemoveAvatar(profileRepository, storageRepository),
    deleteAccount: new DeleteAccount(accountDeletionRepository, authRepository),
  },
  friend: {
    friends: friendRepository,
    lookupInviteCode: new LookupInviteCode(friendRepository),
    redeemInviteCode: new RedeemInviteCode(friendRepository),
    acceptFriendRequest: new AcceptFriendRequest(friendRepository),
    declineFriendRequest: new DeclineFriendRequest(friendRepository),
    cancelFriendRequest: new CancelFriendRequest(friendRepository),
    removeFriend: new RemoveFriend(friendRepository),
    regenerateInviteCode: new RegenerateInviteCode(friendRepository),
  },
  dog: {
    dogs: dogRepository,
    coOwners: dogCoOwnerRepository,
    createDog: new CreateDog(dogRepository),
    updateDog: new UpdateDog(dogRepository),
    removeDog: new RemoveDog(dogRepository, dogPhotoStorageRepository),
    updateDogPhoto: new UpdateDogPhoto(dogRepository, dogPhotoStorageRepository),
    removeDogPhoto: new RemoveDogPhoto(dogRepository, dogPhotoStorageRepository),
    inviteCoOwner: new InviteCoOwner(dogCoOwnerRepository),
    acceptCoOwnerInvite: new AcceptCoOwnerInvite(dogCoOwnerRepository),
    declineCoOwnerInvite: new DeclineCoOwnerInvite(dogCoOwnerRepository),
    cancelCoOwnerInvite: new CancelCoOwnerInvite(dogCoOwnerRepository),
    leaveCoOwnership: new LeaveCoOwnership(dogCoOwnerRepository),
  },
  walk: {
    walks: walkRepository,
    createWalk: new CreateWalk(walkRepository),
    updateWalk: new UpdateWalk(walkRepository),
    removeWalk: new RemoveWalk(walkRepository),
    respondToWalkInvite: new RespondToWalkInvite(walkRepository),
    toggleDogForWalk: new ToggleDogForWalk(walkRepository),
  },
}
