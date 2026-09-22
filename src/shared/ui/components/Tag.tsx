import { styled, YStack } from "tamagui"

import { Body } from "./Text"

const Frame = styled(YStack, {
  name: "Tag",
  alignSelf: "flex-start",
  borderRadius: "$round",
  paddingHorizontal: 8,
  paddingVertical: 3,
  variants: {
    tone: {
      subtle: { backgroundColor: "$backgroundMuted" },
      accent: { backgroundColor: "$accentSoft" },
    },
  } as const,
  defaultVariants: { tone: "subtle" },
})

export type TagProps = {
  children: React.ReactNode;
  /** subtle (default) — a quiet secondary fact ("foyer", "sans chien"). accent — highlights
   * something as mine/relevant ("toi"). Never used for RSVP status, see StatusBadge for that. */
  tone?: "subtle" | "accent";
}

/** Small standalone label for a secondary fact attached to something else — a shared dog's
 * "foyer", "toi" on a dog I confirmed, "sans chien" on a participant. Always on its own line,
 * never crammed inline after a name (that's what made it hard to read before this existed). */
export function Tag({ children, tone = "subtle" }: TagProps) {
  return (
    <Frame tone={tone}>
      <Body size="xs" fontWeight="700" color={tone === "accent" ? "$accentSoftText" : "$colorSubtle"}>
        {children}
      </Body>
    </Frame>
  )
}
