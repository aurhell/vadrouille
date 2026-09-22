import { useRouter } from "expo-router"
import { FlatList } from "react-native"
import { YStack } from "tamagui"

import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { useRefetchOnFocus } from "@/shared/hooks/use-refetch-on-focus"
import { useSession } from "@/shared/providers/session-provider"
import { Body, DogCard, EmptyState, InviteRequestCard, RefreshControl, ScreenHeader, SwipeToDeleteRow, Title } from "@/shared/ui"

import { deleteDogMessage } from "../delete-dog-message"
import { useReceivedCoOwnerInvites } from "../hooks/use-co-owner-invites"
import { useAcceptCoOwnerInvite, useDeclineCoOwnerInvite } from "../hooks/use-co-owner-mutations"
import { useRemoveDog } from "../hooks/use-dog-mutations"
import { useDogs } from "../hooks/use-dogs"

import type { Dog, DogCoOwnerInvite } from "../../domain/entities/dog"
import type { Dog as DesignSystemDog } from "@/shared/ui/types"

function ageYearsFrom(birthDate: string | null): number {
  if (!birthDate) return 0
  const diffMs = Date.now() - new Date(birthDate).getTime()
  return Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)))
}

function toDisplayDog(dog: Dog): DesignSystemDog {
  return {
    id: dog.id,
    name: dog.name,
    breed: dog.breed ?? "Race non renseignée",
    ageYears: ageYearsFrom(dog.birthDate),
    photoUrl: dog.photoUrl ?? undefined,
    sharedWith: dog.coOwners[0] ? { id: dog.coOwners[0].id, username: dog.coOwners[0].username, avatarUrl: dog.coOwners[0].avatarUrl ?? undefined } : undefined,
  }
}

function DogRow({
  dog,
  onPress,
  onRemove,
}: {
  dog: Dog
  onPress: (dog: DesignSystemDog) => void
  onRemove: (dog: Dog) => void
}) {
  // Only an owner can delete — see dog.docs.md "Un co-owner tente de supprimer un chien" —
  // so a co-owner's row is a plain card, no swipe affordance at all.
  if (dog.myRole !== "owner") {
    return <DogCard dog={toDisplayDog(dog)} onPress={onPress} />
  }

  return (
    <SwipeToDeleteRow actionLabel="Supprimer" confirmTitle={`Supprimer ${dog.name} ?`} confirmMessage={deleteDogMessage(dog)} onConfirm={() => onRemove(dog)}>
      <DogCard dog={toDisplayDog(dog)} onPress={onPress} flat />
    </SwipeToDeleteRow>
  )
}

export function MyDogsScreen() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const dogsQuery = useDogs(userId)
  const { data: dogs } = dogsQuery
  const receivedInvitesQuery = useReceivedCoOwnerInvites(userId)
  const { data: receivedInvites } = receivedInvitesQuery
  useRefetchOnFocus(() => Promise.all([dogsQuery.refetch(), receivedInvitesQuery.refetch()]))
  const { refreshing, onRefresh } = usePullToRefresh(() =>
    Promise.all([dogsQuery.refetch(), receivedInvitesQuery.refetch()]),
  )
  const removeDog = useRemoveDog(userId)
  const acceptInvite = useAcceptCoOwnerInvite(userId)
  const declineInvite = useDeclineCoOwnerInvite(userId)

  const hasNothing = (dogs?.length ?? 0) === 0 && (receivedInvites?.length ?? 0) === 0

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        title="Mes chiens"
        rightSlot={
          <Body fontWeight="800" tone="accent" onPress={() => router.push("/dogs/new")} minHeight="$tap" paddingVertical="$2" hitSlop={12}>
            ＋ Ajouter
          </Body>
        }
      />

      <FlatList
        contentContainerStyle={!hasNothing ? { padding: 20, gap: 12 } : { flexGrow: 1 }}
        data={dogs ?? []}
        keyExtractor={(dog) => dog.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <DogRow dog={item} onPress={(dog) => router.push(`/dogs/${dog.id}`)} onRemove={(dog) => removeDog.mutate(dog.id)} />
        )}
        ListHeaderComponent={
          receivedInvites && receivedInvites.length > 0 ? (
            <YStack gap="$3" paddingBottom="$4">
              <Title size="sm">Invitations reçues</Title>
              {receivedInvites.map((invite: DogCoOwnerInvite) => (
                <InviteRequestCard
                  key={invite.dogId}
                  person={{ id: invite.otherUser.id, username: invite.otherUser.username, avatarUrl: invite.otherUser.avatarUrl ?? undefined }}
                  label={`${invite.otherUser.username} te propose de co-gérer ${invite.dogName}`}
                  secondaryLabel="Refuser"
                  secondaryDisabled={declineInvite.isPending}
                  onSecondary={() => declineInvite.mutate(invite.dogId)}
                  primaryLabel="Accepter"
                  primaryDisabled={acceptInvite.isPending}
                  onPrimary={() => acceptInvite.mutate(invite.dogId)}
                />
              ))}
              {dogs && dogs.length > 0 ? <Title size="sm">Mes chiens</Title> : null}
            </YStack>
          ) : null
        }
        ListEmptyComponent={
          hasNothing ? (
            <EmptyState
              emoji="🦮"
              title="Pas encore de chien"
              body="Ajoute la fiche de ton chien pour pouvoir l'inscrire à des balades."
              actionLabel="Ajouter un chien"
              onAction={() => router.push("/dogs/new")}
            />
          ) : null
        }
      />
    </YStack>
  )
}
