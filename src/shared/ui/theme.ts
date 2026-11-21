/**
 * Design tokens. All text colours meet WCAG AA (>= 4.5:1) on `background` and `surface`.
 * Light theme only for v1.
 */
export const colors = {
  primary: '#1B6B4A',
  primaryPressed: '#14533A',
  onPrimary: '#FFFFFF',
  primarySoft: '#E3F1EA',

  background: '#F7F8F6',
  surface: '#FFFFFF',
  border: '#D5DAD6',

  text: '#1C2421',
  textMuted: '#4F5B56',
  textInverse: '#FFFFFF',

  good: '#1E6B35',
  goodSoft: '#E1F2E5',
  limit: '#7A4E00',
  limitSoft: '#FBEFD9',
  avoid: '#A8231B',
  avoidSoft: '#FBE3E1',

  danger: '#A8231B',
  focus: '#0B5CAD',
  chartLine: '#1B6B4A',
  chartBand: 'rgba(27, 107, 74, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  caption: 13,
  body: 16,
  bodyLarge: 18,
  heading: 20,
  title: 26,
} as const;

export const lineHeight = {
  caption: 18,
  body: 24,
  bodyLarge: 26,
  heading: 28,
  title: 34,
} as const;

/** Minimum touch target (dp). */
export const MIN_TOUCH = 48;

export const fonts = {
  en: { regular: 'NotoSans-Regular', medium: 'NotoSans-Medium', bold: 'NotoSans-Bold' },
  hi: {
    regular: 'NotoSansDevanagari-Regular',
    medium: 'NotoSansDevanagari-Medium',
    bold: 'NotoSansDevanagari-Bold',
  },
} as const;

export type FontWeightName = keyof (typeof fonts)['en'];
