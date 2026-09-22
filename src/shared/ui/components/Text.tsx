import { styled, Text as TamaguiText } from "tamagui"

/** Display / screen titles. Baloo 2, tight leading. */
export const Display = styled(TamaguiText, {
  name: "Display",
  fontFamily: "$heading",
  color: "$color",
  fontWeight: "800",
  variants: {
    size: {
      // lineHeight needs real headroom above fontSize for Baloo 2: its ascenders sit
      // taller in the glyph box than the ~1.05x ratios originally here, which clipped
      // letter tops on native (the web preview doesn't clip overflowing line boxes,
      // so this didn't show up there).
      lg: { fontSize: 34, lineHeight: 41 },
      md: { fontSize: 30, lineHeight: 37 },
      sm: { fontSize: 24, lineHeight: 30 },
    },
  } as const,
  defaultVariants: { size: "md" },
})

/** Card and section titles. */
export const Title = styled(TamaguiText, {
  name: "Title",
  fontFamily: "$heading",
  color: "$color",
  fontWeight: "700",
  variants: {
    size: {
      // Same headroom fix as Display, see comment there.
      lg: { fontSize: 20, lineHeight: 26 },
      md: { fontSize: 17, lineHeight: 23 },
      sm: { fontSize: 15, lineHeight: 20 },
    },
  } as const,
  defaultVariants: { size: "md" },
})

/** Everything else: body copy, list rows, helper text. Nunito. */
export const Body = styled(TamaguiText, {
  name: "Body",
  fontFamily: "$body",
  color: "$color",
  fontWeight: "600",
  variants: {
    size: {
      lg: { fontSize: 16, lineHeight: 24 },
      md: { fontSize: 14, lineHeight: 21 },
      sm: { fontSize: 13, lineHeight: 19 },
      xs: { fontSize: 12, lineHeight: 17 },
    },
    tone: {
      default: { color: "$color" },
      subtle: { color: "$colorSubtle" },
      accent: { color: "$accent" },
      inverse: { color: "$colorInverse" },
    },
  } as const,
  defaultVariants: { size: "md", tone: "default" },
})

/** Small uppercase field labels ("Où ?", "Durée"). */
export const Label = styled(TamaguiText, {
  name: "Label",
  fontFamily: "$body",
  fontWeight: "800",
  fontSize: 13,
  lineHeight: 17,
  color: "$colorSubtle",
})
