import { Tabs } from "expo-router"

import { useReceivedCoOwnerInvites } from "@/dog/presentation/hooks/use-co-owner-invites"
import { useReceivedFriendRequests } from "@/friend/presentation/hooks/use-friends"
import { useSession } from "@/shared/providers/session-provider"
import { useThemePreference } from "@/shared/providers/theme-preference-provider"
import { IconAmis, IconBalades, IconChiens, IconProfil, IconWithBadge, themes } from "@/shared/ui"

import type { ColorValue } from "react-native"

function DogsTabIcon({ color, count }: { color: ColorValue; count: number }) {
  return (
    <IconWithBadge count={count}>
      <IconChiens size={27} color={color as string} />
    </IconWithBadge>
  )
}

function FriendsTabIcon({ color, count }: { color: ColorValue; count: number }) {
  return (
    <IconWithBadge count={count}>
      <IconAmis size={27} color={color as string} />
    </IconWithBadge>
  )
}

/** A VoiceOver/TalkBack user hears just "Chiens"/"Amis" for the tab — the badge is purely
 * visual, so any pending count is appended into the label itself instead. */
function tabLabelWithCount(title: string, count: number): string {
  return count > 0 ? `${title}, ${count} en attente` : title
}

export default function TabsLayout() {
  const { resolvedTheme } = useThemePreference()
  const theme = themes[resolvedTheme]
  const { session } = useSession()
  const { data: receivedInvites } = useReceivedCoOwnerInvites(session?.user.id)
  const { data: receivedRequests } = useReceivedFriendRequests(session?.user.id)
  const dogsPendingCount = receivedInvites?.length ?? 0
  const friendsPendingCount = receivedRequests?.length ?? 0

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
          tabBarAccessibilityLabel: tabLabelWithCount("Chiens", dogsPendingCount),
          tabBarIcon: ({ color }) => <DogsTabIcon color={color} count={dogsPendingCount} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Amis",
          tabBarAccessibilityLabel: tabLabelWithCount("Amis", friendsPendingCount),
          tabBarIcon: ({ color }) => <FriendsTabIcon color={color} count={friendsPendingCount} />,
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
