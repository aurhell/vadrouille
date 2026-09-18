import { useRouter } from "expo-router"
import { Alert, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { XStack, YStack } from "tamagui"

import { useSession } from "@/account/presentation/providers/session-provider"
import { useDogs } from "@/dog/presentation/hooks/use-dogs"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { Avatar, Body, Card, DogPhoto, RefreshControl, RsvpSheet, ScreenHeader, StatusBadge, Title } from "@/shared/ui"
import { formatDuration, formatWalkDate, formatWalkTime } from "@/shared/ui/mocks"
import type { RsvpStatus } from "@/shared/ui/types"
import { canRespondToWalk } from "../../domain/policies/response-window.policy"
import { dogQuotaMessage } from "../../domain/policies/walk-dog-quota.policy"
import type { WalkRsvpStatus } from "../../domain/entities/walk"
import { useRemoveWalk, useRespondToWalk, useToggleDogForWalk } from "../hooks/use-walk-mutations"
import { useWalk } from "../hooks/use-walks"

const RSVP_STATUS: Record<WalkRsvpStatus, RsvpStatus> = {
  yes: "confirmed",
  no: "declined",
  maybe: "maybe",
  pending: "pending",
}

const RSVP_STATUS_REVERSE: Record<Exclude<RsvpStatus, "pending">, WalkRsvpStatus> = {
  confirmed: "yes",
  maybe: "maybe",
  declined: "no",
}

const QUOTA_EXCEEDED_MESSAGE = "Cette balade est complète (10/10 chiens)"
const MAX_DOGS_SHOWN = 3

export function WalkDetailScreen({ walkId }: { walkId: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const userId = session?.user.id
  const walkQuery = useWalk(walkId)
  const { data: walk } = walkQuery
  const dogsQuery = useDogs(userId)
  const { data: myDogs } = dogsQuery
  const { refreshing, onRefresh } = usePullToRefresh(() => Promise.all([walkQuery.refetch(), dogsQuery.refetch()]))
  const removeWalk = useRemoveWalk(userId)
  const respondToWalk = useRespondToWalk(userId, walkId)
  const toggleDog = useToggleDogForWalk(userId, walkId)

  if (!walk) return null

  const isOrganizer = walk.organizerId === userId
  const responseWindowOpen = canRespondToWalk(walk)
  const confirmedDogIds = new Set(walk.dogs.map((dog) => dog.id))
  const shownDogs = walk.dogs.slice(0, MAX_DOGS_SHOWN)
  const extraDogsCount = walk.dogs.length - shownDogs.length

  function handleCancel() {
    Alert.alert("Annuler cette balade ?", "Cette action est définitive, pour tous les participants.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Confirmer",
        style: "destructive",
        onPress: async () => {
          await removeWalk.mutateAsync(walkId)
          router.back()
        },
      },
    ])
  }

  async function handleToggleDog(dogId: string) {
    try {
      const result = await toggleDog.mutateAsync({
        walkId,
        dogId,
        isConfirmed: confirmedDogIds.has(dogId),
        confirmedDogsCount: walk!.dogs.length,
      })
      if (!result.success) Alert.alert(QUOTA_EXCEEDED_MESSAGE)
    } catch {
      // E.g. a race with someone else confirming the 10th dog between our own client-side
      // quota check and the request landing — the SQL trigger still refuses it server-side.
      Alert.alert("Un problème est survenu. Réessaie dans quelques instants.")
    }
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        tone="accent"
        title={walk.locationText}
        subtitle={`${formatWalkDate(walk.startTime)} · ${formatWalkTime(walk.startTime)} · ${formatDuration(walk.durationMinutes)}`}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <YStack flex={1} padding="$5" gap="$4">
          {walk.dogs.length > 0 ? (
            <Card gap="$4">
              <Title size="md">Chiens confirmés</Title>
              <XStack gap="$4" flexWrap="wrap">
                {shownDogs.map((dog) => (
                  <DogPhoto
                    key={dog.id}
                    dog={{ id: dog.id, name: dog.name, breed: "", ageYears: 0, photoUrl: dog.photoUrl ?? undefined }}
                    size="md"
                    showName
                  />
                ))}
                {extraDogsCount > 0 ? (
                  <YStack alignItems="center" gap="$2">
                    <YStack
                      width="$dogMd"
                      height="$dogMd"
                      borderRadius="$round"
                      backgroundColor="$accentSoft"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Body fontWeight="800" color="$accentSoftText">
                        +{extraDogsCount}
                      </Body>
                    </YStack>
                    <Body size="xs" fontWeight="700" tone="subtle">
                      autres
                    </Body>
                  </YStack>
                ) : null}
              </XStack>
            </Card>
          ) : null}

          {myDogs && myDogs.length > 0 ? (
            // Not gated on myStatus === "yes": a co-owner can retirer a dog a fellow co-owner
            // already confirmed regardless of their own RSVP (walk.docs.md "Chien déjà
            // confirmé par un co-owner") — RLS itself only checks ownership + response window.
            <Card gap="$3">
              <XStack alignItems="center" justifyContent="space-between">
                <Title size="md">Mes chiens</Title>
                {dogQuotaMessage(walk.dogs.length) ? (
                  <Body size="sm" fontWeight="800" tone="accent">
                    {dogQuotaMessage(walk.dogs.length)}
                  </Body>
                ) : null}
              </XStack>
              {myDogs.map((dog) => {
                const confirmed = confirmedDogIds.has(dog.id)
                return (
                  <XStack
                    key={dog.id}
                    alignItems="center"
                    gap="$3"
                    minHeight="$tap"
                    opacity={responseWindowOpen ? 1 : 0.5}
                    onPress={responseWindowOpen ? () => handleToggleDog(dog.id) : undefined}
                  >
                    <DogPhoto dog={{ id: dog.id, name: dog.name, breed: dog.breed ?? "", ageYears: 0, photoUrl: dog.photoUrl ?? undefined }} size="sm" />
                    <Body flex={1} fontWeight="700">
                      {dog.name}
                    </Body>
                    {confirmed ? (
                      <Body fontWeight="800" tone="accent">
                        ✓
                      </Body>
                    ) : null}
                  </XStack>
                )
              })}
            </Card>
          ) : null}

          <Card gap="$3">
            <Title size="md">Participants</Title>
            {walk.participants.map((participant) => (
              <XStack key={participant.id} alignItems="center" gap="$3" minHeight="$tap">
                <Avatar friend={{ id: participant.id, username: participant.username, avatarUrl: participant.avatarUrl ?? undefined }} size="sm" />
                <Body flex={1} fontWeight="700">
                  {participant.username}
                </Body>
                <StatusBadge status={RSVP_STATUS[participant.status]} />
              </XStack>
            ))}
          </Card>

          {isOrganizer ? (
            <Body
              size="sm"
              tone="subtle"
              textAlign="center"
              fontWeight="700"
              minHeight="$tap"
              paddingVertical="$2"
              hitSlop={12}
              onPress={handleCancel}
            >
              Annuler cette balade
            </Body>
          ) : null}
        </YStack>
      </ScrollView>

      {responseWindowOpen ? (
        <RsvpSheet
          value={RSVP_STATUS[walk.myStatus]}
          // RsvpSheet's own options never include "pending" — only its declared prop type does.
          onChange={(status) =>
            respondToWalk.mutate({
              status: RSVP_STATUS_REVERSE[status as Exclude<RsvpStatus, "pending">],
              myDogIds: (myDogs ?? []).map((dog) => dog.id),
            })
          }
        />
      ) : (
        <Body
          size="sm"
          tone="subtle"
          textAlign="center"
          fontWeight="700"
          paddingTop="$4"
          paddingBottom={Math.max(insets.bottom, 12) + 12}
        >
          Cette balade n'accepte plus de réponses
        </Body>
      )}
    </YStack>
  )
}
