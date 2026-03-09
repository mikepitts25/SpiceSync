// Animated Button with Press Effects
// Provides scale animation and haptic feedback on press

import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps {
  onPress: () => void;
  title?: string;
  emoji?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
}

export default function AnimatedButton({
  onPress,
  title,
  emoji,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  children,
  hapticType = 'selection',
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const { trigger } = useHaptics();
  
  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.95, { duration: 100 });
    trigger(hapticType);
  }, [scale, trigger, hapticType]);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);
  
  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      onPress();
    }
  }, [onPress, disabled, loading]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    (disabled || loading) && styles.disabled,
    animatedStyle,
    style,
  ];
  
  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];
  
  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={buttonStyles}
      disabled={disabled || loading}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={textStyles}>⏳</Text>
        </View>
      ) : (
        <>
          {emoji && <Text style={styles.emoji}>{emoji}</Text>}
          {title && <Text style={textStyles}>{title}</Text>}
          {children}
        </>
      )}
    </AnimatedPressable>
  );
}

// Icon button variant
interface IconButtonProps {
  onPress: () => void;
  emoji: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
}

export function IconButton({
  onPress,
  emoji,
  size = 'medium',
  variant = 'primary',
  disabled = false,
  style,
  hapticType = 'light',
}: IconButtonProps) {
  const scale = useSharedValue(1);
  const { trigger } = useHaptics();
  
  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.9, { duration: 80 });
    trigger(hapticType);
  }, [scale, trigger, hapticType]);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);
  
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress();
    }
  }, [onPress, disabled]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const sizeStyles = {
    small: { width: 40, height: 40, borderRadius: 20 },
    medium: { width: 56, height: 56, borderRadius: 28 },
    large: { width: 72, height: 72, borderRadius: 36 },
  };
  
  const emojiSizes = {
    small: 18,
    medium: 24,
    large: 32,
  };
  
  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.iconButton,
        styles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      disabled={disabled}
    >
      <Text style={{ fontSize: emojiSizes[size] }}>{emoji}</Text>
    </AnimatedPressable>
  );
}

// Vote buttons with enhanced animations
interface VoteButtonsProps {
  onVote: (vote: 'yes' | 'no' | 'maybe') => void;
  disabled?: boolean;
}

export function AnimatedVoteButtons({ onVote, disabled }: VoteButtonsProps) {
  return (
    <View style={styles.voteContainer}>
      <IconButton
        emoji="✕"
        variant="outline"
        size="large"
        onPress={() => onVote('no')}
        disabled={disabled}
        hapticType="light"
        style={{ borderColor: COLORS.no, backgroundColor: `${COLORS.no}15` }}
      />
      <IconButton
        emoji="?"
        variant="outline"
        size="medium"
        onPress={() => onVote('maybe')}
        disabled={disabled}
        hapticType="light"
        style={{ borderColor: COLORS.maybe, backgroundColor: `${COLORS.maybe}15` }}
      />
      <IconButton
        emoji="♥"
        variant="primary"
        size="large"
        onPress={() => onVote('yes')}
        disabled={disabled}
        hapticType="medium"
        style={{ backgroundColor: COLORS.yes }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius,
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  // Variants
  primary: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  danger: {
    backgroundColor: COLORS.no,
    borderWidth: 0,
  },
  success: {
    backgroundColor: COLORS.yes,
    borderWidth: 0,
  },
  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  // Text styles
  text: {
    fontFamily: FONTS.semiBold,
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: COLORS.text,
  },
  ghostText: {
    color: COLORS.text,
  },
  dangerText: {
    color: '#fff',
  },
  successText: {
    color: '#fff',
  },
  // Text sizes
  smallText: {
    fontSize: SIZES.small,
  },
  mediumText: {
    fontSize: SIZES.body,
  },
  largeText: {
    fontSize: SIZES.large,
  },
  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 18,
  },
  // Vote buttons
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
  },
});
