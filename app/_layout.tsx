import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useFonts } from "expo-font"
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router"
import { type ReactNode, useEffect } from "react"
import { View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { TamaguiProvider } from "tamagui"

import { useProfile } from "@/account/presentation/hooks/use-profile"
import { usePushRegistration } from "@/account/presentation/hooks/use-push-registration"
import { SessionProvider, useSession } from "@/shared/providers/session-provider"
import { ThemePreferenceProvider, useThemePreference } from "@/shared/providers/theme-preference-provider"
import { config } from "@/shared/ui"
import { closeAll as closeOpenPickers, isInsideOpenBounds } from "@/shared/ui/picker-coordinator"

const queryClient = new QueryClient()

function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession()
  const { data: profile, isLoading: profileLoading } = useProfile(session?.user.id)
  // expo-router's typed routes infer a fixed-length tuple per possible route; we deliberately
  // read segments[1] across routes of varying depth, so treat it as a plain string array.
  const segments = useSegments() as string[]
  const router = useRouter()
  const navigationState = useRootNavigationState()

  // Gated on `profile`, not just `session`: push_tokens.user_id references profiles, so
  // registering any earlier (mid-onboarding, before a profile row exists) would just fail.
  usePushRegistration(profile ? session?.user.id : undefined)

  useEffect(() => {
    // Router isn't ready to navigate yet, or we don't have enough info to decide.
    if (!navigationState?.key || sessionLoading) return
    if (session && profileLoading) return

    const inAuthGroup = segments[0] === "(auth)"
    // Onboarding spans two screens (profile, then an optional first-dog step) under this one
    // segment — while inside it, onboarding itself decides when to navigate home, not this gate.
    const inOnboarding = segments[1] === "onboarding"

    if (!session && segments[1] !== "login") {
      // Not just "!inAuthGroup": /login is itself in the (auth) group, and so is onboarding
      // (e.g. signing out from there) — checking the screen itself covers both cases.
      router.replace("/login")
    } else if (session && !profile && !inOnboarding) {
      router.replace("/onboarding")
    } else if (session && profile && inAuthGroup && !inOnboarding) {
      router.replace("/")
    }
  }, [navigationState?.key, session, sessionLoading, profile, profileLoading, segments, router])

  return children
}

function ThemedApp({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useThemePreference()
  return (
    <TamaguiProvider config={config} defaultTheme={resolvedTheme}>
      {children}
    </TamaguiProvider>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Baloo2-SemiBold": require("../assets/fonts/Baloo2-SemiBold.ttf"),
    "Baloo2-Bold": require("../assets/fonts/Baloo2-Bold.ttf"),
    "Baloo2-ExtraBold": require("../assets/fonts/Baloo2-ExtraBold.ttf"),
    "Nunito-Regular": require("../assets/fonts/Nunito-Regular.ttf"),
    "Nunito-SemiBold": require("../assets/fonts/Nunito-SemiBold.ttf"),
    "Nunito-Bold": require("../assets/fonts/Nunito-Bold.ttf"),
    "Nunito-ExtraBold": require("../assets/fonts/Nunito-ExtraBold.ttf"),
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <ThemePreferenceProvider>
              <ThemedApp>
                <AuthGate>
                  {/* Capture phase, not onPress: fires before any nested Pressable/chip/row
                   * claims the touch, so it closes an open DateField picker (see
                   * shared/ui/picker-coordinator.ts) no matter what's tapped next, without that
                   * component needing to know pickers exist. Skips the close when the touch
                   * itself starts on the open picker (e.g. dragging its spinner) — otherwise
                   * every touch on the picker would instantly unmount it. Returns false to
                   * never actually claim the responder, so the touch still reaches its real
                   * target normally either way. */}
                  <View
                    style={{ flex: 1 }}
                    onStartShouldSetResponderCapture={(event) => {
                      const { pageX, pageY } = event.nativeEvent
                      if (!isInsideOpenBounds(pageX, pageY)) closeOpenPickers()
                      return false
                    }}
                  >
                    <Stack screenOptions={{ headerShown: false }} />
                  </View>
                </AuthGate>
              </ThemedApp>
            </ThemePreferenceProvider>
          </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
