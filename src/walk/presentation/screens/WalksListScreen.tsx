import { useRouter } from "expo-router"
import { FlatList } from "react-native"
import { YStack } from "tamagui"

import { useSession } from "@/account/presentation/providers/session-provider"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { Body, EmptyState, RefreshControl, ScreenHeader, SwipeToDeleteRow, WalkCard } from "@/shared/ui"
import type { Walk as DesignSystemWalk } from "@/shared/ui/types"
import type { Walk } from "../../domain/entities/walk"
import { useRemoveWalk } from "../hooks/use-walk-mutations"
import { useWalks } from "../hooks/use-walks"
import { toDisplayWalk } from "../to-display-walk"

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
  // Only the organizer can cancel — see walk.docs.md "Un participant non-organisateur tente
  // d'annuler" — so a plain participant's row has no swipe affordance at all.
  if (!isOrganizer) {
    return <WalkCard walk={toDisplayWalk(walk)} onPress={onPress} />
  }

  return (
    <SwipeToDeleteRow
      actionLabel="Annuler"
      confirmTitle="Annuler cette balade ?"
      confirmMessage="Cette action est définitive, pour tous les participants."
      confirmActionLabel="Confirmer"
      onConfirm={() => onRemove(walk)}
    >
      <WalkCard walk={toDisplayWalk(walk)} onPress={onPress} flat />
    </SwipeToDeleteRow>
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
