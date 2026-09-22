import { XStack } from "tamagui"

import { useThemePreference } from "@/shared/providers/theme-preference-provider"

import { formatDuration, formatWalkDate, formatWalkTime } from "../mocks"
import { themes } from "../themes"

import { IconCalendar, IconClock, IconDuration } from "./Icons"
import { Body } from "./Text"

export type WalkMetaLineProps = {
  startTime: string;
  durationMinutes: number;
  /** 'card' — dark ink on a white/cream card (WalkCard). 'accent' — white ink on the coral
   * header block (WalkDetailScreen, PastWalkDetailScreen). */
  tone?: "card" | "accent";
}

/** Date · heure · durée, each preceded by its icon — see Icons.tsx. Replaces the old
 * 📅 🕐 ⏱️ emoji row: same three facts, but icon ink stays consistent across light/dark and
 * both tones instead of relying on the emoji glyph's own (uncontrollable) colour. */
export function WalkMetaLine({ startTime, durationMinutes, tone = "card" }: WalkMetaLineProps) {
  const { resolvedTheme } = useThemePreference()
  const theme = themes[resolvedTheme]
  const ink = tone === "accent" ? theme.accentText : theme.accentSoftText
  const sep = tone === "accent" ? theme.accentText : theme.borderColor
  const textProps =
    tone === "accent"
      ? ({ color: "$accentText", opacity: 0.92 } as const)
      : ({ tone: "accent" } as const)

  return (
    <XStack alignItems="center" gap="$1">
      <IconCalendar size={17} color={ink} />
      <Body size="md" fontWeight="700" {...textProps}>
        {formatWalkDate(startTime)}
      </Body>
      <Body size="md" fontWeight="700" color={sep as any}>
        {" "}
        ·{" "}
      </Body>
      <IconClock size={17} color={ink} />
      <Body size="md" fontWeight="700" {...textProps}>
        {formatWalkTime(startTime)}
      </Body>
      <Body size="md" fontWeight="700" color={sep as any}>
        {" "}
        ·{" "}
      </Body>
      <IconDuration size={17} color={ink} />
      <Body size="md" fontWeight="700" {...textProps}>
        {formatDuration(durationMinutes)}
      </Body>
    </XStack>
  )
}
