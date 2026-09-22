import { styled, Theme, XStack, YStack } from "tamagui"

import { rsvpLabels } from "../mocks"

import { Body } from "./Text"

import type { RsvpStatus } from "../types"

const Pill = styled(YStack, {
  name: "Pill",
  alignSelf: "flex-start",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: "$1",
  borderRadius: "$round",
  paddingHorizontal: 10,
  paddingVertical: 6,
  backgroundColor: "$accentSoft",
  variants: {
    emphasis: {
      soft: { backgroundColor: "$accentSoft" },
      solid: { backgroundColor: "$accent" },
    },
  } as const,
  defaultVariants: { emphasis: "soft" },
})

const glyph: Record<RsvpStatus, string> = {
  confirmed: "✓",
  maybe: "?",
  declined: "✕",
  pending: "⏳",
}

export type StatusBadgeProps = {
  status: RsvpStatus;
  emphasis?: "soft" | "solid";
  /** hide the glyph when the row already carries meaning elsewhere */
  showGlyph?: boolean;
}

/**
 * Status is carried by colour AND a glyph AND a word — never colour alone.
 * Wraps itself in the matching status sub-theme, so the pill pulls
 * $accent / $accentSoft from light_confirmed, dark_declined, etc.
 */
export function StatusBadge({ status, emphasis = "soft", showGlyph = true }: StatusBadgeProps) {
  return (
    <Theme name={status}>
      <Pill emphasis={emphasis}>
        <Body
          size="xs"
          fontWeight="800"
          color={emphasis === "solid" ? "$accentText" : "$accentSoftText"}
        >
          {showGlyph ? `${glyph[status]  } ` : ""}
          {rsvpLabels[status]}
        </Body>
      </Pill>
    </Theme>
  )
}

export type QuotaBadgeProps = {
  current: number;
  total: number;
  /** 'full' | 'partial' | 'low' drives the colour; computed when omitted */
  emphasis?: "solid" | "soft";
}

/** "8/10 🐕" — always nowrap: the emoji must not break onto a second line. */
export function QuotaBadge({ current, total, emphasis }: QuotaBadgeProps) {
  const ratio = total === 0 ? 0 : current / total
  const theme = ratio >= 0.7 ? "confirmed" : ratio >= 0.4 ? "maybe" : "declined"
  const level = emphasis ?? (ratio >= 0.4 ? "solid" : "soft")
  return (
    <Theme name={theme}>
      <Pill emphasis={level} flexShrink={0}>
        <XStack alignItems="center" gap={4} flexWrap="nowrap">
          <Body
            size="xs"
            fontWeight="800"
            color={level === "solid" ? "$accentText" : "$accentSoftText"}
            numberOfLines={1}
          >
            {current}/{total} 🐕
          </Body>
        </XStack>
      </Pill>
    </Theme>
  )
}

export const BadgePill = Pill
