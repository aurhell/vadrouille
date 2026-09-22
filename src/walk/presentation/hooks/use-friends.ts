import { useQuery } from "@tanstack/react-query"

import { container } from "@/shared/di/container"

/** `walk` needs a friend's `domain`/`application` to invite them to a walk, never `friend`'s
 * `presentation` — this local hook (rather than importing `friend/presentation/hooks/use-friends`)
 * keeps that boundary, at the cost of a thin duplicate of the query wrapper itself. */
export function useFriends(userId: string | undefined) {
  return useQuery({
    queryKey: ["friends", userId ?? ""] as const,
    queryFn: () => container.friend.friends.list(),
    enabled: !!userId,
  })
}
