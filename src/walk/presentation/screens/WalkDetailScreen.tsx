import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Alert, LayoutAnimation, Modal, Platform, Pressable, ScrollView, UIManager } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { XStack, YStack } from "tamagui"

import type { Dog } from "@/dog/domain/entities/dog"
import { useSession } from "@/account/presentation/providers/session-provider"
import { useDogs } from "@/dog/presentation/hooks/use-dogs"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { Avatar, Body, Button, Card, DogPhoto, Label, RefreshControl, RsvpSheet, ScreenHeader, StatusBadge, Title, WalkMetaLine } from "@/shared/ui"
import type { RsvpStatus } from "@/shared/ui/types"
import { canRespondToWalk } from "../../domain/policies/response-window.policy"
import { dogQuotaMessage } from "../../domain/policies/walk-dog-quota.policy"
import type { WalkRsvpStatus } from "../../domain/entities/walk"
import { useRemoveWalk, useRespondToWalk, useToggleDogForWalk } from "../hooks/use-walk-mutations"
import { useWalk } from "../hooks/use-walks"
import { pairParticipantsWithDogs } from "../pair-participants-with-dogs"

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

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

type SheetView = "buttons" | "dogs" | "collapsed"

function animateNext() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
}

function DogPill({ dog, selected, onPress }: { dog: Dog; selected: boolean; onPress: () => void }) {
  const shared = dog.coOwners.length > 0
  return (
    <YStack alignItems="center" gap="$2" onPress={onPress}>
      <DogPhoto
        dog={{ id: dog.id, name: dog.name, breed: dog.breed ?? "", ageYears: 0, photoUrl: dog.photoUrl ?? undefined }}
        size="md"
        checked={selected}
        opacity={selected ? 1 : 0.45}
        dashed={shared}
      />
      <Body size="xs" fontWeight="700" color={selected ? "$color" : "$colorFaint"} numberOfLines={1} textAlign="center" width={64}>
        {dog.name}
      </Body>
    </YStack>
  )
}

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

  const [view, setView] = useState<SheetView>("buttons")
  const [menuOpen, setMenuOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const viewInitialized = useRef(false)

  useEffect(() => {
    if (!viewInitialized.current && walk) {
      setView(walk.myStatus === "pending" ? "buttons" : "collapsed")
      viewInitialized.current = true
    }
  }, [walk])

  if (!walk) return null

  const isOrganizer = walk.organizerId === userId
  const responseWindowOpen = canRespondToWalk(walk)
  const confirmedDogIds = new Set(walk.dogs.map((dog) => dog.id))
  const shownDogs = walk.dogs.slice(0, MAX_DOGS_SHOWN)
  const extraDogsCount = walk.dogs.length - shownDogs.length
  const { participants: participantsWithDogs } = pairParticipantsWithDogs(walk)
  // Mine first — see walk.docs.md "Ma propre ligne en tête des participants".
  const orderedParticipants = [...participantsWithDogs].sort((a, b) => (a.id === userId ? -1 : b.id === userId ? 1 : 0))
  const yesResponders = walk.participants.filter((p) => p.status === "yes" && p.id !== userId).map((p) => p.username)

  async function handleToggleDog(dog: Dog) {
    try {
      const result = await toggleDog.mutateAsync({
        walkId,
        dogId: dog.id,
        isConfirmed: confirmedDogIds.has(dog.id),
        confirmedDogsCount: walk!.dogs.length,
        dogName: dog.name,
        dogPhotoUrl: dog.photoUrl,
      })
      if (!result.success) Alert.alert(QUOTA_EXCEEDED_MESSAGE)
    } catch {
      // E.g. a race with someone else confirming the 10th dog between our own client-side
      // quota check and the request landing — the SQL trigger still refuses it server-side.
      Alert.alert("Un problème est survenu. Réessaie dans quelques instants.")
    }
  }

  function handleRespond(status: RsvpStatus) {
    animateNext()
    const walkStatus = RSVP_STATUS_REVERSE[status as Exclude<RsvpStatus, "pending">]
    const wasYes = walk!.myStatus === "yes"
    respondToWalk.mutate({ status: walkStatus, myDogIds: (myDogs ?? []).map((dog) => dog.id) })

    if (walkStatus === "yes") {
      setView("dogs")
      // Only one possible dog to bring: confirm it straight away instead of making the
      // person pick from a list of one — see walk.docs.md "Sélection automatique".
      if (!wasYes && myDogs && myDogs.length === 1 && !confirmedDogIds.has(myDogs[0].id)) {
        handleToggleDog(myDogs[0])
      }
    } else {
      setView("collapsed")
    }
  }

  function handleCancelWalk() {
    setCancelModalOpen(false)
    removeWalk.mutate(walkId, { onSuccess: () => router.back() })
  }

  const myConfirmedDogs = myDogs?.filter((dog) => confirmedDogIds.has(dog.id)) ?? []
  const collapsedDogsSuffix = walk.myStatus === "yes" && myConfirmedDogs.length > 0 ? `Avec ${myConfirmedDogs.map((dog) => dog.name).join(", ")}` : undefined

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        tone="accent"
        title={walk.locationText}
        subtitle={<WalkMetaLine startTime={walk.startTime} durationMinutes={walk.durationMinutes} tone="accent" />}
        onBack={() => router.back()}
        rightSlot={
          isOrganizer ? (
            <YStack
              width="$tap"
              height="$tap"
              borderRadius="$round"
              backgroundColor="rgba(255,255,255,0.25)"
              alignItems="center"
              justifyContent="center"
              hitSlop={12}
              onPress={() => setMenuOpen(true)}
            >
              <Body fontSize={20} fontWeight="800" color="$accentText">
                •••
              </Body>
            </YStack>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <YStack flex={1} padding="$5" gap="$4">
          {walk.dogs.length > 0 ? (
            <Card gap="$4">
              <Title size="md">Chiens confirmés</Title>
              <XStack gap="$4" flexWrap="wrap">
                {shownDogs.map((dog) => (
                  <YStack key={dog.id} alignItems="center" gap="$1">
                    <DogPhoto
                      dog={{ id: dog.id, name: dog.name, breed: "", ageYears: 0, photoUrl: dog.photoUrl ?? undefined }}
                      size="md"
                      dashed={(myDogs?.find((myDog) => myDog.id === dog.id)?.coOwners.length ?? 0) > 0}
                    />
                    <Body size="xs" fontWeight="700" numberOfLines={1}>
                      {dog.name}
                    </Body>
                  </YStack>
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

          <Card gap="$3">
            <Title size="md">Participants</Title>
            {orderedParticipants.map((participant) => (
              <XStack key={participant.id} alignItems="center" gap="$3" minHeight="$tap">
                <Avatar friend={{ id: participant.id, username: participant.username, avatarUrl: participant.avatarUrl ?? undefined }} size="sm" />
                <Body flex={1} fontWeight="700">
                  {participant.id === userId ? "toi" : participant.username}
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

      {responseWindowOpen ? (
        <RsvpSheet value={RSVP_STATUS[walk.myStatus]} onChange={handleRespond} hideButtons={view !== "buttons"}>
          {view === "dogs" ? (
            <YStack gap="$3">
              <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$2">
                <Label>Qui t'accompagne ?</Label>
                <YStack alignItems="flex-end">
                  <Body size="sm" fontWeight="800" tone="accent" numberOfLines={1}>
                    {myConfirmedDogs.length > 0 ? myConfirmedDogs.map((dog) => dog.name).join(", ") : "Tu viens seul"}
                  </Body>
                  {dogQuotaMessage(walk.dogs.length) ? (
                    <Body size="xs" fontWeight="700" tone="accent">
                      {dogQuotaMessage(walk.dogs.length)}
                    </Body>
                  ) : null}
                </YStack>
              </XStack>
              {myDogs && myDogs.length > 0 ? (
                <XStack gap="$4" flexWrap="wrap">
                  {myDogs.map((dog) => (
                    <DogPill key={dog.id} dog={dog} selected={confirmedDogIds.has(dog.id)} onPress={() => handleToggleDog(dog)} />
                  ))}
                </XStack>
              ) : (
                <Body size="sm" tone="accent" fontWeight="700" minHeight="$tap" hitSlop={12} onPress={() => router.push("/dogs/new")}>
                  ＋ Ajouter un chien
                </Body>
              )}
              <XStack gap="$3">
                <Button
                  variant="secondary"
                  flex={1}
                  onPress={() => {
                    animateNext()
                    setView("buttons")
                  }}
                >
                  Modifier
                </Button>
                <Button
                  flex={1}
                  onPress={() => {
                    animateNext()
                    setView("collapsed")
                  }}
                >
                  Valider
                </Button>
              </XStack>
            </YStack>
          ) : view === "collapsed" ? (
            <XStack alignItems="center" justifyContent="space-between" gap="$3" paddingHorizontal="$2">
              <XStack alignItems="center" gap="$3" flex={1}>
                <StatusBadge status={RSVP_STATUS[walk.myStatus]} />
                {collapsedDogsSuffix ? (
                  <Body fontWeight="700" numberOfLines={1} flex={1}>
                    {collapsedDogsSuffix}
                  </Body>
                ) : null}
              </XStack>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  animateNext()
                  setView(walk.myStatus === "yes" ? "dogs" : "buttons")
                }}
              >
                {walk.myStatus === "yes" ? "Modifier" : "Changer"}
              </Button>
            </XStack>
          ) : null}
        </RsvpSheet>
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

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.32)" }}
          onPress={() => setMenuOpen(false)}
        >
          <YStack
            position="absolute"
            top={insets.top + 56}
            right={16}
            backgroundColor="$backgroundStrong"
            borderRadius="$4"
            padding="$2"
            minWidth={220}
            shadowColor="$shadowColor"
            shadowOpacity={0.2}
            shadowRadius={16}
            shadowOffset={{ width: 0, height: 6 }}
          >
            <XStack
              alignItems="center"
              minHeight="$tap"
              paddingHorizontal="$3"
              onPress={() => {
                setMenuOpen(false)
                router.push(`/walks/${walkId}/edit`)
              }}
            >
              <Body fontWeight="700">Modifier</Body>
            </XStack>
            <XStack
              alignItems="center"
              minHeight="$tap"
              paddingHorizontal="$3"
              onPress={() => {
                setMenuOpen(false)
                setCancelModalOpen(true)
              }}
            >
              <Body fontWeight="700" color="$danger">
                Annuler cette balade
              </Body>
            </XStack>
          </YStack>
        </Pressable>
      </Modal>

      <Modal visible={cancelModalOpen} transparent animationType="fade" onRequestClose={() => setCancelModalOpen(false)}>
        <YStack flex={1} backgroundColor="rgba(0,0,0,0.4)" alignItems="center" justifyContent="center" padding="$6">
          <YStack backgroundColor="$backgroundStrong" borderRadius="$5" padding="$5" gap="$4" width="100%">
            <Title size="md">Annuler « {walk.locationText} » ?</Title>
            <Body size="sm" tone="subtle">
              {yesResponders.length > 0
                ? `${yesResponders.join(" et ")} avaient confirmé. Cette balade sera retirée de la liste de tout le monde.`
                : "Cette balade sera retirée de la liste de tout le monde."}
            </Body>
            <YStack gap="$2">
              <Button backgroundColor="$danger" shadowColor="$danger" onPress={handleCancelWalk}>
                Annuler la balade
              </Button>
              <Button variant="secondary" onPress={() => setCancelModalOpen(false)}>
                Garder la balade
              </Button>
            </YStack>
          </YStack>
        </YStack>
      </Modal>
    </YStack>
  )
}
