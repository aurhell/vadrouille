import { useMutation, useQueryClient } from "@tanstack/react-query"

import { container } from "@/shared/di/container"
import type { Walk, WalkRsvpStatus } from "../../domain/entities/walk"
import type { WalkInput } from "../../domain/repositories/walk.repository"
import type { ToggleDogForWalkInput } from "../../application/use-cases/toggle-dog-for-walk.use-case"
import { walkQueryKey, walksQueryKey } from "./use-walks"

export function useCreateWalk(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: WalkInput) => container.walk.createWalk.execute(input),
    onSuccess: (result) => {
      if (!result.success || !userId) return
      // Instant list update, not just an eventual background refetch: the create response
      // already carries the full walk (with the organizer's own "yes" row and confirmed
      // dogs), so it can be spliced straight into the cache instead of waiting on a round trip.
      queryClient.setQueryData(walksQueryKey(userId), (walks: Walk[] | undefined) =>
        [...(walks ?? []), result.walk].sort((a, b) => a.startTime.localeCompare(b.startTime)),
      )
      queryClient.invalidateQueries({ queryKey: walksQueryKey(userId) })
    },
  })
}

export function useRemoveWalk(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.walk.removeWalk.execute(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: walkQueryKey(id) })
      if (userId) {
        queryClient.setQueryData(walksQueryKey(userId), (walks: Walk[] | undefined) => walks?.filter((walk) => walk.id !== id))
      }
    },
  })
}

export function useRespondToWalk(userId: string | undefined, walkId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { status: WalkRsvpStatus; myDogIds: string[] }) =>
      container.walk.respondToWalkInvite.execute(walkId, input.status, input.myDogIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walkQueryKey(walkId) })
      if (userId) queryClient.invalidateQueries({ queryKey: walksQueryKey(userId) })
    },
  })
}

export function useToggleDogForWalk(userId: string | undefined, walkId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ToggleDogForWalkInput) => container.walk.toggleDogForWalk.execute(input),
    onSuccess: (result) => {
      if (!result.success) return
      queryClient.invalidateQueries({ queryKey: walkQueryKey(walkId) })
      if (userId) queryClient.invalidateQueries({ queryKey: walksQueryKey(userId) })
    },
  })
}
