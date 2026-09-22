import { useMutation, useQueryClient } from "@tanstack/react-query"

import { container } from "@/shared/di/container"
import type { DogInput } from "@/dog/domain/repositories/dog.repository"

/** `account` needs `dog`'s `domain`/`application` to create a first dog during onboarding,
 * never `dog`'s `presentation` — this local hook (rather than importing
 * `dog/presentation/hooks/use-dog-mutations`) keeps that boundary, at the cost of a thin
 * duplicate of the mutation wrapper itself. */
export function useCreateDog(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DogInput) => container.dog.createDog.execute(input),
    onSuccess: (result) => {
      if (result.success && userId) queryClient.invalidateQueries({ queryKey: ["dogs", userId] })
    },
  })
}
