import { Tabs } from "expo-router"
import type { ColorValue } from "react-native"
import { Text } from "react-native"

import { useSession } from "@/account/presentation/providers/session-provider"
import { useReceivedFriendRequests } from "@/friend/presentation/hooks/use-friends"
import { useThemePreference } from "@/shared/providers/theme-preference-provider"
import { IconWithBadge, themes } from "@/shared/ui"

function FriendsTabIcon({ color }: { color: ColorValue }) {
  const { session } = useSession()
  const { data: receivedRequests } = useReceivedFriendRequests(session?.user.id)

  return (
    <IconWithBadge count={receivedRequests?.length ?? 0}>
      <Text style={{ fontSize: 20, color }}>👥</Text>
    </IconWithBadge>
  )
}

export default function TabsLayout() {
  const { resolvedTheme } = useThemePreference()
  const theme = themes[resolvedTheme]

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // The native tab bar sits outside Tamagui's own render tree — it doesn't pick up
        // theme changes automatically, so it's styled explicitly from the resolved theme here.
        tabBarStyle: { backgroundColor: theme.backgroundStrong, borderTopColor: theme.borderColor },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.colorSubtle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🦮</Text>,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Amis",
          tabBarIcon: ({ color }) => <FriendsTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }}
      />
    </Tabs>
  )
}
