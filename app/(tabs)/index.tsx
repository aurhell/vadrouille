import { Text } from "react-native"
import { XStack, YStack } from "tamagui"

import { useProfile } from "@/account/presentation/hooks/use-profile"
import { useSession } from "@/account/presentation/providers/session-provider"
import { Body, Display } from "@/shared/ui"

export default function Home() {
  const { session } = useSession()
  const { data: profile } = useProfile(session?.user.id)

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" backgroundColor="$background">
      <XStack alignItems="flex-end" gap="$2">
        <Display size="lg">Vadrouille</Display>
        {/* Plain RN Text, not Display: Apple Color Emoji renders taller than Baloo 2's
         * own glyphs at the same fontSize, so it needs its own generous line box rather
         * than sharing Display's (which is already sized correctly for Latin text). */}
        <Text style={{ fontSize: 34, lineHeight: 50, marginBottom: 4 }}>🦮</Text>
      </XStack>
      <Body size="lg" tone="subtle">
        {profile ? `Salut ${profile.username} !` : "Une app de balade chiens, avec ses potes."}
      </Body>
    </YStack>
  )
}
