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
import { useSettingsStore } from '../../src/stores/settingsStore';
import { GameCardType, getCardsByLanguage, ALL_CARDS } from '../../data/gameCards';
import { useTranslation, interpolate } from '../../lib/i18n';

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
  const language = useSettingsStore((state) => state.language);
  const drinkingMode = useSettingsStore((state) => state.drinkingMode);
  const setDrinkingMode = useSettingsStore((state) => state.setDrinkingMode);
  const [selectedType, setSelectedType] = useState<GameCardType | 'all'>('all');
  const [intensity, setIntensity] = useState(3);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  // Get cards based on language
  const cards = getCardsByLanguage(language, unlocked);
  const freeCards = getCardsByLanguage(language, false);
  const totalCards = cards.length;
  const freeCardCount = freeCards.length;

  // Translate game type names
  const getTranslatedName = (id: string) => {
    switch (id) {
      case 'all': return t.game.surprise;
      case 'truth': return t.game.truth;
      case 'dare': return t.game.dare;
      case 'challenge': return t.game.challenge;
      case 'fantasy': return t.game.fantasy;
      case 'roleplay': return t.game.roleplay;
      default: return id;
    }
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Using language-aware counts calculated above

  const startGame = () => {
    // Navigate to card draw screen with selected type and intensity
    router.push({
      pathname: '/(game)/draw',
      params: { type: selectedType, intensity, drinkingMode: drinkingMode ? 'true' : 'false' },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.game.title}</Text>
          <Text style={styles.subtitle}>
            {unlocked 
              ? interpolate(t.game.cardsToExplore, { count: String(totalCards) })
              : interpolate(t.game.freeCardsCount, { 
                  free: String(freeCardCount), 
                  premium: String(ALL_CARDS.length - freeCardCount) 
                })}
          </Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        >
          {/* Game Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.game.chooseCategory}</Text>
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
                    selectedType === type.id && styles.typeNameSelected
                  ]}>
                    {getTranslatedName(type.id)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Intensity Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.game.intensity}</Text>
            <View style={styles.intensityContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.intensityDot,
                    intensity >= level && styles.intensityDotActive,
                    { opacity: 0.3 + (level * 0.14) }
                  ]}
                  onPress={() => setIntensity(level)}
                />
              ))}
            </View>
            <View style={styles.intensityLabels}>
              <Text style={styles.intensityLabel}>{t.discover.soft}</Text>
              <Text style={styles.intensityLabel}>{t.discover.xxx}</Text>
            </View>
          </View>

          {/* Drinking Mode Toggle */}
          <View style={styles.section}>
            <Pressable 
              style={styles.drinkingModeContainer}
              onPress={() => setDrinkingMode(!drinkingMode)}
            >
              <View style={styles.drinkingModeLeft}>
                <Text style={styles.drinkingModeEmoji}>🍺</Text>
                <View>
                  <Text style={styles.drinkingModeTitle}>Drinking Mode</Text>
                  <Text style={styles.drinkingModeSubtitle}>Do this or take a drink</Text>
                </View>
              </View>
              <View style={[
                styles.toggle,
                drinkingMode && styles.toggleActive
              ]}>
                <View style={[
                  styles.toggleKnob,
                  drinkingMode && styles.toggleKnobActive
                ]} />
              </View>
            </Pressable>
          </View>

          {/* Start Button */}
          <Pressable 
            style={styles.startButton}
            onPress={startGame}
          >
            <Text style={styles.startButtonText}>{t.game.startGame}</Text>
          </Pressable>
        </ScrollView>
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
    padding: SIZES.padding,
  },
  header: {
    marginBottom: SIZES.padding * 1.5,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SIZES.padding * 1.5,
  },
  sectionTitle: {
    ...FONTS.h3,
    color: COLORS.text,
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeName: {
    ...FONTS.body,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeNameSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  intensityDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
  },
  intensityDotActive: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  intensityLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOWS.medium,
  },
  startButtonText: {
    ...FONTS.h3,
    color: '#fff',
    fontWeight: '700',
  },
  drinkingModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SIZES.padding * 1.5,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  drinkingModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drinkingModeEmoji: {
    fontSize: 28,
  },
  drinkingModeTitle: {
    ...FONTS.body,
    color: COLORS.text,
    fontWeight: '700',
  },
  drinkingModeSubtitle: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    padding: 4,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
});
