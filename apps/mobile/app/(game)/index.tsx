import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { getRandomCard, GameCardType, FREE_CARDS, ALL_CARDS } from '../../../data/gameCards';

const GAME_TYPES: { id: GameCardType | 'all'; name: string; emoji: string; color: string }[] = [
  { id: 'all', name: 'Surprise Me', emoji: '🎲', color: COLORS.primary },
  { id: 'truth', name: 'Truth', emoji: '💭', color: '#3498DB' },
  { id: 'dare', name: 'Dare', emoji: '🔥', color: '#E74C3C' },
  { id: 'challenge', name: 'Challenge', emoji: '💪', color: '#2ECC71' },
  { id: 'fantasy', name: 'Fantasy', emoji: '✨', color: '#9B59B6' },
  { id: 'roleplay', name: 'Roleplay', emoji: '🎭', color: '#F39C12' },
];

export default function GameHub() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const unlocked = useSettingsStore((state) => state.unlocked);
  const [selectedType, setSelectedType] = useState<GameCardType | 'all'>('all');
  const [intensity, setIntensity] = useState(3);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const totalCards = unlocked ? ALL_CARDS.length : FREE_CARDS.length;
  const freeCardCount = FREE_CARDS.length;

  const startGame = () => {
    // Navigate to card draw screen with selected type and intensity
    router.push({
      pathname: '/(game)/draw',
      params: { type: selectedType, intensity },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎲 Spice Dice</Text>
          <Text style={styles.subtitle}>
            {unlocked 
              ? `${totalCards} cards to explore` 
              : `${freeCardCount} free cards • ${ALL_CARDS.length - freeCardCount} premium`}
          </Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        >
          {/* Game Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Category</Text>
            <View style={styles.typeGrid}>
              {GAME_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && { 
                      backgroundColor: type.color,
                      borderColor: type.color,
                    },
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <Text style={[
                    styles.typeName,
                    selectedType === type.id && styles.typeNameSelected,
                  ]}>
                    {type.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Intensity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intensity Level: {intensity}/5</Text>
            <View style={styles.intensityRow}>
              {[1, 2, 3, 4, 5].map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.intensityDot,
                    intensity >= level && styles.intensityDotActive,
                  ]}
                  onPress={() => setIntensity(level)}
                >
                  <Text style={[
                    styles.intensityText,
                    intensity >= level && styles.intensityTextActive,
                  ]}>
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.intensityDescription}>
              {intensity === 1 && "Sweet and innocent"}
              {intensity === 2 && "Playful and flirty"}
              {intensity === 3 && "Spicy and adventurous"}
              {intensity === 4 && "Hot and intense"}
              {intensity === 5 && "Wild and uninhibited"}
            </Text>
          </View>

          {/* Stats Preview */}
          <View style={styles.statsCard}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{totalCards}</Text>
              <Text style={styles.statLabel}>Total Cards</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>6</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            {!unlocked && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={[styles.statNumber, styles.premiumStat]}>75+</Text>
                  <Text style={styles.statLabel}>Premium</Text>
                </View>
              </>
            )}
          </View>

          {/* How to Play */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to Play</Text>
            <View style={styles.infoSteps}>
              <View style={styles.infoStep}>
                <Text style={styles.infoStepNumber}>1</Text>
                <Text style={styles.infoStepText}>Choose a category or go random</Text>
              </View>
              <View style={styles.infoStep}>
                <Text style={styles.infoStepNumber}>2</Text>
                <Text style={styles.infoStepText}>Set your comfort level (1-5)</Text>
              </View>
              <View style={styles.infoStep}>
                <Text style={styles.infoStepNumber}>3</Text>
                <Text style={styles.infoStepText}>Draw a card and complete the challenge!</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.ctaButton} onPress={startGame}>
            <Text style={styles.ctaText}>Start Game</Text>
          </Pressable>
          {!unlocked && (
            <Pressable 
              style={styles.unlockButton}
              onPress={() => router.push('/(unlock)')}
            >
              <Text style={styles.unlockText}>
                🔓 Unlock 75+ Premium Cards
              </Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
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
  },
  section: {
    marginBottom: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding * 2,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeName: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  typeNameSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SIZES.padding,
  },
  intensityDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  intensityDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  intensityText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  intensityTextActive: {
    color: '#fff',
  },
  intensityDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding * 2,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding * 2,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  statNumber: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.primary,
  },
  premiumStat: {
    color: COLORS.secondary,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding * 2,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  infoSteps: {
    gap: SIZES.padding,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 28,
    marginRight: SIZES.padding,
  },
  infoStepText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    padding: SIZES.padding * 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  ctaText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  unlockButton: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
  },
  unlockText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.secondary,
  },
});
