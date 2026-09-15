import { useQuery } from "@tanstack/react-query"

import { container } from "@/shared/di/container"

export const profileQueryKey = (userId: string) => ["profile", userId] as const

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileQueryKey(userId ?? ""),
    queryFn: () => container.account.profiles.findById(userId as string),
    enabled: !!userId,
  })
}
