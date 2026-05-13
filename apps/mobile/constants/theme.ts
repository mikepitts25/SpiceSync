export const COLORS = {
  bg: '#0D0006',
  card: '#120008',
  cardAlt: '#1A080E',
  uiDark: '#1E1E2E',
  tabBar: '#1A0810',

  pink: '#FF2D92',
  crimson: '#C2185B',
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',

  yes: '#22C55E',
  no: '#EF4444',
  maybe: '#F59E0B',

  textPrimary: '#FFFFFF',
  textSub: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.25)',
  border: 'rgba(194,24,91,0.33)',
  borderFaint: 'rgba(255,255,255,0.063)',

  // Backward-compatible aliases used by older screens.
  background: '#0D0006',
  backgroundSecondary: '#1A080E',
  cardElevated: '#1A080E',
  surface: '#1A080E',
  primary: '#FF2D92',
  primaryLight: '#FF6B9D',
  secondary: '#8B5CF6',
  accent: '#A78BFA',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.5)',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#A78BFA',
  divider: 'rgba(255,255,255,0.063)',
  borderHover: 'rgba(194,24,91,0.45)',
  overlay: 'rgba(0,0,0,0.7)',
  yesGlow: 'rgba(34,197,94,0.5)',
  noGlow: 'rgba(239,68,68,0.5)',
  maybeGlow: 'rgba(245,158,11,0.5)',
  matchYes: '#22C55E',
  matchMaybe: '#F59E0B',
  matchNo: '#EF4444',
  gradientStart: '#C2185B',
  gradientEnd: '#FF2D92',

  soft: {
    start: '#FF2D92',
    end: '#8B5CF6',
    glow: 'rgba(255,45,146,0.4)',
  },
  naughty: {
    start: '#A78BFA',
    end: '#8B5CF6',
    glow: 'rgba(139,92,246,0.4)',
  },
  xxx: {
    start: '#EF4444',
    end: '#C2185B',
    glow: 'rgba(239,68,68,0.4)',
  },
} as const;

export type GradientTuple = readonly [string, string, ...string[]];

export const GRADIENTS = {
  primary: ['#C2185B', '#FF2D92'] as GradientTuple,
  primaryGradient: ['#C2185B', '#FF2D92'] as GradientTuple,
  purple: ['#A78BFA', '#8B5CF6'] as GradientTuple,
  purpleGradient: ['#A78BFA', '#8B5CF6'] as GradientTuple,
  cardAccentBar: ['#C2185B', '#FF2D92', '#FF4500'] as GradientTuple,
  accentBar: ['#C2185B', '#FF6B00'] as GradientTuple,

  // Backward-compatible aliases.
  background: ['#0D0006', '#120008', '#1A080E'] as GradientTuple,
  card: ['#120008', '#1A080E'] as GradientTuple,
  soft: ['#FF2D92', '#8B5CF6'] as GradientTuple,
  naughty: ['#A78BFA', '#8B5CF6'] as GradientTuple,
  xxx: ['#EF4444', '#C2185B'] as GradientTuple,
  button: ['#C2185B', '#FF2D92'] as GradientTuple,
  buttonPressed: ['#A7134B', '#E32783'] as GradientTuple,
} as const;

export const TYPOGRAPHY = {
  headingLarge: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
  },
  headingMedium: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: COLORS.textSub,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
  },
  subtext: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.7,
  },
} as const;

export const RADII = {
  screen: 44,
  card: 24,
  tabBar: 32,
  activeTab: 26,
  pill: 20,
  row: 16,
  iconBadge: 17,
} as const;

export const SPACING = {
  screenX: 16,
  contentTop: 10,
  contentBottom: 8,
} as const;

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
  display: 'Inter-ExtraBold',

  h1: {
    fontSize: 34,
    fontWeight: '800' as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  body: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
};

export const SIZES = {
  base: 8,
  xs: 10,
  small: 12,
  body: 13,
  medium: 18,
  large: 20,
  h4: 22,
  h3: 24,
  h2: 28,
  h1: 34,
  display: 48,
  caption: 11,
  maxWidth: 420,
  padding: 16,
  paddingLarge: 24,
  radius: 12,
  radiusMedium: 16,
  radiusLarge: 20,
  radiusXL: 24,
  radiusFull: 9999,
  buttonHeight: 56,
  inputHeight: 56,
  iconSize: 24,
  iconSizeLarge: 32,
  iconSizeSmall: 16,
};

export const SHADOWS = {
  card: {
    shadowColor: COLORS.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 8,
  },
  secondary: {
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  small: {
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sm: {
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: COLORS.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 8,
  },
  md: {
    shadowColor: COLORS.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 8,
  },
  large: {
    shadowColor: COLORS.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 8,
  },
  lg: {
    shadowColor: COLORS.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  }),
} as const;

export const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
  },
  bouncy: {
    damping: 10,
    stiffness: 200,
  },
} as const;
