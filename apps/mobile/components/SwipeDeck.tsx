
// apps/mobile/components/SwipeDeck.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Make the card visibly smaller:
//  - width ≈ 72% (min 280, max 380)
//  - height ≈ 54% (min 320, max 520)
const CARD_W = Math.min(Math.max(SCREEN_W * 0.72, 280), 380);
const CARD_H = Math.min(Math.max(SCREEN_H * 0.54, 320), 520);

type Dir = 'left' | 'right' | 'down';

export default function SwipeDeck({
  item,
  onSwipe,
  onUndo,
}: {
  item: any | null;
  onSwipe: (d: Dir) => void;
  onUndo: () => void;
}) {
  if (!item) {
    return (
      <View style={[styles.card, styles.emptyCard, { width: CARD_W, height: 220 }]}>
        <Text style={styles.emptyText}>No more cards</Text>
      </View>
    );
  }

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const gone = useSharedValue(false);

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

  const handleEnd = (dx: number, dy: number) => {
    'worklet';
    let dir: Dir | null = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > thresholdX) dir = 'right';
      else if (dx < -thresholdX) dir = 'left';
    } else {
      if (dy > thresholdY) dir = 'down';
    }

    if (dir) {
      gone.value = true;
      x.value = withTiming(dx * 2);
      y.value = withTiming(dy * 2, {}, () => {
        runOnJS(onSwipe)(dir as Dir);
        x.value = 0;
        y.value = 0;
        gone.value = false;
      });
    } else {
      x.value = withSpring(0);
      y.value = withSpring(0);
    }
  };

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
        <Text style={styles.title}>{String(item.title || '')}</Text>
        {!!item.description && (
          <Text style={styles.desc} numberOfLines={8}>{item.description}</Text>
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
  emptyCard: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94a3b8', fontWeight: '700' },
});
