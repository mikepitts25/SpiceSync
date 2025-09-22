// apps/mobile/components/SwipeDeck.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

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
  // If there's no card, render a harmless placeholder (no gestures).
  if (!item) {
    return (
      <View style={[styles.card, styles.emptyCard]}>
        <Text style={styles.emptyText}>No more cards</Text>
      </View>
    );
  }

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const gone = useSharedValue(false);

  const thresholdX = 80; // left/right
  const thresholdY = 70; // down

  const style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { rotate: `${(x.value / 16).toFixed(2)}deg` },
      ],
      opacity: gone.value ? withTiming(0) : 1,
    };
  });

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
        handleEnd(e.nativeEvent.translationX, e.nativeEvent.translationY);
      }}
    >
      <Animated.View style={[styles.card, style]}>
        <Text style={styles.title}>{String(item.title || '')}</Text>
        {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
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
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#111827',
    padding: 16,
  },
  title: { color: 'white', fontWeight: '800', fontSize: 18 },
  desc: { color: '#cbd5e1', marginTop: 8 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  meta: { color: '#93c5fd', fontWeight: '600' },
  hintRow: { marginTop: 'auto' },
  hint: { color: '#64748b', fontSize: 12 },

  // Placeholder when no item
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: '#94a3b8', fontWeight: '700' },
});
