import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, GRADIENTS, RADII, SHADOWS } from '../../constants/theme';

export const GAME_CONTROL_MIN_SIZE = 44;

export function GameSurface({
  children,
  style,
  elevated = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}) {
  return (
    <View style={[styles.surface, elevated && styles.surfaceElevated, style]}>
      {children}
    </View>
  );
}

export function GamePill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'warning';
}) {
  return (
    <View style={[styles.pill, styles[`pill_${tone}`]]}>
      <Text
        numberOfLines={1}
        style={[styles.pillText, styles[`pillText_${tone}`]]}
      >
        {label}
      </Text>
    </View>
  );
}

export type GameSegmentOption<T extends string> = {
  value: T;
  label: string;
};

export function GameSegmentedControl<T extends string>({
  accessibilityLabel,
  value,
  options,
  onChange,
  compact = false,
}: {
  accessibilityLabel: string;
  value: T;
  options: readonly GameSegmentOption<T>[];
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.segmented, compact && styles.segmentedCompact]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${accessibilityLabel}: ${option.label}`}
            accessibilityState={{ selected }}
            hitSlop={
              compact ? { top: 4, bottom: 4, left: 2, right: 2 } : undefined
            }
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segmentOption,
              compact && styles.segmentOptionCompact,
              selected && styles.segmentOptionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                selected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function GameButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  compact = false,
  labelNumberOfLines,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  compact?: boolean;
  labelNumberOfLines?: number;
}) {
  const content = (
    <>
      {icon}
      <Text
        numberOfLines={labelNumberOfLines}
        style={[
          styles.buttonText,
          variant !== 'primary' && styles.buttonTextSecondary,
          compact && styles.buttonTextCompact,
        ]}
      >
        {label}
      </Text>
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonPress,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.buttonBody, compact && styles.buttonBodyCompact]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.buttonBody,
            compact && styles.buttonBodyCompact,
            styles.buttonSecondary,
            variant === 'danger' && styles.buttonDanger,
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.085)',
    backgroundColor: COLORS.cardAlt,
  },
  surfaceElevated: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    ...SHADOWS.card,
  },
  pill: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pill_neutral: {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pill_accent: {
    borderColor: 'rgba(255,45,146,0.36)',
    backgroundColor: 'rgba(255,45,146,0.16)',
  },
  pill_warning: {
    borderColor: 'rgba(245,158,11,0.36)',
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  pillText: { fontSize: 16, fontWeight: '800' },
  pillText_neutral: { color: COLORS.textSub },
  pillText_accent: { color: COLORS.pink },
  pillText_warning: { color: COLORS.maybe },
  segmented: {
    minHeight: GAME_CONTROL_MIN_SIZE,
    flexDirection: 'row',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  segmentedCompact: {
    width: 80,
    minHeight: 36,
    alignSelf: 'flex-end',
    borderRadius: 18,
  },
  segmentOption: {
    minWidth: GAME_CONTROL_MIN_SIZE,
    minHeight: GAME_CONTROL_MIN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  segmentOptionCompact: {
    minWidth: 40,
    minHeight: 36,
    paddingHorizontal: 8,
  },
  segmentOptionSelected: { backgroundColor: 'rgba(255,45,146,0.24)' },
  segmentText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '900' },
  segmentTextSelected: { color: COLORS.textPrimary },
  buttonPress: {
    minWidth: GAME_CONTROL_MIN_SIZE,
    minHeight: GAME_CONTROL_MIN_SIZE,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  buttonBody: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
    borderRadius: RADII.pill,
  },
  buttonBodyCompact: {
    minHeight: GAME_CONTROL_MIN_SIZE,
    paddingHorizontal: 12,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  buttonDanger: {
    borderColor: 'rgba(239,68,68,0.28)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  buttonText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900' },
  buttonTextSecondary: { color: COLORS.textSub },
  buttonTextCompact: {
    flexShrink: 1,
    fontSize: 16,
    textAlign: 'center',
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.42 },
});
