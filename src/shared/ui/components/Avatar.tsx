import { Image, XStack, YStack, styled } from "tamagui"

import { Body } from "./Text"

import type { Friend } from "../types"

const Frame = styled(YStack, {
  name: "Avatar",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  borderRadius: "$round",
  backgroundColor: "$accent",
  borderColor: "$backgroundStrong",
  variants: {
    size: {
      sm: { width: "$avatarSm", height: "$avatarSm", borderWidth: 2 },
      md: { width: "$avatarMd", height: "$avatarMd", borderWidth: 3 },
      lg: { width: "$avatarLg", height: "$avatarLg", borderWidth: 0 },
    },
    tone: {
      accent: { backgroundColor: "$accent" },
      warning: { backgroundColor: "$warning" },
      success: { backgroundColor: "$success" },
      ink: { backgroundColor: "$color" },
      muted: { backgroundColor: "$backgroundMuted" },
    },
  } as const,
  defaultVariants: { size: "md", tone: "accent" },
})

const tones = ["accent", "success", "warning", "ink"] as const
/** Stable colour per user so an avatar keeps its identity across screens. */
export const toneForId = (id: string) =>
  tones[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % tones.length]

export type AvatarProps = {
  friend: Friend;
} & React.ComponentProps<typeof Frame>

export function Avatar({ friend, ...props }: AvatarProps) {
  const tone = props.tone ?? toneForId(friend.id)
  const textColor = tone === "warning" || tone === "muted" ? "$color" : "$colorInverse"
  return (
    <Frame {...props} tone={tone}>
      {friend.avatarUrl ? (
        <Image source={{ uri: friend.avatarUrl }} width="100%" height="100%" />
      ) : (
        <Body size="xs" fontWeight="800" color={textColor} textTransform="uppercase">
          {friend.username.slice(0, 1)}
        </Body>
      )}
    </Frame>
  )
}

export type AvatarStackProps = {
  friends: Friend[];
  max?: number;
  size?: "sm" | "md";
}

export function AvatarStack({ friends, max = 3, size = "md" }: AvatarStackProps) {
  const shown = friends.slice(0, max)
  const extra = friends.length - shown.length
  const overlap = size === "sm" ? -8 : -11
  return (
    <XStack>
      {shown.map((f, i) => (
        <YStack key={f.id} marginLeft={i === 0 ? 0 : overlap}>
          <Avatar friend={f} size={size} />
        </YStack>
      ))}
      {extra > 0 ? (
        <Frame size={size} tone="ink" marginLeft={overlap}>
          <Body size="xs" fontWeight="800" color="$colorInverse">
            +{extra}
          </Body>
        </Frame>
      ) : null}
    </XStack>
  )
}

export const AvatarFrame = Frame
