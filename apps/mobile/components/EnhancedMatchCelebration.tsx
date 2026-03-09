// Enhanced Match Celebration with Confetti Cannon
// Uses react-native-confetti-cannon for celebration effects

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';
import { useStreakStore } from '../lib/achievements';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface MatchCelebrationProps {
  visible: boolean;
  activityTitle: string;
  activityCategory?: string;
  onClose: () => void;
  onAddToFavorites?: () => void;
  onDiscuss?: () => void;
  onContinue?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  adventure: '#4ECDC4',
  sensual: '#9B59B6',
  fantasy: '#E74C3C',
  playful: '#F39C12',
  bdsm: '#2C3E50',
  public: '#1ABC9C',
  quickie: '#E67E22',
  communication: '#3498DB',
  sensory: '#9B59B6',
  roleplay: '#E91E63',
};

export default function EnhancedMatchCelebration({
  visible,
  activityTitle,
  activityCategory,
  onClose,
  onAddToFavorites,
  onDiscuss,
  onContinue,
}: MatchCelebrationProps) {
  const scaleAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);
  const confettiRef = useRef<ConfettiCannon>(null);
  const { match, achievement } = useHaptics();
  const { recordMatch } = useStreakStore();
  
  // Record the match for achievements
  useEffect(() => {
    if (visible) {
      recordMatch();
    }
  }, [visible, recordMatch]);
  
  // Trigger haptic and animation when visible
  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      match();
      
      // Animate in
      opacityAnim.value = withTiming(1, { duration: 200 });
      scaleAnim.value = withDelay(
        100,
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      
      // Trigger achievement haptic after a delay
      const timer = setTimeout(() => {
        achievement();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      opacityAnim.value = 0;
      scaleAnim.value = 0;
    }
  }, [visible, match, achievement, opacityAnim, scaleAnim]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: opacityAnim.value,
  }));
  
  const handleClose = useCallback(() => {
    opacityAnim.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(onClose)();
    });
  }, [onClose, opacityAnim]);
  
  const categoryColor = activityCategory 
    ? CATEGORY_COLORS[activityCategory] || COLORS.primary
    : COLORS.primary;
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Confetti Cannon */}
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: SCREEN_W / 2, y: -50 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={350}
          fallSpeed={2500}
          colors={[
            COLORS.primary,
            COLORS.secondary,
            '#FFD700',
            '#FF6B9D',
            '#4ECDC4',
            categoryColor,
          ]}
        />
        
        {/* Content */}
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Sparkles */}
          <View style={styles.sparkles}>
            <Text style={styles.sparkleIcon}>✨</Text>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>It's a Match!</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>You both want to try this</Text>
          
          {/* Activity Card */}
          <View style={[styles.activityCard, { borderColor: categoryColor }]}>
            {activityCategory && (
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {activityCategory}
                </Text>
              </View>
            )}
            <Text style={styles.activityTitle}>{activityTitle}</Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onAddToFavorites && (
              <AnimatedButton
                emoji="⭐"
                title="Add to Favorites"
                variant="outline"
                onPress={onAddToFavorites}
                style={styles.actionButton}
              />
            )}
            
            {onDiscuss && (
              <AnimatedButton
                emoji="💬"
                title="Discuss"
                variant="secondary"
                onPress={onDiscuss}
                style={styles.actionButton}
              />
            )}
            
            {onContinue && (
              <AnimatedButton
                title="Continue Exploring"
                variant="primary"
                onPress={onContinue}
                style={styles.continueButton}
              />
            )}
            
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Simple animated button for this component
function AnimatedButton({
  emoji,
  title,
  variant,
  onPress,
  style,
}: {
  emoji?: string;
  title: string;
  variant: 'primary' | 'secondary' | 'outline';
  onPress: () => void;
  style?: any;
}) {
  const scale = useSharedValue(1);
  const { buttonPress } = useHaptics();
  
  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    buttonPress();
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const backgroundColor = {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    outline: 'transparent',
  }[variant];
  
  const textColor = variant === 'outline' ? COLORS.text : '#fff';
  const borderWidth = variant === 'outline' ? 2 : 0;
  const borderColor = variant === 'outline' ? COLORS.border : 'transparent';
  
  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor,
            borderWidth,
            borderColor,
          },
          animatedStyle,
          style,
        ]}
      >
        {emoji && <Text style={styles.buttonEmoji}>{emoji}</Text>}
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: SCREEN_W * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    zIndex: 10,
  },
  sparkles: {
    marginBottom: SIZES.padding,
  },
  sparkleIcon: {
    fontSize: 60,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.primary,
    marginBottom: SIZES.padding / 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding * 2,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding * 2,
    width: '100%',
    marginBottom: SIZES.padding * 2,
    borderWidth: 2,
    ...SHADOWS.lg,
  },
  categoryBadge: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
    alignSelf: 'flex-start',
    marginBottom: SIZES.padding,
  },
  categoryText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.small,
    textTransform: 'uppercase',
  },
  activityTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: SIZES.padding,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: 8,
    ...SHADOWS.sm,
  },
  buttonEmoji: {
    fontSize: 18,
  },
  buttonText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.body,
  },
  closeButton: {
    paddingVertical: SIZES.padding,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textMuted,
  },
});
