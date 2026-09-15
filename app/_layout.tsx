import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useFonts } from "expo-font"
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router"
import { type ReactNode, useEffect } from "react"
import { useColorScheme } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { TamaguiProvider } from "tamagui"

import { useProfile } from "@/account/presentation/hooks/use-profile"
import { SessionProvider, useSession } from "@/account/presentation/providers/session-provider"
import { config } from "@/shared/ui"

const queryClient = new QueryClient()

function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession()
  const { data: profile, isLoading: profileLoading } = useProfile(session?.user.id)
  // expo-router's typed routes infer a fixed-length tuple per possible route; we deliberately
  // read segments[1] across routes of varying depth, so treat it as a plain string array.
  const segments = useSegments() as string[]
  const router = useRouter()
  const navigationState = useRootNavigationState()

  useEffect(() => {
    // Router isn't ready to navigate yet, or we don't have enough info to decide.
    if (!navigationState?.key || sessionLoading) return
    if (session && profileLoading) return

    const inAuthGroup = segments[0] === "(auth)"

    if (!session && !inAuthGroup) {
      router.replace("/login")
    } else if (session && !profile && segments[1] !== "onboarding") {
      router.replace("/onboarding")
    } else if (session && profile && inAuthGroup) {
      router.replace("/")
    }
  }, [navigationState?.key, session, sessionLoading, profile, profileLoading, segments, router])

  return children
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
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
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <TamaguiProvider config={config} defaultTheme={colorScheme === "dark" ? "dark" : "light"}>
            <AuthGate>
              <Stack screenOptions={{ headerShown: false }} />
            </AuthGate>
          </TamaguiProvider>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
