import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Confetti piece component
const ConfettiPiece = ({ color, delay, x, rotation }: { color: string; delay: number; x: number; rotation: number }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(x)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_H + 50,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: x + (Math.random() - 0.5) * 200,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: rotation,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 3000,
          delay: 2000,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
          opacity,
        },
      ]}
    />
  );
};

// Generate confetti
const generateConfetti = (count: number) => {
  const colors = [COLORS.primary, COLORS.secondary, '#FFD700', '#FF6B9D', '#4ECDC4'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    delay: Math.random() * 1000,
    x: Math.random() * SCREEN_W,
    rotation: Math.random(),
  }));
};

interface MatchCelebrationProps {
  visible: boolean;
  activityTitle: string;
  activityCategory?: string;
  onClose: () => void;
  onAddToFavorites?: () => void;
  onDiscuss?: () => void;
  onContinue?: () => void;
}

export default function MatchCelebration({
  visible,
  activityTitle,
  activityCategory,
  onClose,
  onAddToFavorites,
  onDiscuss,
  onContinue,
}: MatchCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confetti = useRef(generateConfetti(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Confetti */}
        {visible && confetti.map((piece) => (
          <ConfettiPiece
            key={piece.id}
            color={piece.color}
            delay={piece.delay}
            x={piece.x}
            rotation={piece.rotation}
          />
        ))}

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Sparkles */}
          <View style={styles.sparkles}>
            <Text style={styles.sparkleIcon}>✨</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>It's a Match!</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>You both want to try this</Text>

          {/* Activity Card */}
          <View style={styles.activityCard}>
            {activityCategory && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{activityCategory}</Text>
              </View>
            )}
            <Text style={styles.activityTitle}>{activityTitle}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {onAddToFavorites && (
              <Pressable
                style={[styles.button, styles.favoriteButton]}
                onPress={onAddToFavorites}
                accessibilityRole="button"
              >
                <Text style={styles.buttonIcon}>⭐</Text>
                <Text style={styles.buttonText}>Add to Favorites</Text>
              </Pressable>
            )}

            {onDiscuss && (
              <Pressable
                style={[styles.button, styles.discussButton]}
                onPress={onDiscuss}
                accessibilityRole="button"
              >
                <Text style={styles.buttonIcon}>💬</Text>
                <Text style={styles.buttonText}>Discuss</Text>
              </Pressable>
            )}

            {onContinue && (
              <Pressable
                style={[styles.button, styles.continueButton]}
                onPress={onContinue}
                accessibilityRole="button"
              >
                <Text style={styles.continueButtonText}>Continue Exploring</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    width: SCREEN_W * 0.9,
    maxWidth: 400,
    alignItems: 'center',
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
    borderColor: COLORS.primary,
    ...SHADOWS.large,
  },
  categoryBadge: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
    alignSelf: 'flex-start',
    marginBottom: SIZES.padding,
  },
  categoryText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.small,
    color: COLORS.primary,
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: 8,
    ...SHADOWS.small,
  },
  favoriteButton: {
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  discussButton: {
    backgroundColor: COLORS.secondary,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  continueButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.background,
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
