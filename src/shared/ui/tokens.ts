import { createTokens } from 'tamagui';

/**
 * Vadrouille — Direction A "Ludique & coloré".
 * Raw values only. Never consume \palette\ directly in components:
 * use the semantic theme tokens ($background, $color, $accent…) from themes.ts.
 */
export const palette = {
  coral50: '#FFF0EB',
  coral100: '#FFD9CE',
  coral500: '#FF6B4A',
  coral600: '#E8542F',
  coral700: '#C8391A',

  amber50: '#FFF4DC',
  amber500: '#FFC145',
  amber600: '#E0A31F',
  amber700: '#9A6E00',

  teal50: '#E4F7F3',
  teal500: '#3FBFA8',
  teal600: '#2AA793',
  teal700: '#1F8878',

  cream50: '#FFFFFF',
  cream100: '#FFF7F0',
  cream200: '#F4EEE8',
  cream300: '#EADDD0',
  cream400: '#D9C7B5',

  brown400: '#A79A8D',
  brown500: '#8A7A6C',
  brown800: '#2B2118',

  night900: '#1B1218',
  night800: '#251A21',
  night700: '#2F2029',
  night600: '#3B2A34',
  night500: '#5A4450',
  sand200: '#F7EDE4',
  sand400: '#B5A08F',
} as const;

export const tokens = createTokens({
  color: palette,

  /** 4pt base. space.4 = 16 is the default gutter inside cards. */
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
    9: 56,
    true: 16,
  },

  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    /** minimum touch target — never go below this on a pressable */
    tap: 44,
    avatarSm: 26,
    avatarMd: 34,
    avatarLg: 52,
    dogSm: 40,
    dogMd: 56,
    dogLg: 70,
    control: 52,
    true: 16,
  },

  radius: {
    0: 0,
    1: 8,
    2: 12,
    3: 18,
    4: 22,
    /** cards */
    5: 26,
    /** pills, avatars */
    round: 999,
    true: 18,
  },

  zIndex: { 0: 0, 1: 100, sheet: 300, modal: 400 },
});
