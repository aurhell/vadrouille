import { useQuery } from "@tanstack/react-query"

import { container } from "@/shared/di/container"

/** `walk` needs a dog's `domain`/`application` to pick it for a walk, never `dog`'s
 * `presentation` — this local hook (rather than importing `dog/presentation/hooks/use-dogs`)
 * keeps that boundary, at the cost of a thin duplicate of the query wrapper itself. */
export function useDogs(userId: string | undefined) {
  return useQuery({
    queryKey: ["dogs", userId ?? ""] as const,
    queryFn: () => container.dog.dogs.list(),
    enabled: !!userId,
  })
}
