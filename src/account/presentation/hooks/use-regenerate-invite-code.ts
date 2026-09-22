import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Profile } from "@/account/domain/entities/profile"
import { container } from "@/shared/di/container"
import { profileQueryKey } from "./use-profile"

/** `account` needs `friend`'s `domain`/`application` to regenerate the invite code carried on
 * the profile, never `friend`'s `presentation` — this local hook (rather than importing
 * `friend/presentation/hooks/use-friend-mutations`) keeps that boundary, at the cost of a thin
 * duplicate of the mutation wrapper itself. */
export function useRegenerateInviteCode(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => container.friend.regenerateInviteCode.execute(),
    onSuccess: (newCode) => {
      if (!userId) return
      queryClient.setQueryData<Profile | null>(profileQueryKey(userId), (profile) =>
        profile ? { ...profile, inviteCode: newCode } : profile,
      )
    },
  })
}
