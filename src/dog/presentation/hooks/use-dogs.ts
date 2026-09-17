import { useQuery } from "@tanstack/react-query"

import { container } from "@/shared/di/container"

export const dogsQueryKey = (userId: string) => ["dogs", userId] as const
export const dogQueryKey = (dogId: string) => ["dog", dogId] as const

export function useDogs(userId: string | undefined) {
  return useQuery({
    queryKey: dogsQueryKey(userId ?? ""),
    queryFn: () => container.dog.dogs.list(),
    enabled: !!userId,
  })
}

export function useDog(dogId: string | undefined) {
  return useQuery({
    queryKey: dogQueryKey(dogId ?? ""),
    queryFn: () => container.dog.dogs.findById(dogId as string),
    enabled: !!dogId,
  })
}
