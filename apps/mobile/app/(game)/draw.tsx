import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { getRandomCard, GameCard, GameCardType, FREE_CARDS, ALL_CARDS } from '../../../data/gameCards';

const { width: SCREEN_W } = Dimensions.get('window');

const TYPE_COLORS: Record<GameCardType | 'all', string> = {
  all: COLORS.primary,
  truth: '#3498DB',
  dare: '#E74C3C',
  challenge: '#2ECC71',
  fantasy: '#9B59B6',
  roleplay: '#F39C12',
};

const TYPE_NAMES: Record<GameCardType, string> = {
  truth: 'TRUTH',
  dare: 'DARE',
  challenge: 'CHALLENGE',
  fantasy: 'FANTASY',
  roleplay: 'ROLEPLAY',
};

export default function CardDraw() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type, intensity } = useLocalSearchParams<{ type: GameCardType | 'all'; intensity: string }>();
  const unlocked = useSettingsStore((state) => state.unlocked);
  
  const [card, setCard] = useState<GameCard | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPremiumLocked, setIsPremiumLocked] = useState(false);
  
  const flipAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    drawCard();
  }, []);

  const drawCard = () => {
    const selectedType = type || 'all';
    const selectedIntensity = parseInt(intensity) || 3;
    
    // Get available cards
    const availableCards = unlocked 
      ? ALL_CARDS 
      : FREE_CARDS;
    
    // Filter by type if specified
    let filteredCards = selectedType === 'all' 
      ? availableCards 
      : availableCards.filter(c => c.type === selectedType);
    
    // Filter by intensity (within +/- 1 range)
    filteredCards = filteredCards.filter(c => 
      c.intensity >= Math.max(1, selectedIntensity - 1) && 
      c.intensity <= Math.min(5, selectedIntensity + 1)
    );
    
    // Pick random card
    if (filteredCards.length > 0) {
      const randomCard = filteredCards[Math.floor(Math.random() * filteredCards.length)];
      setCard(randomCard);
      setIsPremiumLocked(randomCard.isPremium && !unlocked);
      
      // Animate in
      setIsRevealed(false);
      scaleAnim.setValue(0.8);
      flipAnim.setValue(0);
      
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        // Flip animation
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setIsRevealed(true);
        });
      });
    }
  };

  const handleSkip = () => {
    drawCard();
  };

  const handleAccept = () => {
    if (isPremiumLocked) {
      router.push('/(unlock)');
      return;
    }
    // Mark as accepted/completed
    router.push('/(game)/complete');
  };

  if (!card) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Drawing card...</Text>
      </SafeAreaView>
    );
  }

  const cardColor = TYPE_COLORS[card.type];
  const isLocked = card.isPremium && !unlocked;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          🔥 Level {card.intensity}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Card */}
      <Animated.View 
        style={[
          styles.cardContainer,
          { 
            transform: [
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <View style={[styles.card, { borderColor: cardColor }]}>
          {/* Card Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: cardColor }]}>
            <Text style={styles.typeText}>{TYPE_NAMES[card.type]}</Text>
          </View>

          {/* Premium Lock Overlay */}
          {isLocked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockEmoji}>🔒</Text>
              <Text style={styles.lockText}>Premium Card</Text>
              <Text style={styles.lockSubtext}>
                Unlock to see this card
              </Text>
            </View>
          )}

          {/* Card Content */}
          <View style={[styles.content, isLocked && styles.blurredContent]}>
            <Text style={styles.cardText}>{card.content}</Text>
            <Text style={styles.timeEstimate}>⏱️ {card.estimatedTime}</Text>
          </View>

          {/* Intensity Dots */}
          <View style={styles.intensityRow}>
            {[1, 2, 3, 4, 5].map((dot) => (
              <View
                key={dot}
                style={[
                  styles.intensityDot,
                  dot <= card.intensity && { backgroundColor: cardColor },
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>🔄 Skip</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.acceptButton, isLocked && { backgroundColor: COLORS.secondary }]}
          onPress={handleAccept}
        >
          <Text style={styles.acceptText}>
            {isLocked ? '🔓 Unlock' : '✅ Accept'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding * 2,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.text,
    width: 40,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
  },
  loading: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: COLORS.text,
    fontSize: SIZES.body,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  card: {
    width: SCREEN_W - SIZES.padding * 4,
    minHeight: 400,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 3,
    padding: SIZES.padding * 2,
    position: 'relative',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding * 2,
  },
  typeText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  blurredContent: {
    opacity: 0.1,
  },
  cardText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: SIZES.padding * 2,
  },
  timeEstimate: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SIZES.padding * 2,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 11, 14, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: SIZES.radiusLarge - 3,
  },
  lockEmoji: {
    fontSize: 48,
    marginBottom: SIZES.padding,
  },
  lockText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: 8,
  },
  lockSubtext: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: SIZES.padding,
    padding: SIZES.padding * 2,
    paddingTop: 0,
  },
  skipButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
});
