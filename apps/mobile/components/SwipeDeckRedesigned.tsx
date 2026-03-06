// apps/mobile/components/SwipeDeckRedesigned.tsx
// Complete visual overhaul with animations, gradients, and modern design

import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  interpolateColor,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
// import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, FONTS, SIZES, SHADOWS, ANIMATIONS } from '../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W * 0.9, 420);
const CARD_H = Math.min(SCREEN_H * 0.65, 680);
const OFFSCREEN_X = SCREEN_W * 1.5;
const OFFSCREEN_Y = SCREEN_H * 1.3;

export type SwipeDirection = 'left' | 'right' | 'down';

export type SwipeDeckHandle = {
  programmaticSwipe: (dir: SwipeDirection) => void;
  isAnimating: () => boolean;
};

type Props = {
  item: any | null;
  onSwipe: (dir: SwipeDirection) => void;
  onUndo: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  currentIndex?: number;
  totalCount?: number;
};

const TIER_GRADIENTS: Record<string, string[]> = {
  soft: GRADIENTS.soft,
  naughty: GRADIENTS.naughty,
  xxx: GRADIENTS.xxx,
};

const TIER_ICONS: Record<string, string> = {
  soft: '💜',
  naughty: '🔥',
  xxx: '❌',
};

const SwipeDeck = forwardRef<SwipeDeckHandle, Props>(
  ({ item, onSwipe, onUndo, onSwipeStart, onSwipeEnd, currentIndex = 0, totalCount = 0 }, ref) => {
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const gone = useSharedValue(false);
    const animating = useSharedValue(false);

    const thresholdX = 120;
    const thresholdY = 100;

    // Main card animation style
    const animatedStyle = useAnimatedStyle(() => {
      const rotate = (x.value / 25).toFixed(2);
      const scale = interpolate(
        Math.abs(x.value) + Math.abs(y.value),
        [0, 200],
        [1, 0.95],
        Extrapolate.CLAMP
      );
      
      return {
        transform: [
          { translateX: x.value },
          { translateY: y.value },
          { rotate: `${rotate}deg` },
          { scale },
        ],
      };
    });

    // YES overlay (right swipe)
    const yesOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        x.value,
        [0, 80, 150],
        [0, 0.8, 1],
        Extrapolate.CLAMP
      ),
      transform: [
        { scale: interpolate(x.value, [0, 150], [0.8, 1], Extrapolate.CLAMP) },
        { rotate: interpolate(x.value, [0, 150], [0, 15], Extrapolate.CLAMP) + 'deg' },
      ],
    }));

    // NO overlay (left swipe)
    const noOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        x.value,
        [0, -80, -150],
        [0, 0.8, 1],
        Extrapolate.CLAMP
      ),
      transform: [
        { scale: interpolate(x.value, [0, -150], [0.8, 1], Extrapolate.CLAMP) },
        { rotate: interpolate(x.value, [0, -150], [0, -15], Extrapolate.CLAMP) + 'deg' },
      ],
    }));

    // MAYBE overlay (down swipe) - NEW!
    const maybeOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        y.value,
        [0, 80, 150],
        [0, 0.8, 1],
        Extrapolate.CLAMP
      ),
      transform: [
        { scale: interpolate(y.value, [0, 150], [0.8, 1], Extrapolate.CLAMP) },
        { translateY: interpolate(y.value, [0, 150], [0, 50], Extrapolate.CLAMP) },
      ],
    }));

    // Background color interpolation based on swipe
    const bgStyle = useAnimatedStyle(() => {
      const color = interpolateColor(
        x.value,
        [-150, 0, 150],
        [COLORS.no, COLORS.card, COLORS.yes]
      );
      return {
        backgroundColor: interpolateColor(
          x.value,
          [-150, 0, 150],
          ['rgba(239, 68, 68, 0.2)', COLORS.card, 'rgba(34, 197, 94, 0.2)']
        ),
      };
    });

    const performSwipe = (dir: SwipeDirection) => {
      'worklet';
      const targetX = dir === 'right' ? OFFSCREEN_X : dir === 'left' ? -OFFSCREEN_X : 0;
      const targetY = dir === 'down' ? OFFSCREEN_Y : 0;

      gone.value = true;

      const finish = (finished?: boolean) => {
        'worklet';
        if (!finished) {
          animating.value = false;
          gone.value = false;
          if (onSwipeEnd) runOnJS(onSwipeEnd)();
          return;
        }

        x.value = 0;
        y.value = 0;
        gone.value = false;
        animating.value = false;
        if (onSwipeEnd) runOnJS(onSwipeEnd)();
        runOnJS(onSwipe)(dir);
      };

      if (targetY !== 0) {
        y.value = withTiming(targetY, { duration: 300, easing: Easing.out(Easing.cubic) }, finish);
        x.value = withTiming(targetX, { duration: 300, easing: Easing.out(Easing.cubic) });
      } else {
        x.value = withTiming(targetX, { duration: 300, easing: Easing.out(Easing.cubic) }, finish);
        y.value = withTiming(targetY, { duration: 300, easing: Easing.out(Easing.cubic) });
      }
    };

    const triggerSwipe = (dir: SwipeDirection) => {
      if (!item) return;
      if (animating.value) return;
      animating.value = true;
      onSwipeStart?.();
      performSwipe(dir);
    };

    const handleEnd = (dx: number, dy: number) => {
      'worklet';
      let dir: SwipeDirection | null = null;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > thresholdX) dir = 'right';
        else if (dx < -thresholdX) dir = 'left';
      } else {
        if (dy > thresholdY) dir = 'down';
      }

      if (dir) {
        runOnJS(triggerSwipe)(dir);
      } else {
        x.value = withSpring(0, ANIMATIONS.spring);
        y.value = withSpring(0, ANIMATIONS.spring);
      }
    };

    useImperativeHandle(ref, () => ({
      programmaticSwipe: (dir: SwipeDirection) => {
        triggerSwipe(dir);
      },
      isAnimating: () => animating.value,
    }));

    if (!item) {
      return (
        <View style={[styles.emptyCard, { width: CARD_W, height: CARD_H }]}>
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.emptyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>
              You've reviewed all activities.{'\n'}Check back later for new additions!
            </Text>
          </LinearGradient>
        </View>
      );
    }

    const tierGradient = TIER_GRADIENTS[item.tier] || GRADIENTS.soft;
    const tierIcon = TIER_ICONS[item.tier] || '💜';
    const intensity = item.intensityScale || 1;

    return (
      <View style={styles.container}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: `${((currentIndex + 1) / totalCount) * 100}%`,
                  backgroundColor: tierGradient[0],
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} <Text style={styles.progressTotal}>/ {totalCount}</Text>
          </Text>
        </View>

        <PanGestureHandler
          onGestureEvent={(e) => {
            const { translationX, translationY } = e.nativeEvent;
            x.value = translationX;
            y.value = translationY;
          }}
          onEnded={(e) => {
            const translationX = (e.nativeEvent as any).translationX ?? 0;
            const translationY = (e.nativeEvent as any).translationY ?? 0;
            handleEnd(translationX, translationY);
          }}
        >
          <Animated.View style={[styles.cardContainer, animatedStyle]}>
            <Animated.View style={[styles.card, bgStyle]}>
              {/* Tier badge */}
              <View style={styles.tierBadge}>
                <LinearGradient
                  colors={tierGradient}
                  style={styles.tierGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.tierIcon}>{tierIcon}</Text>
                  <Text style={styles.tierText}>{item.tier?.toUpperCase()}</Text>
                </LinearGradient>
              </View>

              {/* Category tag */}
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryText}>
                  {item.category?.toUpperCase()}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{item.title}</Text>

              {/* Description */}
              <Text style={styles.description} numberOfLines={4}>
                {item.description}
              </Text>

              {/* Intensity meter */}
              <View style={styles.intensityContainer}>
                <Text style={styles.intensityLabel}>Intensity</Text>
                <View style={styles.intensityBar}>
                  {[1, 2, 3].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.intensitySegment,
                        level <= intensity && { 
                          backgroundColor: tierGradient[0],
                          shadowColor: tierGradient[0],
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 8,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.slice(0, 3).map((tag: string, idx: number) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>

            {/* Swipe Overlays */}
            <Animated.View style={[styles.overlay, styles.yesOverlay, yesOpacity]}>
              <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.overlayGradient}>
                <Text style={styles.overlayEmoji}>👍</Text>
                <Text style={styles.overlayText}>YES!</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={[styles.overlay, styles.noOverlay, noOpacity]}>
              <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.overlayGradient}>
                <Text style={styles.overlayEmoji}>👎</Text>
                <Text style={styles.overlayText}>NO</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={[styles.overlay, styles.maybeOverlay, maybeOpacity]}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.overlayGradient}>
                <Text style={styles.overlayEmoji}>🤔</Text>
                <Text style={styles.overlayText}>MAYBE</Text>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <ActionButton 
            emoji="✕" 
            color={COLORS.no} 
            glow={COLORS.noGlow}
            onPress={() => triggerSwipe('left')}
          />
          <ActionButton 
            emoji="🤔" 
            color={COLORS.maybe} 
            glow={COLORS.maybeGlow}
            onPress={() => triggerSwipe('down')}
          />
          <ActionButton 
            emoji="♥" 
            color={COLORS.yes} 
            glow={COLORS.yesGlow}
            onPress={() => triggerSwipe('right')}
          />
        </View>

        {/* Swipe hints */}
        <View style={styles.hintsContainer}>
          <SwipeHint emoji="👈" text="No" />
          <SwipeHint emoji="👇" text="Maybe" />
          <SwipeHint emoji="👉" text="Yes" />
        </View>
      </View>
    );
  }
);

// Action Button Component
function ActionButton({ emoji, color, glow, onPress }: { 
  emoji: string; 
  color: string; 
  glow: string;
  onPress: () => void;
}) {
  return (
    <View style={[styles.buttonOuter, { shadowColor: color }]}>
      <View style={[styles.button, { borderColor: color }]}>
        <Text style={[styles.buttonEmoji, { color }]}>{emoji}</Text>
      </View>
    </View>
  );
}

// Swipe Hint Component
function SwipeHint({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.hint}>
      <Text style={styles.hintEmoji}>{emoji}</Text>
      <Text style={styles.hintText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Progress
  progressContainer: {
    width: CARD_W,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: COLORS.text,
    fontSize: SIZES.small,
    fontWeight: '700',
  },
  progressTotal: {
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  
  // Card
  cardContainer: {
    width: CARD_W,
    height: CARD_H,
  },
  card: {
    flex: 1,
    borderRadius: SIZES.radiusXL,
    padding: SIZES.paddingLarge,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  
  // Tier badge
  tierBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  tierGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierIcon: {
    fontSize: 14,
  },
  tierText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  
  // Category
  categoryContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: SIZES.small,
    fontWeight: '700',
    letterSpacing: 2,
  },
  
  // Title
  title: {
    color: COLORS.text,
    fontSize: SIZES.h2,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 16,
  },
  
  // Description
  description: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    lineHeight: 24,
    flex: 1,
  },
  
  // Intensity
  intensityContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  intensityLabel: {
    color: COLORS.textMuted,
    fontSize: SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  intensityBar: {
    flexDirection: 'row',
    gap: 6,
  },
  intensitySegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusFull,
  },
  tagText: {
    color: COLORS.textMuted,
    fontSize: SIZES.xs,
  },
  
  // Overlays
  overlay: {
    position: 'absolute',
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
  },
  yesOverlay: {
    top: 40,
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
  noOverlay: {
    top: 40,
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  maybeOverlay: {
    bottom: 80,
    alignSelf: 'center',
    transform: [{ rotate: '0deg' }],
  },
  overlayGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  overlayEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  overlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  
  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 24,
  },
  buttonOuter: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonEmoji: {
    fontSize: 28,
  },
  
  // Hints
  hintsContainer: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 16,
  },
  hint: {
    alignItems: 'center',
  },
  hintEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: SIZES.xs,
    fontWeight: '600',
  },
  
  // Empty state
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGradient: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: SIZES.radiusXL,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.paddingLarge,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: SIZES.h2,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: SIZES.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SwipeDeck;
