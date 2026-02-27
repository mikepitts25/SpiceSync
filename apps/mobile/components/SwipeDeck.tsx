// apps/mobile/components/SwipeDeck.tsx
import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { COLORS, FONTS, SIZES, SHADOWS } from '../app/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = Math.min(Math.max(SCREEN_W * 0.85, 300), 400);
const CARD_H = Math.min(Math.max(SCREEN_H * 0.6, 400), 600);
const OFFSCREEN_X = SCREEN_W * 1.4;
const OFFSCREEN_Y = SCREEN_H * 1.2;

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

const TIMING_CONFIG = {
  duration: 250,
  easing: Easing.out(Easing.cubic),
};

// Category colors for visual differentiation
const CATEGORY_COLORS: Record<string, string> = {
  romance: '#FF6B9D',
  adventure: '#4ECDC4',
  sensual: '#9B59B6',
  fantasy: '#E74C3C',
  roleplay: '#3498DB',
  bdsm: '#2C3E50',
  public: '#F39C12',
  quickie: '#1ABC9C',
  default: COLORS.primary,
};

// Intensity level indicators
const INTENSITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Beginner', color: '#2ECC71' },
  2: { label: 'Easy', color: '#27AE60' },
  3: { label: 'Moderate', color: '#F39C12' },
  4: { label: 'Advanced', color: '#E67E22' },
  5: { label: 'Expert', color: '#E74C3C' },
};

const SwipeDeck = forwardRef<SwipeDeckHandle, Props>(
  ({ item, onSwipe, onUndo, onSwipeStart, onSwipeEnd, currentIndex = 0, totalCount = 0 }, ref) => {
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const gone = useSharedValue(false);
    const animating = useSharedValue(false);

    const thresholdX = 100;
    const thresholdY = 80;

    // Animated style with rotation and overlay
    const style = useAnimatedStyle(() => {
      const rotate = (x.value / 20).toFixed(2);
      const opacity = interpolate(
        Math.abs(x.value),
        [0, SCREEN_W * 0.5],
        [1, 0.8],
        Extrapolate.CLAMP
      );
      
      return {
        transform: [
          { translateX: x.value },
          { translateY: y.value },
          { rotate: `${rotate}deg` },
        ],
        opacity: gone.value ? withTiming(0) : opacity,
      };
    });

    // Swipe overlay indicators
    const likeOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        x.value,
        [0, 100],
        [0, 1],
        Extrapolate.CLAMP
      ),
    }));

    const dislikeOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        x.value,
        [0, -100],
        [0, 1],
        Extrapolate.CLAMP
      ),
    }));

    const performSwipe = (dir: SwipeDirection) => {
      'worklet';
      const targetX =
        dir === 'right' ? OFFSCREEN_X : dir === 'left' ? -OFFSCREEN_X : 0;
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
        y.value = withTiming(targetY, TIMING_CONFIG, finish);
        x.value = withTiming(targetX, TIMING_CONFIG);
      } else {
        x.value = withTiming(targetX, TIMING_CONFIG, finish);
        y.value = withTiming(targetY, TIMING_CONFIG);
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
        x.value = withSpring(0, { damping: 15, stiffness: 150 });
        y.value = withSpring(0, { damping: 15, stiffness: 150 });
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
        <View style={[styles.card, styles.emptyCard, { width: CARD_W, height: CARD_H }]}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptyText}>
            You've reviewed all activities.{'\n'}Check back later for new additions!
          </Text>
        </View>
      );
    }

    const categoryColor = CATEGORY_COLORS[item.category?.toLowerCase()] || CATEGORY_COLORS.default;
    const intensity = item.intensityScale || 1;
    const intensityInfo = INTENSITY_LABELS[intensity] || INTENSITY_LABELS[1];

    return (
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
        <Animated.View style={[styles.card, { width: CARD_W, height: CARD_H }, style]}>
          {/* Category Indicator */}
          <View style={[styles.categoryStrip, { backgroundColor: categoryColor }]} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {item.category || 'Activity'}
              </Text>
            </View>
            {totalCount > 0 && (
              <Text style={styles.progressText}>
                {currentIndex + 1} / {totalCount}
              </Text>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{String(item.title || '')}</Text>

          {/* Description */}
          {!!item.description && (
            <ScrollView style={styles.descriptionScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.desc}>{item.description}</Text>
            </ScrollView>
          )}

          {/* Intensity Indicator */}
          <View style={styles.intensityContainer}>
            <Text style={styles.intensityLabel}>Intensity</Text>
            <View style={styles.intensityRow}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.intensityDot,
                    level <= intensity && { backgroundColor: intensityInfo.color },
                  ]}
                />
              ))}
              <Text style={[styles.intensityText, { color: intensityInfo.color }]}>
                {intensityInfo.label}
              </Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            {!!item.tier && item.tier !== 'free' && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>💎 Premium</Text>
              </View>
            )}
            {!!item.estimatedTime && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>⏱️ {item.estimatedTime}</Text>
              </View>
            )}
          </View>

          {/* Swipe Hints */}
          <View style={styles.hintContainer}>
            <View style={styles.hintItem}>
              <Text style={styles.hintIcon}>👎</Text>
              <Text style={styles.hintText}>No</Text>
            </View>
            <View style={styles.hintItem}>
              <Text style={styles.hintIcon}>🤔</Text>
              <Text style={styles.hintText}>Maybe</Text>
            </View>
            <View style={styles.hintItem}>
              <Text style={styles.hintIcon}>👍</Text>
              <Text style={styles.hintText}>Yes</Text>
            </View>
          </View>

          {/* Swipe Overlays */}
          <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
            <Text style={styles.overlayText}>YES!</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.dislikeOverlay, dislikeOpacity]}>
            <Text style={styles.overlayText}>NO</Text>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    );
  }
);

export default SwipeDeck;

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    borderRadius: SIZES.radiusLarge,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.padding * 1.5,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  
  // Category strip at top
  categoryStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
    marginTop: SIZES.padding / 2,
  },
  categoryBadge: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
  },
  categoryText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.small,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  
  // Title
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding,
    lineHeight: 32,
  },
  
  // Description
  descriptionScroll: {
    flex: 1,
    marginBottom: SIZES.padding,
  },
  desc: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  
  // Intensity
  intensityContainer: {
    marginBottom: SIZES.padding,
  },
  intensityLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  intensityText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.small,
    marginLeft: 8,
  },
  
  // Meta
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SIZES.padding,
    flexWrap: 'wrap',
  },
  metaBadge: {
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  
  // Hints
  hintContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hintItem: {
    alignItems: 'center',
    gap: 4,
  },
  hintIcon: {
    fontSize: 20,
  },
  hintText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
  },
  
  // Overlays
  overlay: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    borderWidth: 4,
    transform: [{ rotate: '-15deg' }],
  },
  likeOverlay: {
    right: 20,
    backgroundColor: `${COLORS.success}20`,
    borderColor: COLORS.success,
  },
  dislikeOverlay: {
    left: 20,
    backgroundColor: `${COLORS.danger}20`,
    borderColor: COLORS.danger,
  },
  overlayText: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.text,
    letterSpacing: 2,
  },
  
  // Empty state
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: SIZES.padding,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
