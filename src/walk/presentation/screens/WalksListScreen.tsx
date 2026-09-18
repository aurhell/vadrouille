import { useRouter } from "expo-router"
import { useRef } from "react"
import { Alert, FlatList } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { XStack, YStack } from "tamagui"

import { useSession } from "@/account/presentation/providers/session-provider"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { Body, EmptyState, RefreshControl, ScreenHeader, WalkCard } from "@/shared/ui"
import type { Walk as DesignSystemWalk } from "@/shared/ui/types"
import type { Walk } from "../../domain/entities/walk"
import { useRemoveWalk } from "../hooks/use-walk-mutations"
import { useWalks } from "../hooks/use-walks"
import { toDisplayWalk } from "../to-display-walk"

const REMOVE_ACTION_WIDTH = 88

function WalkRow({
  walk,
  isOrganizer,
  onPress,
  onRemove,
}: {
  walk: Walk
  isOrganizer: boolean
  onPress: (walk: DesignSystemWalk) => void
  onRemove: (walk: Walk) => void
}) {
  const swipeableRef = useRef<Swipeable>(null)

  // Only the organizer can cancel — see walk.docs.md "Un participant non-organisateur tente
  // d'annuler" — so a plain participant's row has no swipe affordance at all.
  if (!isOrganizer) {
    return <WalkCard walk={toDisplayWalk(walk)} onPress={onPress} />
  }

  function handlePress() {
    swipeableRef.current?.close()
    Alert.alert("Annuler cette balade ?", "Cette action est définitive, pour tous les participants.", [
      { text: "Annuler", style: "cancel" },
      { text: "Confirmer", style: "destructive", onPress: () => onRemove(walk) },
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
            Annuler
          </Body>
        </XStack>
      )}
    >
      <WalkCard walk={toDisplayWalk(walk)} onPress={onPress} flat />
    </Swipeable>
  )
}

export function WalksListScreen() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const walksQuery = useWalks(userId)
  const { data: walks } = walksQuery
  const { refreshing, onRefresh } = usePullToRefresh(() => walksQuery.refetch())
  const removeWalk = useRemoveWalk(userId)

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        title="Balades"
        rightSlot={
          <Body fontWeight="800" tone="accent" onPress={() => router.push("/walks/new")} minHeight="$tap" paddingVertical="$2" hitSlop={12}>
            ＋ Créer
          </Body>
        }
      />

      {/* Above the list, not a FlatList footer: stays reachable even on the empty state,
       * which otherwise fills the whole flex:1 area and pushes a footer off-screen. */}
      <Body
        size="sm"
        tone="subtle"
        textAlign="right"
        fontWeight="700"
        paddingHorizontal="$5"
        paddingBottom="$2"
        minHeight="$tap"
        hitSlop={12}
        onPress={() => router.push("/walks/past")}
      >
        Voir mes balades passées ›
      </Body>

      <FlatList
        contentContainerStyle={walks && walks.length > 0 ? { padding: 20, gap: 12, paddingTop: 0 } : { flexGrow: 1 }}
        data={walks ?? []}
        keyExtractor={(walk) => walk.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <WalkRow
            walk={item}
            isOrganizer={item.organizerId === userId}
            onPress={(walk) => router.push(`/walks/${walk.id}`)}
            onRemove={(walk) => removeWalk.mutate(walk.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🦮"
            title="Aucune balade à venir"
            body="Lance la première ! Propose un lieu et une heure, tes amis reçoivent l'invitation aussitôt."
            actionLabel="Créer une balade"
            onAction={() => router.push("/walks/new")}
          />
        }
      />
    </YStack>
  )
}
