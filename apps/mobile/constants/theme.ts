// SpiceSync Design System
// New brand identity: Sophisticated, sensual, modern

const { width: SCREEN_WIDTH } = require('react-native').Dimensions.get('window');

export const COLORS = {
  // Primary brand colors
  primary: '#FF6B6B',      // Coral/orange - passion
  primaryLight: '#FF8E8E',
  primaryDark: '#E85555',
  
  // Secondary accent
  secondary: '#9B59B6',    // Purple - luxury
  secondaryLight: '#B07CC6',
  secondaryDark: '#8E44AD',
  
  // Background colors
  background: '#0B0B0E',   // Deep black
  card: '#151521',         // Dark card
  cardElevated: '#1E1E2E',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#6B6B7B',
  
  // Semantic colors
  success: '#2ECC71',
  warning: '#F39C12',
  danger: '#E74C3C',
  info: '#3498DB',
  
  // UI elements
  border: '#2A2A3A',
  borderLight: '#3A3A4A',
  
  // Gradients
  gradientPrimary: ['#FF6B6B', '#FF8E8E'],
  gradientSecondary: ['#9B59B6', '#B07CC6'],
  gradientBackground: ['#0B0B0E', '#151521'],
};

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

export const SIZES = {
  // Text sizes
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  small: 14,
  caption: 12,
  
  // Spacing
  padding: 16,
  margin: 16,
  
  // Border radius
  radius: 12,
  radiusLarge: 20,
  radiusFull: 999,
  
  // Layout
  maxWidth: 400,
  cardWidth: SCREEN_WIDTH - 32,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 6.27,
    elevation: 8,
  },
};

// Animation presets
export const ANIMATIONS = {
  spring: {
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  },
  fadeIn: {
    duration: 300,
    useNativeDriver: true,
  },
  slideUp: {
    duration: 400,
    useNativeDriver: true,
  },
};

// Swipe thresholds
export const SWIPE = {
  threshold: 120,
  velocity: 500,
};
