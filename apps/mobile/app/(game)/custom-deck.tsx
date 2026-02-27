import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { GameCardType, GameCard } from '../../../data/gameCards';

const CARD_TYPES: { id: GameCardType; name: string; emoji: string }[] = [
  { id: 'truth', name: 'Truth', emoji: '💭' },
  { id: 'dare', name: 'Dare', emoji: '🔥' },
  { id: 'challenge', name: 'Challenge', emoji: '💪' },
  { id: 'fantasy', name: 'Fantasy', emoji: '✨' },
  { id: 'roleplay', name: 'Roleplay', emoji: '🎭' },
];

export default function CustomDeckBuilder() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const unlocked = useSettingsStore((state) => state.unlocked);
  
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<GameCardType>('truth');
  const [intensity, setIntensity] = useState(3);
  const [customCards, setCustomCards] = useState<GameCard[]>([]);

  if (!unlocked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedEmoji}>🔒</Text>
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedText}>
            Create your own custom cards with SpiceSync Premium
          </Text>
          <Pressable 
            style={styles.upgradeButton}
            onPress={() => router.push('/(unlock)')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddCard = () => {
    if (!content.trim()) {
      Alert.alert('Empty Card', 'Please enter some content for your card');
      return;
    }

    const newCard: GameCard = {
      id: `custom-${Date.now()}`,
      type: selectedType,
      content: content.trim(),
      intensity: intensity as 1 | 2 | 3 | 4 | 5,
      category: 'playful',
      isPremium: true,
      estimatedTime: '5-10 min',
    };

    setCustomCards([...customCards, newCard]);
    setContent('');
    Alert.alert('Card Added!', 'Your custom card has been added to your deck');
  };

  const handleDeleteCard = (id: string) => {
    setCustomCards(customCards.filter(c => c.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>✨ Custom Deck</Text>
          <Text style={styles.subtitle}>
            {customCards.length} custom cards created
          </Text>
        </View>

        {/* Card Type Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Card Type</Text>
          <View style={styles.typeGrid}>
            {CARD_TYPES.map((type) => (
              <Pressable
                key={type.id}
                style={[
                  styles.typeButton,
                  selectedType === type.id && styles.typeButtonSelected,
                ]}
                onPress={() => setSelectedType(type.id)}
              >
                <Text style={styles.typeEmoji}>{type.emoji}</Text>
                <Text style={[
                  styles.typeText,
                  selectedType === type.id && styles.typeTextSelected,
                ]}>
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Intensity Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Intensity: {intensity}/5</Text>
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
        </View>

        {/* Content Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Card Content</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write your custom card..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.charCount}>{content.length}/200</Text>
        </View>

        {/* Add Button */}
        <Pressable style={styles.addButton} onPress={handleAddCard}>
          <Text style={styles.addButtonText}>+ Add to Deck</Text>
        </Pressable>

        {/* Custom Cards List */}
        {customCards.length > 0 && (
          <View style={styles.cardsSection}>
            <Text style={styles.sectionTitle}>Your Custom Cards</Text>
            {customCards.map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardType}>{CARD_TYPES.find(t => t.id === card.type)?.emoji}</Text>
                  <View style={styles.cardIntensity}>
                    {[...Array(card.intensity)].map((_, i) => (
                      <Text key={i} style={styles.intensityStar}>🔥</Text>
                    ))}
                  </View>
                </View>
                <Text style={styles.cardContent}>{card.content}</Text>
                <Pressable 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCard(card.id)}
                >
                  <Text style={styles.deleteText}>🗑️ Delete</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  lockedEmoji: {
    fontSize: 64,
    marginBottom: SIZES.padding,
  },
  lockedTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  lockedText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  upgradeButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
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
  label: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    minWidth: 70,
  },
  typeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  typeText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  typeTextSelected: {
    color: '#fff',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 12,
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
  contentInput: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: COLORS.success,
    marginHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  addButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  cardsSection: {
    paddingHorizontal: SIZES.padding * 2,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  cardItem: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  cardType: {
    fontSize: 20,
  },
  cardIntensity: {
    flexDirection: 'row',
  },
  intensityStar: {
    fontSize: 14,
  },
  cardContent: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding,
    lineHeight: 22,
  },
  deleteButton: {
    alignSelf: 'flex-start',
  },
  deleteText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.danger,
  },
});
