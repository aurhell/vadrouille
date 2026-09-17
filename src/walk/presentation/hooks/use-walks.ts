import { useQuery } from "@tanstack/react-query"

import { container } from "@/shared/di/container"

export const walksQueryKey = (userId: string) => ["walks", userId] as const
export const walkQueryKey = (walkId: string) => ["walk", walkId] as const

export function useWalks(userId: string | undefined) {
  return useQuery({
    queryKey: walksQueryKey(userId ?? ""),
    queryFn: () => container.walk.walks.list(),
    enabled: !!userId,
  })
}

export function useWalk(walkId: string | undefined) {
  return useQuery({
    queryKey: walkQueryKey(walkId ?? ""),
    queryFn: () => container.walk.walks.findById(walkId as string),
    enabled: !!walkId,
  })
}
