import React, { useState } from 'react';
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
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_W * 0.85;
const CARD_HEIGHT = SCREEN_H * 0.6;
const SWIPE_THRESHOLD = 100;

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  intensityScale: number;
}

interface SwipeDeckProps {
  activities: Activity[];
  currentIndex: number;
  onSwipe: (direction: 'yes' | 'no' | 'maybe') => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  adventure: '#4ECDC4',
  sensual: '#9B59B6',
  fantasy: '#E74C3C',
  playful: '#F39C12',
  bdsm: '#2C3E50',
  public: '#1ABC9C',
  quickie: '#E67E22',
};

export default function SwipeDeck({ activities, currentIndex, onSwipe }: SwipeDeckProps) {
  const [showMatch, setShowMatch] = useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const currentActivity = activities[currentIndex];
  const remainingCount = activities.length - currentIndex;

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_W / 2, 0, SCREEN_W / 2],
        [-15, 0, 15]
      );
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const translation = event.translationX;

      if (Math.abs(translation) > SWIPE_THRESHOLD || Math.abs(velocity) > 500) {
        const direction = translation > 0 ? 'yes' : 'no';
        const targetX = translation > 0 ? SCREEN_W : -SCREEN_W;
        
        translateX.value = withTiming(targetX, { duration: 200 });
        
        runOnJS(onSwipe)(direction);
        
        // Reset after animation
        setTimeout(() => {
          translateX.value = 0;
          translateY.value = 0;
          rotation.value = 0;
        }, 200);
      } else {
        // Snap back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const yesOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1]
    ),
  }));

  const noOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0]
    ),
  }));

  if (!currentActivity) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🎉</Text>
        <Text style={styles.emptyTitle}>All Caught Up!</Text>
        <Text style={styles.emptyText}>
          You've seen all activities. Check your matches!
        </Text>
      </View>
    );
  }

  const categoryColor = CATEGORY_COLORS[currentActivity.category] || COLORS.primary;

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {activities.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex + 1) / activities.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Card */}
      <GestureDetector gesture={gesture}>
        <Animated.View 
          style={[
            styles.card,
            cardStyle,
            { borderColor: categoryColor },
          ]}
        >
          {/* Category Badge */}
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>
              {currentActivity.category}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{currentActivity.title}</Text>
            <Text style={styles.description}>
              {currentActivity.description}
            </Text>
          </View>

          {/* Intensity */}
          <View style={styles.intensityContainer}>
            <Text style={styles.intensityLabel}>Intensity</Text>
            <View style={styles.intensityDots}>
              {[1, 2, 3, 4, 5].map((dot) => (
                <View
                  key={dot}
                  style={[
                    styles.intensityDot,
                    dot <= currentActivity.intensityScale && styles.intensityDotActive,
                    dot <= currentActivity.intensityScale && { backgroundColor: categoryColor },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Overlays */}
          <Animated.View style={[styles.overlay, styles.yesOverlay, yesOpacity]}>
            <Text style={styles.overlayText}>YES</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.noOverlay, noOpacity]}>
            <Text style={styles.overlayText}>NO</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.button, styles.noButton]}
          onPress={() => onSwipe('no')}
        >
          <Text style={styles.buttonEmoji}>✕</Text>
        </Pressable>
        <Pressable 
          style={[styles.button, styles.maybeButton]}
          onPress={() => onSwipe('maybe')}
        >
          <Text style={styles.buttonEmoji}>?</Text>
        </Pressable>
        <Pressable 
          style={[styles.button, styles.yesButton]}
          onPress={() => onSwipe('yes')}
        >
          <Text style={styles.buttonEmoji}>♥</Text>
        </Pressable>
      </View>

      {/* Match Celebration Modal */}
      <Modal
        visible={showMatch}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMatch(false)}
      >
        <SafeAreaView style={styles.matchContainer}>
          <Text style={styles.matchEmoji}>🎉</Text>
          <Text style={styles.matchTitle}>It's a Match!</Text>
          <Text style={styles.matchSubtitle}>
            You both said YES to this activity
          </Text>
          <View style={styles.matchActions}>
            <Pressable 
              style={styles.matchButton}
              onPress={() => setShowMatch(false)}
            >
              <Text style={styles.matchButtonText}>Keep Swiping</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    width: CARD_WIDTH,
    marginBottom: SIZES.padding,
  },
  progressText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    padding: SIZES.padding * 1.5,
    overflow: 'hidden',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  categoryText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: '#fff',
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  intensityContainer: {
    marginTop: SIZES.padding,
  },
  intensityLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  intensityDots: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  intensityDotActive: {
    backgroundColor: COLORS.primary,
  },
  overlay: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 4,
    borderRadius: 12,
  },
  yesOverlay: {
    right: 20,
    borderColor: COLORS.success,
    transform: [{ rotate: '15deg' }],
  },
  noOverlay: {
    left: 20,
    borderColor: COLORS.danger,
    transform: [{ rotate: '-15deg' }],
  },
  overlayText: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SIZES.padding * 2,
    marginTop: SIZES.padding * 2,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  noButton: {
    backgroundColor: `${COLORS.danger}20`,
    borderColor: COLORS.danger,
  },
  maybeButton: {
    backgroundColor: `${COLORS.warning}20`,
    borderColor: COLORS.warning,
  },
  yesButton: {
    backgroundColor: `${COLORS.success}20`,
    borderColor: COLORS.success,
  },
  buttonEmoji: {
    fontSize: 28,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  emptyEmoji: {
    fontSize: 64,
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
  },
  matchContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  matchEmoji: {
    fontSize: 80,
    marginBottom: SIZES.padding,
  },
  matchTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  matchSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding * 3,
  },
  matchActions: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  matchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  matchButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
});
