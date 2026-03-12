// Theme constants for SpiceSync

export const COLORS = {
  // Primary brand colors
  primary: '#FF6B9D',
  primaryDark: '#E85A8C',
  primaryLight: '#FFB8D0',
  
  // Background colors
  background: '#0F0F1A',
  card: '#1A1A2E',
  surface: '#252542',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#B8B8C8',
  textMuted: '#6B6B7B',
  
  // UI colors
  border: '#2E2E4A',
  divider: '#3A3A5C',
  
  // Status colors
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  // Match status colors
  matchYes: '#4ADE80',
  matchMaybe: '#FBBF24',
  matchNo: '#F87171',
  
  // Gradient colors
  gradientStart: '#FF6B9D',
  gradientEnd: '#C44569',
};

export const SIZES = {
  // Typography
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  
  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Border radius
  radius: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  radiusXL: 24,
  
  // Component sizes
  buttonHeight: 56,
  inputHeight: 56,
  iconSize: 24,
  iconSizeLarge: 32,
  iconSizeSmall: 16,
};

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const SHADOWS = {
  small: {
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
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};
