import { useQuery } from "@tanstack/react-query"

import { container } from "@/shared/di/container"

export const sentCoOwnerInvitesQueryKey = (userId: string) => ["dog-co-owner-invites", "sent", userId] as const
export const receivedCoOwnerInvitesQueryKey = (userId: string) => ["dog-co-owner-invites", "received", userId] as const

export function useSentCoOwnerInvites(userId: string | undefined) {
  return useQuery({
    queryKey: sentCoOwnerInvitesQueryKey(userId ?? ""),
    queryFn: () => container.dog.coOwners.listSentInvites(),
    enabled: !!userId,
  })
}

export function useReceivedCoOwnerInvites(userId: string | undefined) {
  return useQuery({
    queryKey: receivedCoOwnerInvitesQueryKey(userId ?? ""),
    queryFn: () => container.dog.coOwners.listReceivedInvites(),
    enabled: !!userId,
  })
}
