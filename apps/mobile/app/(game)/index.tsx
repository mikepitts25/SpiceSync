import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { 
  GameCardType, 
  GameCard, 
  getRandomCard, 
  getCardsByType,
  FREE_CARDS,
  PREMIUM_CARDS,
} from '../../data/gameCards';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_W * 0.85;

const CATEGORIES: { type: GameCardType | 'all'; label: string; emoji: string }[] = [
  { type: 'all', label: 'Random', emoji: '🎲' },
  { type: 'truth', label: 'Truth', emoji: '🤔' },
  { type: 'dare', label: 'Dare', emoji: '🔥' },
  { type: 'challenge', label: 'Challenge', emoji: '💪' },
  { type: 'fantasy', label: 'Fantasy', emoji: '✨' },
  { type: 'roleplay', label: 'Roleplay', emoji: '🎭' },
];

export default function GameHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const unlocked = useSettingsStore((state) => state.unlocked);
  
  const [selectedCategory, setSelectedCategory] = useState<GameCardType | 'all'>('all');
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState<string[]>([]);
  
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const drawCard = useCallback(() => {
    // Animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const card = getRandomCard(selectedCategory, unlocked);
    setCurrentCard(card);
    setIsFlipped(true);
  }, [selectedCategory, unlocked]);

  const handleComplete = useCallback(() => {
    if (currentCard) {
      setCompletedCards((prev) => [...prev, currentCard.id]);
      setIsFlipped(false);
      setTimeout(() => setCurrentCard(null), 300);
    }
  }, [currentCard]);

  const handleSkip = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => setCurrentCard(null), 300);
  }, []);

  const freeCount = FREE_CARDS.length;
  const premiumCount = PREMIUM_CARDS.length;
  const availableCards = unlocked 
    ? freeCount + premiumCount 
    : freeCount;

  const getTypeColor = (type: GameCardType) => {
    switch (type) {
      case 'truth': return '#3498DB';
      case 'dare': return '#E74C3C';
      case 'challenge': return '#2ECC71';
      case 'fantasy': return '#9B59B6';
      case 'roleplay': return '#F39C12';
      default: return COLORS.primary;
    }
  };

  const getIntensityDots = (intensity: number) => {
    return '🔥'.repeat(intensity);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎲 Spice Dice</Text>
        <Text style={styles.subtitle}>
          {completedCards.length} completed • {availableCards} cards available
        </Text>
        {!unlocked && (
          <View style={styles.premiumBanner}>
            <Text style={styles.premiumText}>
              🔓 {premiumCount} premium cards locked
            </Text>
            <Pressable 
              style={styles.upgradeButton}
              onPress={() => router.push('/(unlock)')}
            >
              <Text style={styles.upgradeText}>Unlock $19.99</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Category Selection */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Choose Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.type}
              style={[
                styles.categoryCard,
                selectedCategory === cat.type && styles.categoryCardSelected,
              ]}
              onPress={() => {
                setSelectedCategory(cat.type);
                setIsFlipped(false);
                setCurrentCard(null);
              }}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.categoryLabel,
                selectedCategory === cat.type && styles.categoryLabelSelected,
              ]}>
                {cat.label}
              </Text>
              <Text style={styles.categoryCount}>
                {getCardsByType(cat.type === 'all' ? 'truth' : cat.type, unlocked).length}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Card Area */}
      <View style={styles.cardArea}>
        <Animated.View 
          style={[
            styles.card,
            { 
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {!isFlipped ? (
            // Card Back
            <View style={styles.cardBack}>
              <Text style={styles.cardBackEmoji}>🎲</Text>
              <Text style={styles.cardBackText}>
                Tap Draw to reveal
              </Text>
            </View>
          ) : currentCard ? (
            // Card Front
            <View style={styles.cardFront}>
              <View style={[
                styles.cardTypeBadge,
                { backgroundColor: getTypeColor(currentCard.type) }
              ]}>
                <Text style={styles.cardTypeText}>
                  {currentCard.type.toUpperCase()}
                </Text>
              </View>
              
              {currentCard.isPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>⭐ PREMIUM</Text>
                </View>
              )}
              
              <View style={styles.cardContent}>
                <Text style={styles.cardText}>{currentCard.content}</Text>
              </View>
              
              <View style={styles.cardMeta}>
                <Text style={styles.intensityText}>
                  {getIntensityDots(currentCard.intensity)}
                </Text>
                <Text style={styles.timeText}>
                  ⏱️ {currentCard.estimatedTime}
                </Text>
              </View>
            </View>
          ) : null}
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {!isFlipped ? (
          <Pressable style={styles.drawButton} onPress={drawCard}>
            <Text style={styles.drawButtonText}>🎲 Draw Card</Text>
          </Pressable>
        ) : (
          <View style={styles.actionButtons}>
            <Pressable style={[styles.actionButton, styles.skipButton]} onPress={handleSkip}>
              <Text style={styles.actionButtonText}>🔄 Skip</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.completeButton]} onPress={handleComplete}>
              <Text style={styles.actionButtonText}>✅ Complete</Text>
            </Pressable>
          </View>
        )}
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
    padding: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  premiumText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  upgradeButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
  },
  upgradeText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: '#fff',
  },
  categorySection: {
    paddingHorizontal: SIZES.padding * 2,
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: (SCREEN_W - SIZES.padding * 5) / 3,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
    marginBottom: 2,
  },
  categoryLabelSelected: {
    color: '#fff',
  },
  categoryCount: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardBack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  cardBackEmoji: {
    fontSize: 80,
    marginBottom: SIZES.padding,
  },
  cardBackText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  cardFront: {
    flex: 1,
    padding: SIZES.padding * 1.5,
  },
  cardTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  cardTypeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#fff',
  },
  premiumBadge: {
    position: 'absolute',
    top: SIZES.padding * 1.5,
    right: SIZES.padding * 1.5,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: '#fff',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.h4,
    color: COLORS.text,
    lineHeight: 28,
    textAlign: 'center',
  },
  cardMeta: {
    alignItems: 'center',
  },
  intensityText: {
    fontSize: 16,
    marginBottom: 4,
  },
  timeText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: SIZES.padding * 2,
    paddingTop: 0,
  },
  drawButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  drawButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
});
