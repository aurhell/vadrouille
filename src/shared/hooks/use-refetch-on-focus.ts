import { useFocusEffect } from "expo-router"
import { useCallback, useRef } from "react"

/** Refetches on screen focus — e.g. switching back to the "Balades" tab after a friend
 * created a walk on their own device. React Navigation's tab navigator keeps screens mounted
 * across tab switches, so TanStack Query's own refetch-on-mount never fires the way it would
 * on a web page reload; this fills that gap. Skips the very first focus, since the screen's
 * initial mount already triggered a fetch. Silent — no `usePullToRefresh` spinner. */
export function useRefetchOnFocus(refetch: () => void) {
  const isFirstFocus = useRef(true)
  // Callers often pass an inline arrow (e.g. `() => Promise.all([...])`) that's a new
  // reference every render — capture it in a ref so the focus callback itself stays stable
  // instead of re-registering on every render.
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false
        return
      }
      refetchRef.current()
    }, []),
  )
}
