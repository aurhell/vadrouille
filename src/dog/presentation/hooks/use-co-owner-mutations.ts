import { useMutation, useQueryClient } from "@tanstack/react-query"

import { container } from "@/shared/di/container"

import { receivedCoOwnerInvitesQueryKey, sentCoOwnerInvitesQueryKey } from "./use-co-owner-invites"
import { dogQueryKey, dogsQueryKey } from "./use-dogs"

export function useInviteCoOwner(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dogId, friendId }: { dogId: string; friendId: string }) => container.dog.inviteCoOwner.execute(dogId, friendId),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: sentCoOwnerInvitesQueryKey(userId) })
    },
  })
}

export function useAcceptCoOwnerInvite(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dogId: string) => container.dog.acceptCoOwnerInvite.execute(dogId),
    onSuccess: () => {
      if (!userId) return
      queryClient.invalidateQueries({ queryKey: dogsQueryKey(userId) })
      queryClient.invalidateQueries({ queryKey: receivedCoOwnerInvitesQueryKey(userId) })
    },
  })
}

export function useDeclineCoOwnerInvite(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dogId: string) => container.dog.declineCoOwnerInvite.execute(dogId),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: receivedCoOwnerInvitesQueryKey(userId) })
    },
  })
}

export function useCancelCoOwnerInvite(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ dogId, inviteeId }: { dogId: string; inviteeId: string }) => container.dog.cancelCoOwnerInvite.execute(dogId, inviteeId),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: sentCoOwnerInvitesQueryKey(userId) })
    },
  })
}

export function useLeaveCoOwnership(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dogId: string) => container.dog.leaveCoOwnership.execute(dogId),
    onSuccess: (_result, dogId) => {
      if (userId) queryClient.invalidateQueries({ queryKey: dogsQueryKey(userId) })
      queryClient.removeQueries({ queryKey: dogQueryKey(dogId) })
    },
  })
}
