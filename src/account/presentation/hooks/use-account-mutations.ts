import { useMutation, useQueryClient } from "@tanstack/react-query"

import { container } from "@/shared/di/container"
import { profileQueryKey } from "./use-profile"

export function useRequestMagicLink() {
  return useMutation({
    mutationFn: (email: string) => container.account.requestMagicLink.execute({ email }),
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; username: string }) => container.account.createProfile.execute(input),
    onSuccess: (result) => {
      if (result.success) queryClient.setQueryData(profileQueryKey(result.profile.id), result.profile)
    },
  })
}

export function useUpdateUsername() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; username: string }) => container.account.updateUsername.execute(input),
    onSuccess: (result) => {
      if (result.success) queryClient.setQueryData(profileQueryKey(result.profile.id), result.profile)
    },
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; file: { uri: string; mimeType: string; sizeBytes: number } }) =>
      container.account.updateAvatar.execute(input),
    onSuccess: (result) => {
      if (result.success) queryClient.setQueryData(profileQueryKey(result.profile.id), result.profile)
    },
  })
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) => container.account.removeAvatar.execute(input),
    onSuccess: (profile) => queryClient.setQueryData(profileQueryKey(profile.id), profile),
  })
}

export function useSignOut() {
  return useMutation({
    mutationFn: () => container.account.signOut.execute(),
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => container.account.deleteAccount.execute(),
  })
}
