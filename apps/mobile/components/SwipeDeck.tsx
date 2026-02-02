// apps/mobile/components/SwipeDeck.tsx
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useSettings } from '../lib/state/useStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Make the card visibly smaller:
//  - width ≈ 72% (min 280, max 380)
//  - height ≈ 54% (min 320, max 520)
const CARD_W = Math.min(Math.max(SCREEN_W * 0.72, 280), 380);
const CARD_H = Math.min(Math.max(SCREEN_H * 0.54, 320), 520);
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
};

const TIMING_CONFIG = {
  duration: 220,
  easing: Easing.out(Easing.quad),
};

const SwipeDeck = forwardRef<SwipeDeckHandle, Props>(
  ({ item, onSwipe, onUndo, onSwipeStart, onSwipeEnd }, ref) => {
  const { discreteMode } = useSettings();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Reset reveal state when card changes.
    setRevealed(false);
  }, [item?.id]);

  const shouldMask = useMemo(() => discreteMode && !revealed, [discreteMode, revealed]);

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const gone = useSharedValue(false);
  const animating = useSharedValue(false);

  const thresholdX = 80;
  const thresholdY = 70;

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${(x.value / 18).toFixed(2)}deg` },
    ],
    opacity: gone.value ? withTiming(0) : 1,
  }));

  const performSwipe = (dir: SwipeDirection) => {
    'worklet';
    const targetX = dir === 'right' ? OFFSCREEN_X : dir === 'left' ? -OFFSCREEN_X : 0;
    const targetY = dir === 'down' ? OFFSCREEN_Y : 0;

    gone.value = true;

    const finish = (finished?: boolean) => {
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
      x.value = withSpring(0);
      y.value = withSpring(0);
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
      <View style={[styles.card, styles.emptyCard, { width: CARD_W, height: 220 }]}>
        <Text style={styles.emptyText}>No more cards</Text>
      </View>
    );
  }

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
        {discreteMode ? (
          <View style={styles.discreteBadgeRow}>
            <Text style={styles.discreteBadge}>DISCREET</Text>
            {shouldMask ? (
              <Text style={styles.discreteHint}>• tap to reveal</Text>
            ) : (
              <Pressable onPress={() => setRevealed(false)} accessibilityRole="button">
                <Text style={styles.discreteHide}>hide</Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {shouldMask ? (
          <Pressable
            onPress={() => setRevealed(true)}
            accessibilityRole="button"
            style={styles.maskWrap}
          >
            <Text style={styles.maskTitle}>Tap to reveal</Text>
            <Text style={styles.maskDesc}>
              Discreet mode is on. Content is hidden until you tap.
            </Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.title}>{String(item.title || '')}</Text>
            {!!item.description && (
              <Text style={styles.desc} numberOfLines={8}>
                {item.description}
              </Text>
            )}
          </>
        )}

        <View style={styles.metaRow}>
          {!!item.tier && <Text style={styles.meta}>Tier: {String(item.tier).toUpperCase()}</Text>}
          {!!item.intensityScale && <Text style={styles.meta}>Intensity: {item.intensityScale}</Text>}
        </View>
        <View style={styles.hintRow}>
          <Text style={styles.hint}>Swipe → Yes • ← No • ↓ Maybe</Text>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
  }
);

export default SwipeDeck;

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  title: { color: 'white', fontWeight: '800', fontSize: 18, marginBottom: 6 },
  desc: { color: '#cbd5e1', marginTop: 2, fontSize: 14, lineHeight: 19 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  meta: { color: '#93c5fd', fontWeight: '700', fontSize: 12 },
  hintRow: { marginTop: 'auto' },
  hint: { color: '#64748b', fontSize: 12 },
  discreteBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  discreteBadge: {
    color: '#34d399',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  discreteHint: { color: '#64748b', fontSize: 12, fontWeight: '700' },
  discreteHide: { color: '#60a5fa', fontSize: 12, fontWeight: '800' },

  maskWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
    padding: 14,
    marginBottom: 8,
  },
  maskTitle: { color: 'white', fontWeight: '900', fontSize: 18 },
  maskDesc: { color: '#94a3b8', marginTop: 8, lineHeight: 18 },

  emptyCard: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94a3b8', fontWeight: '700' },
});
