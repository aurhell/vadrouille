import { useMutation, useQueryClient } from "@tanstack/react-query"

import { container } from "@/shared/di/container"
import type { DogInput } from "../../domain/repositories/dog.repository"
import { dogQueryKey, dogsQueryKey } from "./use-dogs"

export function useCreateDog(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DogInput) => container.dog.createDog.execute(input),
    onSuccess: (result) => {
      if (result.success && userId) queryClient.invalidateQueries({ queryKey: dogsQueryKey(userId) })
    },
  })
}

export function useUpdateDog(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DogInput }) => container.dog.updateDog.execute(id, input),
    onSuccess: (result, variables) => {
      if (!result.success) return
      queryClient.setQueryData(dogQueryKey(variables.id), result.dog)
      if (userId) queryClient.invalidateQueries({ queryKey: dogsQueryKey(userId) })
    },
  })
}

export function useRemoveDog(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.dog.removeDog.execute(id),
    onSuccess: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: dogsQueryKey(userId) })
    },
  })
}

export function useUpdateDogPhoto(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; file: { uri: string; mimeType: string; sizeBytes: number } }) =>
      container.dog.updateDogPhoto.execute(input),
    onSuccess: (result, variables) => {
      if (!result.success) return
      queryClient.setQueryData(dogQueryKey(variables.id), result.dog)
      if (userId) queryClient.invalidateQueries({ queryKey: dogsQueryKey(userId) })
    },
  })
}

export function useRemoveDogPhoto(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.dog.removeDogPhoto.execute(id),
    onSuccess: (dog) => {
      queryClient.setQueryData(dogQueryKey(dog.id), dog)
      if (userId) queryClient.invalidateQueries({ queryKey: dogsQueryKey(userId) })
    },
  })
}
