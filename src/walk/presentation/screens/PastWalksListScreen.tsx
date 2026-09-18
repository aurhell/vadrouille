import { useRouter } from "expo-router"
import { useState } from "react"
import { FlatList } from "react-native"
import { YStack } from "tamagui"

import { useSession } from "@/account/presentation/providers/session-provider"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { ChoiceChipGroup, EmptyState, RefreshControl, ScreenHeader, WalkCard } from "@/shared/ui"
import { usePastWalks } from "../hooks/use-walks"
import { toDisplayWalk } from "../to-display-walk"

type Filter = "all" | "confirmed"

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "confirmed", label: "Confirmées" },
]

export function PastWalksListScreen() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const walksQuery = usePastWalks(userId)
  const { data: walks } = walksQuery
  const { refreshing, onRefresh } = usePullToRefresh(() => walksQuery.refetch())
  const [filter, setFilter] = useState<Filter>("all")

  const filteredWalks = (walks ?? []).filter((walk) => filter === "all" || walk.myStatus === "yes")

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader title="Balades passées" onBack={() => router.back()} />

      <YStack paddingHorizontal="$5" paddingBottom="$3">
        <ChoiceChipGroup options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
      </YStack>

      <FlatList
        contentContainerStyle={filteredWalks.length > 0 ? { padding: 20, paddingTop: 0, gap: 12 } : { flexGrow: 1 }}
        data={filteredWalks}
        keyExtractor={(walk) => walk.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => <WalkCard walk={toDisplayWalk(item)} onPress={(walk) => router.push(`/walks/past/${walk.id}`)} />}
        ListEmptyComponent={
          <EmptyState
            emoji="🦮"
            title="Aucune balade passée"
            body={filter === "confirmed" ? "Aucune balade confirmée pour l'instant." : "Tes balades passées apparaîtront ici."}
          />
        }
      />
    </YStack>
  )
}
