import { useRouter } from "expo-router"
import { ScrollView } from "react-native"
import { Spinner, XStack, YStack } from "tamagui"

import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { useSession } from "@/shared/providers/session-provider"
import { Body, Card, DogPhoto, EmptyState, PersonRow, RefreshControl, ScreenHeader, StatusBadge, Title, WalkMetaLine } from "@/shared/ui"

import { useWalk } from "../hooks/use-walks"
import { organizerDisplayName, pairParticipantsWithDogs } from "../pair-participants-with-dogs"

import type { WalkRsvpStatus } from "../../domain/entities/walk"
import type { RsvpStatus } from "@/shared/ui/types"

const RSVP_STATUS: Record<WalkRsvpStatus, RsvpStatus> = {
  yes: "confirmed",
  no: "declined",
  maybe: "maybe",
  pending: "pending",
}

/** Read-only: no RsvpSheet, no dog toggling, no cancel action — see walk.docs.md "Consulter le
 * détail d'une balade passée". A separate, lighter screen rather than WalkDetailScreen in a
 * read-only mode, since none of its interactive pieces apply once a walk is over. */
export function PastWalkDetailScreen({ walkId }: { walkId: string }) {
  const router = useRouter()
  const { session } = useSession()
  const walkQuery = useWalk(walkId)
  const { data: walk, isLoading: walkLoading } = walkQuery
  const { refreshing, onRefresh } = usePullToRefresh(() => walkQuery.refetch())

  if (!walk) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <ScreenHeader title="Balade" onBack={() => router.back()} />
        {walkLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner size="large" color="$accent" />
          </YStack>
        ) : (
          <EmptyState emoji="🤷" title="Balade introuvable" body="Cette balade a peut-être été annulée, ou tu n'y as plus accès." />
        )}
      </YStack>
    )
  }

  const { participants: participantsWithDogs } = pairParticipantsWithDogs(walk)

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        tone="accent"
        title={walk.locationText}
        subtitle={<WalkMetaLine startTime={walk.startTime} durationMinutes={walk.durationMinutes} tone="accent" />}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <YStack flex={1} padding="$5" gap="$4">
          <Body size="sm" tone="subtle" fontWeight="700">
            Organisée par {organizerDisplayName(walk, session?.user.id)}
          </Body>

          {walk.dogs.length > 0 ? (
            <Card gap="$3">
              <Title size="md">Chiens qui ont participé</Title>
              <XStack gap="$4" flexWrap="wrap">
                {walk.dogs.map((dog) => (
                  <DogPhoto
                    key={dog.id}
                    dog={{ id: dog.id, name: dog.name, breed: "", ageYears: 0, photoUrl: dog.photoUrl ?? undefined }}
                    size="md"
                    showName
                  />
                ))}
              </XStack>
            </Card>
          ) : null}

          <Card gap="$3">
            <Title size="md">Participants</Title>
            {participantsWithDogs.map((participant) => (
              <PersonRow
                key={participant.id}
                person={{ id: participant.id, username: participant.username, avatarUrl: participant.avatarUrl ?? undefined }}
                suffix={
                  participant.dogs.length > 0 ? (
                    <Body fontWeight="600" color="$colorSubtle">
                      {" "}
                      · {participant.dogs.length} chien{participant.dogs.length > 1 ? "s" : ""}
                    </Body>
                  ) : undefined
                }
                trailing={<StatusBadge status={RSVP_STATUS[participant.status]} />}
              />
            ))}
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
