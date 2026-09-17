import { useRouter } from "expo-router"
import { Text } from "react-native"
import { XStack, YStack } from "tamagui"

import { useProfile } from "@/account/presentation/hooks/use-profile"
import { useSession } from "@/account/presentation/providers/session-provider"
import { useReceivedCoOwnerInvites } from "@/dog/presentation/hooks/use-co-owner-invites"
import { Body, Button, Display, IconWithBadge } from "@/shared/ui"

export default function Home() {
  const router = useRouter()
  const { session } = useSession()
  const { data: profile } = useProfile(session?.user.id)
  const { data: receivedCoOwnerInvites } = useReceivedCoOwnerInvites(session?.user.id)

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$5" backgroundColor="$background">
      <YStack alignItems="center" gap="$3">
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

      <Button
        variant="secondary"
        icon={
          <IconWithBadge count={receivedCoOwnerInvites?.length ?? 0}>
            <Text style={{ fontSize: 18 }}>🦮</Text>
          </IconWithBadge>
        }
        onPress={() => router.push("/dogs")}
      >
        Mes chiens
      </Button>
    </YStack>
  )
}
