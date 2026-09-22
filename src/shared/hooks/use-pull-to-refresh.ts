import * as Haptics from "expo-haptics"
import { useCallback, useState } from "react"

const MIN_VISIBLE_MS = 600

/**
 * Wraps one or more refetches into FlatList-ready `refreshing` state. Enforces a minimum
 * visible duration — a refresh that resolves in 50ms just flickers otherwise, which reads as
 * broken rather than fast — and fires a light haptic tick on completion for a bit of "juice".
 * Reusable across any pull-to-refresh list (friends today, walks later).
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async() => {
    setRefreshing(true)
    const startedAt = Date.now()
    try {
      await refetch()
    } finally {
      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_VISIBLE_MS) await new Promise((resolve) => setTimeout(resolve, MIN_VISIBLE_MS - elapsed))
      setRefreshing(false)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    }
  }, [refetch])

  return { refreshing, onRefresh }
}
