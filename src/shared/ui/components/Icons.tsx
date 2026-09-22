import Svg, { Circle, G, Path, Rect } from "react-native-svg"

/**
 * Two families, on the same 24px grid (see design handoff, "icônes — variante 1C"):
 *   • Navigation (Balades, Chiens, Amis, Profil): SOLID silhouettes.
 *   • Metadata / actions (calendar, clock, duration, chevron, settings): 2px STROKE
 *     (settings is solid — it's an action glyph, not metadata), rounded caps and joins.
 *
 * Colour never comes from inside the icon: pass `color`. Use `$accentSoftText` (not
 * `$accent`) as the ink colour on a light background — `$accent` is a surface-fill colour
 * (2.8:1 on white), not legible enough as icon/text ink.
 */

export type IconProps = {
  /** rendered square size in px. Default 24. */
  size?: number;
  /** any RN colour string — pass a theme token's resolved value. */
  color?: string;
}

const S = ({ size = 24, children }: { size?: number; children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {children}
  </Svg>
)

/* ---------- Navigation — solid ---------- */

export const IconBalades = ({ size = 24, color = "#2B2118" }: IconProps) => (
  <S size={size}>
    <Path
      d="M12 2.6c-3.6 0-6.5 2.9-6.5 6.5 0 4.8 5.6 10.1 5.8 10.3.4.4 1 .4 1.4 0 .2-.2 5.8-5.5 5.8-10.3 0-3.6-2.9-6.5-6.5-6.5zm0 9.2a2.7 2.7 0 110-5.4 2.7 2.7 0 010 5.4z"
      fill={color}
    />
  </S>
)

export const IconChiens = ({ size = 24, color = "#2B2118" }: IconProps) => (
  <S size={size}>
    <Circle cx={6.9} cy={8.6} r={2.25} fill={color} />
    <Circle cx={11.1} cy={6.5} r={2.35} fill={color} />
    <Circle cx={15.4} cy={7} r={2.2} fill={color} />
    <Circle cx={18.7} cy={10.2} r={2} fill={color} />
    <Path
      d="M12.4 11.4c3 0 5 2.1 5 4.5 0 2.1-1.7 3.4-3.6 3.4-.9 0-1.2-.3-1.9-.3s-1 .3-1.9.3c-1.9 0-3.6-1.3-3.6-3.4 0-2.4 2-4.5 5-4.5z"
      fill={color}
    />
  </S>
)

export const IconAmis = ({ size = 24, color = "#2B2118" }: IconProps) => (
  <S size={size}>
    <Circle cx={9.1} cy={8.9} r={3.5} fill={color} />
    <Path
      d="M2.6 19.3c0-3.6 2.9-5.9 6.5-5.9s6.5 2.3 6.5 5.9c0 .7-.5 1.2-1.2 1.2H3.8c-.7 0-1.2-.5-1.2-1.2z"
      fill={color}
    />
    <Circle cx={17.1} cy={8.2} r={2.7} fill={color} />
    <Path
      d="M16.4 13.5c3.1.1 5.5 2.2 5.5 5.3 0 .9-.5 1.5-1.4 1.5h-2.3c.3-2.8-.8-5.2-1.8-6.8z"
      fill={color}
    />
  </S>
)

export const IconProfil = ({ size = 24, color = "#2B2118" }: IconProps) => (
  <S size={size}>
    <Circle cx={12} cy={8.4} r={4} fill={color} />
    <Path
      d="M4.6 19.5c0-4 3.3-6.5 7.4-6.5s7.4 2.5 7.4 6.5c0 .7-.6 1.3-1.3 1.3H5.9c-.7 0-1.3-.6-1.3-1.3z"
      fill={color}
    />
  </S>
)

export const tabIcons = {
  balades: IconBalades,
  chiens: IconChiens,
  amis: IconAmis,
  profil: IconProfil,
} as const

export type TabKey = keyof typeof tabIcons

/* ---------- Metadata — 2px stroke ---------- */

const strokeProps = (color: string) => ({
  fill: "none" as const,
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
})

export const IconCalendar = ({ size = 24, color = "#C8391A" }: IconProps) => (
  <S size={size}>
    <G {...strokeProps(color)}>
      <Rect x={3.2} y={5} width={17.6} height={16} rx={4} />
      <Path d="M3.2 10h17.6M8 3v4M16 3v4" />
    </G>
  </S>
)

export const IconClock = ({ size = 24, color = "#C8391A" }: IconProps) => (
  <S size={size}>
    <G {...strokeProps(color)}>
      <Circle cx={12} cy={12} r={8.6} />
      <Path d="M12 7.4V12l3.1 2.1" />
    </G>
  </S>
)

export const IconDuration = ({ size = 24, color = "#C8391A" }: IconProps) => (
  <S size={size}>
    <G {...strokeProps(color)}>
      <Circle cx={12} cy={13.6} r={7.4} />
      <Path d="M12 10.3v3.3l2.2 1.5M9.6 2.8h4.8M12 2.8v3.4M18.6 7L20 5.6" />
    </G>
  </S>
)

export const IconChevronRight = ({ size = 24, color = "#EADDD0" }: IconProps) => (
  <S size={size}>
    <G {...strokeProps(color)}>
      <Path d="M9.5 5.5l6 6.5-6 6.5" />
    </G>
  </S>
)

/* ---------- Action — solid ---------- */

export const IconSettings = ({ size = 24, color = "#FFFFFF" }: IconProps) => (
  <S size={size}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z"
      fill={color}
    />
  </S>
)
