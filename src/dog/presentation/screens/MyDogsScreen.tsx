import { useRouter } from "expo-router"
import { useRef } from "react"
import { Alert, FlatList } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { XStack, YStack } from "tamagui"

import { useSession } from "@/account/presentation/providers/session-provider"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { Avatar, Body, Button, Card, DogCard, EmptyState, RefreshControl, ScreenHeader, Title } from "@/shared/ui"
import type { Dog as DesignSystemDog } from "@/shared/ui/types"
import type { Dog, DogCoOwnerInvite } from "../../domain/entities/dog"
import { deleteDogMessage } from "../delete-dog-message"
import { useAcceptCoOwnerInvite, useDeclineCoOwnerInvite } from "../hooks/use-co-owner-mutations"
import { useReceivedCoOwnerInvites } from "../hooks/use-co-owner-invites"
import { useRemoveDog } from "../hooks/use-dog-mutations"
import { useDogs } from "../hooks/use-dogs"

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

const REMOVE_ACTION_WIDTH = 88

function DogRow({
  dog,
  onPress,
  onRemove,
}: {
  dog: Dog
  onPress: (dog: DesignSystemDog) => void
  onRemove: (dog: Dog) => void
}) {
  const swipeableRef = useRef<Swipeable>(null)

  // Only an owner can delete — see dog.docs.md "Un co-owner tente de supprimer un chien" —
  // so a co-owner's row is a plain card, no swipe affordance at all.
  if (dog.myRole !== "owner") {
    return <DogCard dog={toDisplayDog(dog)} onPress={onPress} />
  }

  function handlePress() {
    swipeableRef.current?.close()
    Alert.alert(`Supprimer ${dog.name} ?`, deleteDogMessage(dog), [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => onRemove(dog) },
    ])
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      renderRightActions={() => (
        <XStack
          width={REMOVE_ACTION_WIDTH}
          alignItems="center"
          justifyContent="center"
          backgroundColor="$danger"
          borderRadius="$5"
          onPress={handlePress}
        >
          <Body fontWeight="800" color="$colorInverse">
            Supprimer
          </Body>
        </XStack>
      )}
    >
      <DogCard dog={toDisplayDog(dog)} onPress={onPress} flat />
    </Swipeable>
  )
}

function ReceivedInviteRow({
  invite,
  onAccept,
  onDecline,
  accepting,
  declining,
}: {
  invite: DogCoOwnerInvite
  onAccept: () => void
  onDecline: () => void
  accepting: boolean
  declining: boolean
}) {
  return (
    <Card gap="$3">
      <XStack alignItems="center" gap="$3">
        <Avatar friend={{ id: invite.otherUser.id, username: invite.otherUser.username, avatarUrl: invite.otherUser.avatarUrl ?? undefined }} size="sm" />
        <Body fontWeight="700" flex={1}>
          {invite.otherUser.username} te propose de co-gérer {invite.dogName}
        </Body>
      </XStack>
      <XStack gap="$3">
        <Button variant="secondary" size="sm" flex={1} disabled={declining} onPress={onDecline}>
          Refuser
        </Button>
        <Button size="sm" flex={1} disabled={accepting} onPress={onAccept}>
          Accepter
        </Button>
      </XStack>
    </Card>
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
        onBack={() => router.back()}
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
              {receivedInvites.map((invite) => (
                <ReceivedInviteRow
                  key={invite.dogId}
                  invite={invite}
                  accepting={acceptInvite.isPending}
                  declining={declineInvite.isPending}
                  onAccept={() => acceptInvite.mutate(invite.dogId)}
                  onDecline={() => declineInvite.mutate(invite.dogId)}
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
