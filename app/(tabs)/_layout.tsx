import { Tabs } from "expo-router"
import type { ColorValue } from "react-native"

import { useSession } from "@/shared/providers/session-provider"
import { useReceivedCoOwnerInvites } from "@/dog/presentation/hooks/use-co-owner-invites"
import { useReceivedFriendRequests } from "@/friend/presentation/hooks/use-friends"
import { useThemePreference } from "@/shared/providers/theme-preference-provider"
import { IconAmis, IconBalades, IconChiens, IconProfil, IconWithBadge, themes } from "@/shared/ui"

function DogsTabIcon({ color }: { color: ColorValue }) {
  const { session } = useSession()
  const { data: receivedInvites } = useReceivedCoOwnerInvites(session?.user.id)

  return (
    <IconWithBadge count={receivedInvites?.length ?? 0}>
      <IconChiens size={27} color={color as string} />
    </IconWithBadge>
  )
}

function FriendsTabIcon({ color }: { color: ColorValue }) {
  const { session } = useSession()
  const { data: receivedRequests } = useReceivedFriendRequests(session?.user.id)

  return (
    <IconWithBadge count={receivedRequests?.length ?? 0}>
      <IconAmis size={27} color={color as string} />
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
        // accentSoftText (not accent) — accent is a surface-fill colour (2.8:1 on white),
        // not legible enough as icon/label ink. See Icons.tsx.
        tabBarActiveTintColor: theme.accentSoftText,
        tabBarInactiveTintColor: theme.colorSubtle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Balades",
          tabBarIcon: ({ color }) => <IconBalades size={27} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="dogs"
        options={{
          title: "Chiens",
          tabBarIcon: ({ color }) => <DogsTabIcon color={color} />,
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
          tabBarIcon: ({ color }) => <IconProfil size={27} color={color as string} />,
        }}
      />
    </Tabs>
  )
}
