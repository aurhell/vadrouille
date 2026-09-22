import { palette } from "./tokens"

/**
 * Semantic tokens. Components only ever reference these names, so light,
 * dark and the status sub-themes stay interchangeable.
 *
 * light  — cream & coral (Direction A as designed)
 * dark   — "nuit chaude": aubergine/brown ground, amber promoted to primary accent
 *
 * Sub-themes (confirmed / declined / maybe / pending) only override
 * accent / accentText / accentSoft / accentSoftText, so any component that
 * styles itself from those four reacts to <Theme name="confirmed">.
 */
type ThemeTokens = {
  background: string;
  backgroundStrong: string;
  backgroundSoft: string;
  backgroundMuted: string;
  color: string;
  colorSubtle: string;
  colorFaint: string;
  colorInverse: string;
  borderColor: string;
  borderColorStrong: string;
  shadowColor: string;
  accent: string;
  accentPress: string;
  accentText: string;
  accentSoft: string;
  accentSoftText: string;
  success: string;
  successSoft: string;
  successSoftText: string;
  warning: string;
  warningSoft: string;
  warningSoftText: string;
  danger: string;
  dangerSoft: string;
  dangerSoftText: string;
  neutralSoft: string;
  neutralSoftText: string;
}

// `satisfies` (not `: ThemeTokens`) keeps each theme's own literal-value type instead of
// widening to the interface — that's what lets `dark` hold different hex values than
// `light` while still catching typos/missing/extra keys against ThemeTokens.
const light = {
  background: palette.cream100,
  backgroundStrong: palette.cream50,
  backgroundSoft: palette.coral50,
  backgroundMuted: palette.cream200,

  color: palette.brown800,
  colorSubtle: palette.brown500,
  colorFaint: palette.brown400,
  colorInverse: palette.cream50,

  borderColor: palette.cream300,
  borderColorStrong: palette.cream400,
  shadowColor: "rgba(43,33,24,0.12)",

  accent: palette.coral500,
  accentPress: palette.coral600,
  accentText: palette.cream50,
  accentSoft: palette.coral50,
  accentSoftText: palette.coral700,

  success: palette.teal500,
  successSoft: palette.teal50,
  successSoftText: palette.teal700,

  warning: palette.amber500,
  warningSoft: palette.amber50,
  warningSoftText: palette.amber700,

  danger: palette.coral600,
  dangerSoft: "#FFE9E4",
  dangerSoftText: palette.coral700,

  neutralSoft: palette.cream200,
  neutralSoftText: palette.brown500,
} satisfies ThemeTokens

const dark = {
  background: palette.night900,
  backgroundStrong: palette.night800,
  backgroundSoft: palette.night700,
  backgroundMuted: palette.night700,

  color: palette.sand200,
  colorSubtle: palette.sand400,
  colorFaint: "#8C7A70",
  colorInverse: palette.night900,

  borderColor: palette.night600,
  borderColorStrong: palette.night500,
  shadowColor: "rgba(0,0,0,0.45)",

  /** amber leads in the dark theme: coral on aubergine loses too much contrast */
  accent: palette.amber500,
  accentPress: palette.amber600,
  accentText: "#241019",
  accentSoft: "#3A2A1C",
  accentSoftText: palette.amber500,

  success: "#4FD2B8",
  successSoft: "#1F3A36",
  successSoftText: "#7FE6D0",

  warning: palette.amber500,
  warningSoft: "#3A2A1C",
  warningSoftText: palette.amber500,

  danger: "#FF8A6A",
  dangerSoft: "#3A1F1A",
  dangerSoftText: "#FFB09A",

  neutralSoft: palette.night700,
  neutralSoftText: palette.sand400,
} satisfies ThemeTokens

type StatusOverrides = Pick<
  ThemeTokens,
  "accent" | "accentPress" | "accentText" | "accentSoft" | "accentSoftText"
>

const statusLight: Record<string, StatusOverrides> = {
  confirmed: {
    accent: palette.teal500,
    accentPress: palette.teal600,
    accentText: palette.cream50,
    accentSoft: palette.teal50,
    accentSoftText: palette.teal700,
  },
  maybe: {
    accent: palette.amber500,
    accentPress: palette.amber600,
    accentText: palette.brown800,
    accentSoft: palette.amber50,
    accentSoftText: palette.amber700,
  },
  declined: {
    accent: palette.coral600,
    accentPress: palette.coral700,
    accentText: palette.cream50,
    accentSoft: "#FFE9E4",
    accentSoftText: palette.coral700,
  },
  pending: {
    accent: palette.cream400,
    accentPress: palette.brown400,
    accentText: palette.brown800,
    accentSoft: palette.cream200,
    accentSoftText: palette.brown500,
  },
}

const statusDark: Record<string, StatusOverrides> = {
  confirmed: {
    accent: "#4FD2B8",
    accentPress: "#3BB9A0",
    accentText: palette.night900,
    accentSoft: "#1F3A36",
    accentSoftText: "#7FE6D0",
  },
  maybe: {
    accent: palette.amber500,
    accentPress: palette.amber600,
    accentText: palette.night900,
    accentSoft: "#3A2A1C",
    accentSoftText: palette.amber500,
  },
  declined: {
    accent: "#FF8A6A",
    accentPress: "#E8704F",
    accentText: palette.night900,
    accentSoft: "#3A1F1A",
    accentSoftText: "#FFB09A",
  },
  pending: {
    accent: palette.night500,
    accentPress: palette.night600,
    accentText: palette.sand200,
    accentSoft: palette.night700,
    accentSoftText: palette.sand400,
  },
}

export const themes = {
  light,
  dark,
  light_confirmed: { ...light, ...statusLight.confirmed },
  light_maybe: { ...light, ...statusLight.maybe },
  light_declined: { ...light, ...statusLight.declined },
  light_pending: { ...light, ...statusLight.pending },
  dark_confirmed: { ...dark, ...statusDark.confirmed },
  dark_maybe: { ...dark, ...statusDark.maybe },
  dark_declined: { ...dark, ...statusDark.declined },
  dark_pending: { ...dark, ...statusDark.pending },
}

export type AppThemes = typeof themes
