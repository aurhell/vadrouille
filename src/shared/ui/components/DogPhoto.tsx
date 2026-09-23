import { Circle, Path, Svg } from "react-native-svg"
import { Image, YStack, styled } from "tamagui"

import { useThemePreference } from "@/shared/providers/theme-preference-provider"

import { Body } from "./Text"

import type { Dog } from "../types"

const Frame = styled(YStack, {
  name: "DogPhoto",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  backgroundColor: "$backgroundMuted",
  variants: {
    size: {
      sm: { width: "$dogSm", height: "$dogSm" },
      md: { width: "$dogMd", height: "$dogMd" },
      lg: { width: "$dogLg", height: "$dogLg" },
    },
    shape: {
      /** round = inside a walk (a face in a crowd) */
      round: { borderRadius: "$round", borderWidth: 3, borderColor: "$warning" },
      /** rounded square = a dog record you can open */
      card: { borderRadius: "$4", borderWidth: 0 },
    },
    /** Dims the plain border whenever the ring is drawn as Svg instead (dashed, or the sex
     * glyph below) — RN can't render a dashed border, and can't extend a plain border into a
     * Venus/Mars glyph's tail either, both need a separate absolutely-positioned Svg ring. */
    dashed: { true: { borderColor: "transparent" } },
    sexRing: { true: { borderColor: "transparent" } },
  } as const,
  defaultVariants: { size: "md", shape: "round" },
})

const DASH_SIZE: Record<"sm" | "md" | "lg", number> = { sm: 40, md: 56, lg: 70 }
const TEAL = { light: "#3FBFA8", dark: "#4FD2B8" }
// Same hex in both themes (see themes.ts: warning === palette.amber500 for light and dark) —
// the default round ring's own colour, so the sex glyph's ring reads as an extension of it
// rather than a second, competing colour.
const WARNING_HEX = "#FFC145"

/** SVG path for a Mars (♂, tail up-right with an arrowhead) or Venus (♀, tail down with a
 * crossbar) glyph, its circle stroked directly over the dog's photo — the ring itself becomes
 * the symbol instead of a separate badge/emoji sitting on top of it. `tail` is how far the
 * stem extends past the circle's edge. */
function sexGlyphPath(cx: number, cy: number, r: number, tail: number, sex: NonNullable<Dog["sex"]>): string {
  if (sex === "female") {
    const stemEndY = cy + r + tail
    const crossHalf = tail * 0.55
    return `M ${cx} ${cy + r} L ${cx} ${stemEndY} M ${cx - crossHalf} ${stemEndY - tail * 0.35} L ${cx + crossHalf} ${stemEndY - tail * 0.35}`
  }

  const angle = -Math.PI / 4 // up-and-right, 45°
  const edgeX = cx + r * Math.cos(angle)
  const edgeY = cy + r * Math.sin(angle)
  const tipX = cx + (r + tail) * Math.cos(angle)
  const tipY = cy + (r + tail) * Math.sin(angle)
  const headLen = tail * 0.6
  const headSpread = (25 * Math.PI) / 180
  const backAngle = angle + Math.PI
  const head1X = tipX + headLen * Math.cos(backAngle - headSpread)
  const head1Y = tipY + headLen * Math.sin(backAngle - headSpread)
  const head2X = tipX + headLen * Math.cos(backAngle + headSpread)
  const head2Y = tipY + headLen * Math.sin(backAngle + headSpread)
  return `M ${edgeX} ${edgeY} L ${tipX} ${tipY} M ${tipX} ${tipY} L ${head1X} ${head1Y} M ${tipX} ${tipY} L ${head2X} ${head2Y}`
}

export type DogPhotoProps = {
  dog: Dog;
  showName?: boolean;
  /** Shared dog, not yet confirmed for this walk — dashed teal ring instead of the default
   * solid one, so the "someone in your household can also bring this dog" fact stays legible
   * without a separate label (see WalkDetailScreen's DogPill). Takes precedence over `sex`
   * when both are set — a dog is rarely both at once in practice, and the household fact is
   * the more actionable one in a walk-picking context. */
  dashed?: boolean;
  /** Green checkmark badge, bottom-right — same selection affordance as the friend picker
   * (see WalkFormScreen), instead of a coloured ring around the photo. */
  checked?: boolean;
  /** Draws the photo's own ring as a Mars/Venus glyph (circle + tail) instead of a plain ring
   * — see WalkDetailScreen "Chiens confirmés". Omitted when unset/null/dashed. */
  sex?: Dog["sex"] | null;
} & React.ComponentProps<typeof Frame>

export function DogPhoto({ dog, showName, dashed, checked, sex, ...props }: DogPhotoProps) {
  const { resolvedTheme } = useThemePreference()
  const size = (props.size ?? "md") as "sm" | "md" | "lg"
  const diameter = DASH_SIZE[size]
  const radius = diameter / 2 - 1.5
  const drawSexRing = !dashed && !!sex
  const tail = diameter * 0.22
  const canvas = diameter + tail * 2
  const center = tail + diameter / 2

  return (
    <YStack alignItems="center" gap="$2">
      {/* marginBottom: the sex glyph's tail (Venus' crossbar especially) is drawn outside this
       * box's own diameter×diameter bounds — without it, the name below sits right up against
       * the Svg overflow instead of the glyph. */}
      <YStack position="relative" width={diameter} height={diameter} marginBottom={drawSexRing ? tail : 0}>
        <Frame {...props} dashed={dashed} sexRing={drawSexRing}>
          {dog.photoUrl ? (
            <Image source={{ uri: dog.photoUrl }} width="100%" height="100%" />
          ) : (
            <Body size="xs" tone="subtle" fontWeight="700">
              {dog.name.slice(0, 1)}
            </Body>
          )}
        </Frame>
        {dashed ? (
          <Svg width={diameter} height={diameter} style={{ position: "absolute", top: 0, left: 0 }}>
            <Circle
              cx={diameter / 2}
              cy={diameter / 2}
              r={radius}
              fill="none"
              stroke={TEAL[resolvedTheme]}
              strokeWidth={2}
              strokeDasharray="4,3"
            />
          </Svg>
        ) : null}
        {drawSexRing && sex ? (
          <Svg width={canvas} height={canvas} style={{ position: "absolute", top: -tail, left: -tail }}>
            <Circle cx={center} cy={center} r={radius} fill="none" stroke={WARNING_HEX} strokeWidth={3} />
            <Path
              d={sexGlyphPath(center, center, radius, tail, sex)}
              fill="none"
              stroke={WARNING_HEX}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
        {checked ? (
          <YStack
            position="absolute"
            bottom={-2}
            right={-2}
            width={20}
            height={20}
            borderRadius="$round"
            borderWidth={2}
            borderColor="$backgroundStrong"
            backgroundColor="$success"
            alignItems="center"
            justifyContent="center"
          >
            <Body fontSize={11} lineHeight={11} fontWeight="800" color="$colorInverse">
              ✓
            </Body>
          </YStack>
        ) : null}
      </YStack>
      {showName ? (
        <Body size="xs" fontWeight="700">
          {dog.name}
        </Body>
      ) : null}
    </YStack>
  )
}

export const DogPhotoFrame = Frame
