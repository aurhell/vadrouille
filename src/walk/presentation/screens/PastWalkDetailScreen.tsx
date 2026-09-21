import { useRouter } from "expo-router"
import { ScrollView } from "react-native"
import { XStack, YStack } from "tamagui"

import { useSession } from "@/account/presentation/providers/session-provider"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { Avatar, Body, Card, DogPhoto, RefreshControl, ScreenHeader, StatusBadge, Title, WalkMetaLine } from "@/shared/ui"
import type { RsvpStatus } from "@/shared/ui/types"
import type { WalkRsvpStatus } from "../../domain/entities/walk"
import { useWalk } from "../hooks/use-walks"
import { organizerDisplayName, pairParticipantsWithDogs } from "../pair-participants-with-dogs"

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
  const { data: walk } = walkQuery
  const { refreshing, onRefresh } = usePullToRefresh(() => walkQuery.refetch())

  if (!walk) return null

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
              <XStack key={participant.id} alignItems="center" gap="$3" minHeight="$tap">
                <Avatar friend={{ id: participant.id, username: participant.username, avatarUrl: participant.avatarUrl ?? undefined }} size="sm" />
                <Body flex={1} fontWeight="700">
                  {participant.username}
                  {participant.dogs.length > 0 ? (
                    <Body fontWeight="600" color="$colorSubtle">
                      {" "}
                      · {participant.dogs.length} chien{participant.dogs.length > 1 ? "s" : ""}
                    </Body>
                  ) : null}
                </Body>
                <StatusBadge status={RSVP_STATUS[participant.status]} />
              </XStack>
            ))}
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
