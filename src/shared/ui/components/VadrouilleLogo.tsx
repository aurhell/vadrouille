import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { Display } from './Text';

/**
 * Vadrouille brand mark — "Le repère" (the meeting point): a paw print sitting inside a map
 * pin, the exact fusion of the tab bar's Balades pin and Chiens paw (see Icons.tsx).
 *
 * The mark is two-tone by construction: the paw is a CUTOUT, not a white shape, so it takes
 * on whatever colour is behind it. Always pass `background` equal to the real surface colour
 * (resolve it from the active theme — see assets/logo/README.md "La patte est un évidement"),
 * or the paw will render wrong against anything but the exact default cream.
 */

const PIN = 'M12 2.6c-3.6 0-6.5 2.9-6.5 6.5 0 4.8 5.6 10.1 5.8 10.3.4.4 1 .4 1.4 0 .2-.2 5.8-5.5 5.8-10.3 0-3.6-2.9-6.5-6.5-6.5z';
const PAD = 'M24 17.9c2.3 0 3.8 1.6 3.8 3.4 0 1.6-1.3 2.6-2.7 2.6-.7 0-.9-.2-1.4-.2s-.8.2-1.4.2c-1.4 0-2.7-1-2.7-2.6 0-1.8 1.5-3.4 3.8-3.4z';
const TOES: Array<[number, number, number]> = [
  [20.3, 14.7, 1.45],
  [23.2, 13.4, 1.5],
  [26, 13.7, 1.4],
  [28.2, 15.9, 1.3],
];

export interface VadrouilleMarkProps {
  /** rendered square size in px. Below 24px the toes close up — switch to the -ink variant or
   * just the pin drop below that; never under 16px. */
  size?: number;
  /** the pin itself */
  color?: string;
  /** MUST equal the real surface colour behind the mark — the paw is a cutout */
  background?: string;
}

export function VadrouilleMark({ size = 48, color = '#FF6B4A', background = '#FFF7F0' }: VadrouilleMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <G scale={2}>
        <Path d={PIN} fill={color} />
      </G>
      {TOES.map(([cx, cy, r]) => (
        <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={background} />
      ))}
      <Path d={PAD} fill={background} />
    </Svg>
  );
}

export interface VadrouilleLockupProps extends VadrouilleMarkProps {
  /** stacked = mark above the word (splash, login). inline = side by side (a coloured header). */
  direction?: 'inline' | 'stacked';
  /** word colour; defaults to ink */
  wordColor?: string;
  markSize?: number;
  wordSize?: number;
}

export function VadrouilleLockup({
  direction = 'stacked',
  markSize = 76,
  wordSize = 38,
  color = '#FF6B4A',
  background = '#FFF7F0',
  wordColor,
}: VadrouilleLockupProps) {
  const stacked = direction === 'stacked';
  return (
    <View style={[styles.lockup, stacked ? styles.stacked : styles.inline, { gap: stacked ? markSize * 0.18 : markSize * 0.3 }]}>
      <VadrouilleMark size={markSize} color={color} background={background} />
      {/* Display (not a raw RN Text with a hand-picked fontFamily string): pairing a
       * Platform.select'd "Baloo2-ExtraBold" family with an explicit fontWeight made iOS
       * synthesize bold on top of the already-bold face and badly corrupt the glyphs — the
       * app's own $heading font resolves the same face without that trap, see Text.tsx. */}
      <Display fontSize={wordSize} lineHeight={wordSize * 1.15} color={(wordColor ?? '#2B2118') as any}>
        Vadrouille
      </Display>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { alignItems: 'center' },
  stacked: { flexDirection: 'column' },
  inline: { flexDirection: 'row' },
});
