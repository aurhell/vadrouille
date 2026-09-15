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
import { supabase } from "@/shared/supabase/client"

const profileRepository = new SupabaseProfileRepository(supabase)
const authRepository = new SupabaseAuthRepository(supabase)
const storageRepository = new SupabaseStorageRepository(supabase)
const accountDeletionRepository = new SupabaseAccountDeletionRepository(supabase)

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
}
