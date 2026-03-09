// Animated Card with 3D Flip Effect
// Uses react-native-reanimated for smooth card flip animations

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_W * 0.9, 380);
const CARD_HEIGHT = Math.min(SCREEN_H * 0.55, 480);

interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  intensityScale: number;
  tags?: string[];
}

interface FlippableCardProps {
  activity: Activity;
  onSwipe?: (direction: 'yes' | 'no' | 'maybe') => void;
  onFlip?: (isFlipped: boolean) => void;
  style?: ViewStyle;
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

export default function FlippableCard({
  activity,
  onSwipe,
  onFlip,
  style,
}: FlippableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { cardDraw, buttonPress } = useHaptics();
  
  // Animation values
  const flipRotation = useSharedValue(0);
  const swipeX = useSharedValue(0);
  const swipeY = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const categoryColor = CATEGORY_COLORS[activity.category] || COLORS.primary;
  
  // Handle flip
  const handleFlip = useCallback(() => {
    buttonPress();
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    flipRotation.value = withSpring(newFlipped ? 180 : 0, {
      damping: 15,
      stiffness: 120,
    });
    onFlip?.(newFlipped);
  }, [isFlipped, onFlip, flipRotation, buttonPress]);
  
  // Handle tap to flip (only if not swiping)
  const handleTap = useCallback(() => {
    handleFlip();
  }, [handleFlip]);
  
  // Front card animated style (3D flip)
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 180],
      [0, 180],
      Extrapolate.CLAMP
    );
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: scale.value },
      ],
      opacity: interpolate(flipRotation.value, [0, 90, 180], [1, 0, 0]),
    };
  });
  
  // Back card animated style (3D flip)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipRotation.value,
      [0, 180],
      [180, 360],
      Extrapolate.CLAMP
    );
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
        { scale: scale.value },
      ],
      opacity: interpolate(flipRotation.value, [0, 90, 180], [0, 0, 1]),
    };
  });
  
  // Swipe gesture
  const swipeGesture = Gesture.Pan()
    .onBegin(() => {
      scale.value = withTiming(1.02, { duration: 100 });
    })
    .onUpdate((event) => {
      swipeX.value = event.translationX;
      swipeY.value = event.translationY;
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const translation = event.translationX;
      const threshold = 100;
      
      if (Math.abs(translation) > threshold || Math.abs(velocity) > 500) {
        // Swipe detected
        const direction = translation > 0 ? 'yes' : 'no';
        const targetX = translation > 0 ? SCREEN_W : -SCREEN_W;
        
        swipeX.value = withTiming(targetX, { duration: 200 });
        
        runOnJS(cardDraw)();
        runOnJS(onSwipe)?.(direction as 'yes' | 'no' | 'maybe');
        
        // Reset after animation
        setTimeout(() => {
          swipeX.value = 0;
          swipeY.value = 0;
          scale.value = 1;
        }, 200);
      } else {
        // Snap back
        swipeX.value = withSpring(0);
        swipeY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    });
  
  // Swipe animated style
  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: swipeX.value },
      { translateY: swipeY.value },
      {
        rotate: `${interpolate(
          swipeX.value,
          [-SCREEN_W / 2, 0, SCREEN_W / 2],
          [-15, 0, 15],
          Extrapolate.CLAMP
        )}deg`,
      },
    ],
  }));
  
  // Overlay opacity for swipe feedback
  const yesOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      swipeX.value,
      [0, 50, 100],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    ),
  }));
  
  const noOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      swipeX.value,
      [-100, -50, 0],
      [1, 0.5, 0],
      Extrapolate.CLAMP
    ),
  }));
  
  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[styles.container, swipeAnimatedStyle, style]}>
        {/* Front of card */}
        <Animated.View
          style={[
            styles.card,
            styles.frontCard,
            frontAnimatedStyle,
            { borderColor: categoryColor },
          ]}
        >
          <Pressable onPress={handleTap} style={styles.cardPressable}>
            {/* Category Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryText}>
                {activity.category}
              </Text>
            </View>
            
            {/* Title */}
            <Text style={styles.title}>{activity.title}</Text>
            
            {/* Hint to flip */}
            <View style={styles.flipHint}>
              <Text style={styles.flipHintText}>👆 Tap to flip</Text>
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
                      dot <= activity.intensityScale && { backgroundColor: categoryColor },
                    ]}
                  />
                ))}
              </View>
            </View>
          </Pressable>
          
          {/* Swipe Overlays */}
          <Animated.View style={[styles.overlay, styles.yesOverlay, yesOpacity]}>
            <Text style={styles.overlayText}>YES</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.noOverlay, noOpacity]}>
            <Text style={styles.overlayText}>NO</Text>
          </Animated.View>
        </Animated.View>
        
        {/* Back of card */}
        <Animated.View
          style={[
            styles.card,
            styles.backCard,
            backAnimatedStyle,
            { borderColor: categoryColor },
          ]}
        >
          <Pressable onPress={handleTap} style={styles.cardPressable}>
            {/* Category Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryText}>
                {activity.category}
              </Text>
            </View>
            
            {/* Description */}
            <Text style={styles.description}>{activity.description}</Text>
            
            {/* Tags if available */}
            {activity.tags && activity.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {activity.tags.slice(0, 4).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Flip hint */}
            <View style={styles.flipHint}>
              <Text style={styles.flipHintText}>👆 Tap to flip back</Text>
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    padding: SIZES.padding * 1.5,
    ...SHADOWS.lg,
    backfaceVisibility: 'hidden',
  },
  frontCard: {
    zIndex: 2,
  },
  backCard: {
    zIndex: 1,
  },
  cardPressable: {
    flex: 1,
    justifyContent: 'space-between',
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
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding,
    lineHeight: 34,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    flex: 1,
  },
  flipHint: {
    alignItems: 'center',
    marginVertical: SIZES.padding,
  },
  flipHintText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  intensityContainer: {
    marginTop: 'auto',
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SIZES.padding,
  },
  tag: {
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
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
    borderColor: COLORS.yes,
    transform: [{ rotate: '15deg' }],
  },
  noOverlay: {
    left: 20,
    borderColor: COLORS.no,
    transform: [{ rotate: '-15deg' }],
  },
  overlayText: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.text,
  },
});
