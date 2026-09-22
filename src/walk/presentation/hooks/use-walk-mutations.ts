import { useMutation, useQueryClient } from "@tanstack/react-query"

import { container } from "@/shared/di/container"

import { walkQueryKey, walksQueryKey } from "./use-walks"

import type { ToggleDogForWalkInput } from "../../application/use-cases/toggle-dog-for-walk.use-case"
import type { Walk, WalkDog, WalkRsvpStatus } from "../../domain/entities/walk"
import type { UpdateWalkInput, WalkInput } from "../../domain/repositories/walk.repository"

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

export function useUpdateWalk(userId: string | undefined, walkId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateWalkInput) => container.walk.updateWalk.execute(walkId, input),
    onSuccess: (result) => {
      if (!result.success) return
      // The response already carries the reset walk (every non-pending RSVP back to
      // "pending", confirmed dogs left as-is — see modele-de-donnees.md "Modification d'une
      // balade déjà envoyée") — spliced straight into the cache instead of waiting on a round
      // trip, same reasoning as useCreateWalk.
      queryClient.setQueryData(walkQueryKey(walkId), result.walk)
      queryClient.invalidateQueries({ queryKey: walkQueryKey(walkId) })
      if (userId) queryClient.invalidateQueries({ queryKey: walksQueryKey(userId) })
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
    // Optimistic: the RsvpSheet's dog picker (see WalkDetailScreen) expands/collapses off
    // `walk.myStatus` — waiting for the round trip before that reacts would make the "slide"
    // feel laggy instead of an immediate response to the tap.
    onMutate: async(input) => {
      await queryClient.cancelQueries({ queryKey: walkQueryKey(walkId) })
      const previous = queryClient.getQueryData<Walk | null>(walkQueryKey(walkId))
      queryClient.setQueryData(walkQueryKey(walkId), (walk: Walk | null | undefined) =>
        walk
          ? {
              ...walk,
              myStatus: input.status,
              participants: walk.participants.map((p) => (p.id === userId ? { ...p, status: input.status } : p)),
            }
          : walk,
      )
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context && context.previous !== undefined) queryClient.setQueryData(walkQueryKey(walkId), context.previous)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walkQueryKey(walkId) })
      if (userId) queryClient.invalidateQueries({ queryKey: walksQueryKey(userId) })
    },
  })
}

/** Extra display fields beyond what the use-case itself needs, carried through to `onMutate`
 * so it can optimistically splice a full WalkDog into the cache — the mutation has no other
 * access to "my dogs" data (that's a separate hook/query in the screen). */
export type ToggleDogForWalkMutationInput = {
  dogName: string
  dogPhotoUrl: string | null
} & ToggleDogForWalkInput

export function useToggleDogForWalk(userId: string | undefined, walkId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ToggleDogForWalkMutationInput) => container.walk.toggleDogForWalk.execute(input),
    // Optimistic: "Chiens confirmés" (see WalkDetailScreen) should reflect a toggle the
    // instant it's tapped in the bottom sheet, not after a round trip.
    onMutate: async(input) => {
      await queryClient.cancelQueries({ queryKey: walkQueryKey(walkId) })
      const previous = queryClient.getQueryData<Walk | null>(walkQueryKey(walkId))
      queryClient.setQueryData(walkQueryKey(walkId), (walk: Walk | null | undefined) => {
        if (!walk) return walk
        if (input.isConfirmed) {
          return { ...walk, dogs: walk.dogs.filter((dog) => dog.id !== input.dogId) }
        }
        const newDog: WalkDog = { id: input.dogId, name: input.dogName, photoUrl: input.dogPhotoUrl, status: "yes", updatedBy: userId ?? null }
        return { ...walk, dogs: [...walk.dogs, newDog] }
      })
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context && context.previous !== undefined) queryClient.setQueryData(walkQueryKey(walkId), context.previous)
    },
    onSuccess: (result) => {
      if (!result.success) return
      queryClient.invalidateQueries({ queryKey: walkQueryKey(walkId) })
      if (userId) queryClient.invalidateQueries({ queryKey: walksQueryKey(userId) })
    },
  })
}
