import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Profile } from "@/account/domain/entities/profile"
import { profileQueryKey } from "@/account/presentation/hooks/use-profile"
import { container } from "@/shared/di/container"
import { friendsQueryKey, receivedRequestsQueryKey, sentRequestsQueryKey } from "./use-friends"

export function useLookupInviteCode() {
  return useMutation({
    mutationFn: (code: string) => container.friend.lookupInviteCode.execute(code),
  })
}

export function useRedeemInviteCode(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => container.friend.redeemInviteCode.execute({ code }),
    onSuccess: (result) => {
      if (!userId) return
      if (result.outcome === "created") queryClient.invalidateQueries({ queryKey: sentRequestsQueryKey(userId) })
      if (result.outcome === "auto_accepted") {
        queryClient.invalidateQueries({ queryKey: friendsQueryKey(userId) })
        queryClient.invalidateQueries({ queryKey: receivedRequestsQueryKey(userId) })
      }
    },
  })
}

export function useAcceptFriendRequest(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requesterId: string) => container.friend.acceptFriendRequest.execute(requesterId),
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: friendsQueryKey(userId) })
      queryClient.invalidateQueries({ queryKey: receivedRequestsQueryKey(userId) })
    },
  })
}

export function useDeclineFriendRequest(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requesterId: string) => container.friend.declineFriendRequest.execute(requesterId),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: receivedRequestsQueryKey(userId) })
    },
  })
}

export function useCancelFriendRequest(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (addresseeId: string) => container.friend.cancelFriendRequest.execute(addresseeId),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: sentRequestsQueryKey(userId) })
    },
  })
}

export function useRemoveFriend(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (friendId: string) => container.friend.removeFriend.execute(friendId),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: friendsQueryKey(userId) })
    },
  })
}

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
