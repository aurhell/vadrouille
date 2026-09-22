import { useSafeAreaInsets } from "react-native-safe-area-context"
import { XStack, YStack, styled } from "tamagui"

import { Body, Display } from "./Text"

const Frame = styled(YStack, {
  name: "ScreenHeader",
  paddingHorizontal: "$5",
  paddingTop: "$4",
  paddingBottom: "$3",
  variants: {
    /** accent = coloured header block (walk detail, onboarding) */
    tone: {
      plain: { backgroundColor: "transparent" },
      accent: { backgroundColor: "$accent", paddingBottom: "$6" },
    },
  } as const,
  defaultVariants: { tone: "plain" },
})

export type ScreenHeaderProps = {
  title: string;
  /** A plain string renders in the header's default subtitle style. Pass a node (e.g. an
   * icon + text row) to style it yourself — see WalkDetailScreen's date/time/duration line. */
  subtitle?: React.ReactNode;
  /** renders a "‹ Retour" affordance */
  onBack?: () => void;
  /** named rightSlot (not `right`) — that name collides with the positioning style prop */
  rightSlot?: React.ReactNode;
} & React.ComponentProps<typeof Frame>

export function ScreenHeader({ title, subtitle, onBack, rightSlot, ...props }: ScreenHeaderProps) {
  const accent = props.tone === "accent"
  const insets = useSafeAreaInsets()
  return (
    // Frame's own `$4` paddingTop (16px) is a fixed token, not safe-area-aware — screens
    // without a native header (headerShown: false, see (tabs)/_layout.tsx) render straight
    // under the status bar/notch otherwise. Overridden here rather than in Frame itself
    // since styled() can't call hooks.
    <Frame paddingTop={insets.top + 16} {...props}>
      {onBack ? (
        <Body
          size="sm"
          fontWeight="800"
          marginBottom="$3"
          opacity={0.85}
          color={accent ? "$accentText" : "$colorSubtle"}
          onPress={onBack}
          hitSlop={12}
        >
          ‹ Retour
        </Body>
      ) : null}
      <XStack alignItems="flex-end" justifyContent="space-between" gap="$3">
        <YStack flex={1} gap="$1">
          <Display size={accent ? "sm" : "md"} color={accent ? "$accentText" : "$color"}>
            {title}
          </Display>
          {subtitle ? (
            typeof subtitle === "string" ? (
              <Body
                size="md"
                fontWeight="700"
                color={accent ? "$accentText" : "$colorSubtle"}
                opacity={accent ? 0.92 : 1}
              >
                {subtitle}
              </Body>
            ) : (
              subtitle
            )
          ) : null}
        </YStack>
        {rightSlot ? <YStack>{rightSlot}</YStack> : null}
      </XStack>
    </Frame>
  )
}

export const ScreenHeaderFrame = Frame
