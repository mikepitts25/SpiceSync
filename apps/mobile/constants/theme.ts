// apps/mobile/app/constants/theme.ts
// Complete visual overhaul - Modern, sexy, fun design system

export const COLORS = {
  // Base
  background: '#0D0D15',
  backgroundSecondary: '#151520',
  card: '#1E1E2E',
  cardElevated: '#252538',
  
  // Accents - Vibrant gradient-ready colors
  primary: '#FF2D92',        // Hot pink
  primaryLight: '#FF6B9D',
  secondary: '#8B5CF6',      // Purple
  accent: '#00D9FF',         // Cyan
  
  // Tier colors - Gradient pairs
  soft: {
    start: '#FF6B9D',
    end: '#C084FC',
    glow: 'rgba(255, 107, 157, 0.4)',
  },
  naughty: {
    start: '#F472B6',
    end: '#EF4444',
    glow: 'rgba(244, 114, 182, 0.4)',
  },
  xxx: {
    start: '#EF4444',
    end: '#DC2626',
    glow: 'rgba(239, 68, 68, 0.4)',
  },
  
  // Actions
  yes: '#22C55E',
  yesGlow: 'rgba(34, 197, 94, 0.5)',
  no: '#EF4444',
  noGlow: 'rgba(239, 68, 68, 0.5)',
  maybe: '#F59E0B',
  maybeGlow: 'rgba(245, 158, 11, 0.5)',
  
  // Legacy action colors (for backward compatibility)
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  
  // Text
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  
  // UI
  border: 'rgba(255, 255, 255, 0.1)',
  borderHover: 'rgba(255, 255, 255, 0.2)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const GRADIENTS = {
  background: ['#0D0D15', '#151520', '#1A1A2E'],
  card: ['#1E1E2E', '#252538'],
  soft: ['#FF6B9D', '#C084FC'],
  naughty: ['#F472B6', '#EF4444'],
  xxx: ['#EF4444', '#DC2626'],
  primary: ['#FF2D92', '#FF6B9D'],
  button: ['#FF2D92', '#FF6B9D'],
  buttonPressed: ['#E11D84', '#FF5A8F'],
};

export const FONTS = {
  // Modern, clean font stack
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
  
  // Display font for headers (more playful)
  display: 'SpaceGrotesk-Bold',
};

export const SIZES = {
  // Base
  base: 8,
  
  // Typography
  xs: 12,
  small: 14,
  body: 16,
  medium: 18,
  large: 20,
  h4: 22,
  h3: 24,
  h2: 28,
  h1: 36,
  display: 48,
  
  // Spacing
  padding: 16,
  paddingLarge: 24,
  
  // Radius
  radius: 12,
  radiusLarge: 20,
  radiusXL: 28,
  radiusFull: 9999,
  
  // Legacy (for backward compatibility)
  caption: 12,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  }),
};

export const ANIMATIONS = {
  // Timing
  fast: 150,
  normal: 300,
  slow: 500,
  
  // Spring configs
  spring: {
    damping: 15,
    stiffness: 150,
  },
  bouncy: {
    damping: 10,
    stiffness: 200,
  },
};
