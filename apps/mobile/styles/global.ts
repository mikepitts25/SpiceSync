import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../app/constants/theme';

export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Card styles
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardElevated: {
    backgroundColor: COLORS.cardElevated,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding * 1.5,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  
  // Text styles
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
  },
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.h3,
    color: COLORS.textSecondary,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.text,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
  },
  
  // Button styles
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  buttonPrimaryText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.background,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: SIZES.padding * 1.5,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  
  // Input styles
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
  },
  
  // Utility styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gapSmall: {
    gap: SIZES.padding / 2,
  },
  gapMedium: {
    gap: SIZES.padding,
  },
  gapLarge: {
    gap: SIZES.padding * 2,
  },
});
