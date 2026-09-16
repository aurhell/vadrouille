import { useQuery } from "@tanstack/react-query"

import { container } from "@/shared/di/container"

export const friendsQueryKey = (userId: string) => ["friends", userId] as const
export const sentRequestsQueryKey = (userId: string) => ["friend-requests", "sent", userId] as const
export const receivedRequestsQueryKey = (userId: string) => ["friend-requests", "received", userId] as const

export function useFriends(userId: string | undefined) {
  return useQuery({
    queryKey: friendsQueryKey(userId ?? ""),
    queryFn: () => container.friend.friends.list(),
    enabled: !!userId,
  })
}

export function useSentFriendRequests(userId: string | undefined) {
  return useQuery({
    queryKey: sentRequestsQueryKey(userId ?? ""),
    queryFn: () => container.friend.friends.listSentRequests(userId as string),
    enabled: !!userId,
  })
}

export function useReceivedFriendRequests(userId: string | undefined) {
  return useQuery({
    queryKey: receivedRequestsQueryKey(userId ?? ""),
    queryFn: () => container.friend.friends.listReceivedRequests(userId as string),
    enabled: !!userId,
  })
}
