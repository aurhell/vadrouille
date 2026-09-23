import { useRouter } from "expo-router"
import { SectionList } from "react-native"
import { YStack } from "tamagui"

import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { useRefetchOnFocus } from "@/shared/hooks/use-refetch-on-focus"
import { useSession } from "@/shared/providers/session-provider"
import { Body, EmptyState, RefreshControl, ScreenHeader, SwipeToDeleteRow, Title, WalkCard } from "@/shared/ui"

import { groupWalksByDate } from "../group-walks-by-date"
import { useRemoveWalk } from "../hooks/use-walk-mutations"
import { useWalks } from "../hooks/use-walks"
import { toDisplayWalk } from "../to-display-walk"

import type { Walk } from "../../domain/entities/walk"
import type { Walk as DesignSystemWalk } from "@/shared/ui/types"

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
  useRefetchOnFocus(walksQuery.refetch)
  const { refreshing, onRefresh } = usePullToRefresh(() => walksQuery.refetch())
  const removeWalk = useRemoveWalk(userId)

  const sections = groupWalksByDate(walks ?? [])

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        title="Balades"
        rightSlot={
          <Body
            fontWeight="800"
            tone="accent"
            onPress={() => router.push("/walks/new")}
            minHeight="$tap"
            paddingVertical="$2"
            hitSlop={12}
            accessibilityRole="button"
          >
            ＋ Créer
          </Body>
        }
      />

      {/* Above the list, not a SectionList footer: stays reachable even on the empty state,
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
        accessibilityRole="button"
      >
        Voir mes balades passées ›
      </Body>

      <SectionList
        contentContainerStyle={sections.length > 0 ? { padding: 20, gap: 12, paddingTop: 0 } : { flexGrow: 1 }}
        sections={sections}
        keyExtractor={(walk) => walk.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Title size="sm" paddingTop="$3" paddingBottom="$2">
            {section.title}
          </Title>
        )}
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
