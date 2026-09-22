import { createAnimations } from "@tamagui/animations-react-native"
import { shorthands } from "@tamagui/shorthands"
import { createTamagui, createFont } from "tamagui"

import { themes, type AppThemes } from "./themes"
import { tokens } from "./tokens"

/**
 * Fonts are loaded by the app (see FONTS-AND-ICONS.md).
 * Family names below must match the names you register with expo-font
 * or link natively.
 */
const headingFont = createFont({
  family: "Baloo2",
  size: { 1: 13, 2: 15, 3: 17, 4: 19, 5: 20, 6: 24, 7: 26, 8: 28, 9: 30, 10: 34, true: 20 },
  // Extra headroom above fontSize for Baloo 2's tall ascenders (see Text.tsx Display/Title
  // for why the original ~1.05x ratios here clipped letter tops on native).
  lineHeight: { 1: 18, 2: 20, 3: 22, 4: 24, 5: 26, 6: 30, 7: 32, 8: 34, 9: 37, 10: 41, true: 26 },
  weight: { 4: "600", 7: "700", 8: "800", true: "700" },
  letterSpacing: { 4: 0, true: 0 },
  face: {
    600: { normal: "Baloo2-SemiBold" },
    700: { normal: "Baloo2-Bold" },
    800: { normal: "Baloo2-ExtraBold" },
  },
})

const bodyFont = createFont({
  family: "Nunito",
  size: { 1: 10, 2: 11, 3: 12, 4: 13, 5: 14, 6: 15, 7: 16, 8: 17, 9: 20, true: 14 },
  lineHeight: { 1: 14, 2: 15, 3: 17, 4: 19, 5: 21, 6: 22, 7: 24, 8: 25, 9: 28, true: 21 },
  weight: { 4: "400", 6: "600", 7: "700", 8: "800", true: "600" },
  letterSpacing: { 4: 0, true: 0 },
  face: {
    400: { normal: "Nunito-Regular" },
    600: { normal: "Nunito-SemiBold" },
    700: { normal: "Nunito-Bold" },
    800: { normal: "Nunito-ExtraBold" },
  },
})

const animations = createAnimations({
  fast: { type: "spring", damping: 20, mass: 0.9, stiffness: 260 },
  medium: { type: "spring", damping: 18, mass: 1, stiffness: 180 },
  lazy: { type: "spring", damping: 22, mass: 1.2, stiffness: 90 },
  sheet: { type: "spring", damping: 26, mass: 1.1, stiffness: 200 },
})

export const config = createTamagui({
  animations,
  shorthands,
  tokens,
  // createTamagui()'s `themes` param wants each theme shaped as a generic
  // `{[key: string]: string | number | Variable<any>}` record. Our theme objects (see
  // themes.ts) are intentionally NOT typed that loosely — they use a closed `ThemeTokens`
  // interface with `satisfies` so a typo'd or missing token key is a compile error there.
  // This cast is the one place that trades that away, only for the value Tamagui itself
  // consumes; `themes.ts`'s own exports stay strict.
  themes: themes as Record<string, Record<string, string>>,
  fonts: { heading: headingFont, body: bodyFont },
  defaultFont: "body",
  media: {
    short: { maxHeight: 700 },
    tall: { minHeight: 820 },
    narrow: { maxWidth: 360 },
    wide: { minWidth: 420 },
  },
  settings: {
    allowedStyleValues: "somewhat-strict-web",
    fastSchemeChange: true,
  },
})

export default config

type Conf = typeof config
declare module "tamagui" {
  // Declaration merging with Tamagui's own `interface TamaguiCustomConfig` requires an
  // `interface` here — a `type` alias of the same name doesn't merge, it just collides
  // (a previous `eslint --fix` pass silently rewrote this to `type` and broke the build).
  // The empty body is also required (this interface's only job is the `extends`) — Tamagui's
  // own typing docs use this exact pattern.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends Conf {}
}
export type { AppThemes }
