import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { useEffect } from "react"

import { useRegisterPushToken } from "./use-account-mutations"

// Module-scope, not inside the hook: a foreground notification handler is a single global
// registration, not something to re-run per render/user. Without it, a push that arrives
// while the app is open and foregrounded shows nothing at all.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/** Requests notification permission and registers this device's Expo push token once a
 * session exists — see architecture-technique.md §Backend, walk.docs.md "Notifications liées
 * aux balades". Best-effort throughout: a denied permission, a simulator with no APNs
 * identity, or a missing EAS project id all just skip registration silently rather than
 * surface an error — none of this blocks using the app, it only blocks receiving pushes.
 *
 * `Device.isDevice` (`expo-device`) is `!isRunningOnEmulator` — true on iOS AND Android
 * alike, so it can't be used as a blanket guard here: an iOS Simulator can never obtain a
 * real APNs identity (no way around that, EAS dev build or not), but an Android EMULATOR can
 * get a real FCM token and receive real pushes — only iOS needs this guard. */
export function usePushRegistration(userId: string | undefined) {
  const registerPushToken = useRegisterPushToken()

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function register() {
      if (Platform.OS === "ios" && !Device.isDevice) return

      // Android 8+ requires a channel before a notification can show at all — harmless to
      // call every time, it's a no-op once the channel already exists.
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.DEFAULT,
        })
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      const status = existingStatus === "granted" ? existingStatus : (await Notifications.requestPermissionsAsync()).status
      if (status !== "granted") return

      const projectId = Constants.expoConfig?.extra?.eas?.projectId
      if (!projectId) return

      try {
        const token = await Notifications.getExpoPushTokenAsync({ projectId })
        if (!cancelled) registerPushToken.mutate(token.data)
      } catch {
        // E.g. offline, or Android without FCM credentials configured yet (see
        // https://docs.expo.dev/push-notifications/fcm-credentials/) — nothing to recover
        // from here.
      }
    }

    register()
    return () => {
      cancelled = true
    }
    // registerPushToken (a TanStack mutation object) is deliberately not in this list — it's
    // a fresh object every render, userId is the actual re-run condition.
  }, [userId])
}
