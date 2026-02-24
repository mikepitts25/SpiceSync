import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useKinks } from '../../lib/data';
import { useSettings } from '../../lib/state/useStore';

const { width: SCREEN_W } = Dimensions.get('window');

// Category definitions with icons and colors
const CATEGORIES = [
  { id: 'romance', name: 'Romance', icon: '💕', color: '#FF6B9D', description: 'Intimacy & connection', count: 45 },
  { id: 'adventure', name: 'Adventure', icon: '🎢', color: '#4ECDC4', description: 'Exciting new experiences', count: 38 },
  { id: 'sensual', name: 'Sensual', icon: '🌹', color: '#9B59B6', description: 'Senses & pleasure', count: 52 },
  { id: 'fantasy', name: 'Fantasy', icon: '✨', color: '#E74C3C', description: 'Roleplay & imagination', count: 41 },
  { id: 'playful', name: 'Playful', icon: '🎮', color: '#3498DB', description: 'Fun & games', count: 33 },
  { id: 'bdsm', name: 'Kink', icon: '⛓️', color: '#2C3E50', description: 'Power & restraint', count: 67 },
  { id: 'public', name: 'Public', icon: '🌍', color: '#F39C12', description: 'Outside the bedroom', count: 28 },
  { id: 'quickie', name: 'Quick', icon: '⚡', color: '#1ABC9C', description: 'Under 15 minutes', count: 25 },
];

// Mood filters
const MOODS = [
  { id: 'playful', name: 'Playful', emoji: '😄' },
  { id: 'intimate', name: 'Intimate', emoji: '🌙' },
  { id: 'passionate', name: 'Passionate', emoji: '🔥' },
  { id: 'adventurous', name: 'Adventurous', emoji: '🏔️' },
  { id: 'romantic', name: 'Romantic', emoji: '💝' },
];

// Curated packs
const PACKS = [
  { id: 'date-night', name: 'Date Night', icon: '🌃', activities: 12, description: 'Perfect for a special evening' },
  { id: 'weekend', name: 'Weekend Away', icon: '🏖️', activities: 8, description: 'Make the most of your trip' },
  { id: 'beginners', name: 'Beginner Friendly', icon: '🌱', activities: 15, description: 'Start your journey here' },
  { id: 'spicy', name: 'Turn Up the Heat', icon: '🌶️', activities: 10, description: 'For adventurous couples' },
];

// Quick filters
const QUICK_FILTERS = [
  { id: 'trending', name: '🔥 Trending' },
  { id: 'new', name: '✨ New' },
  { id: 'top', name: '💎 Top Rated' },
];

export default function DiscoveryHub() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useSettings();
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return CATEGORIES;
    return CATEGORIES.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Get total activities count
  const totalActivities = kinks.length;

  const handleCategoryPress = (categoryId: string) => {
    router.push({
      pathname: '/(deck)/DeckScreen',
      params: { category: categoryId },
    });
  };

  const handlePackPress = (packId: string) => {
    router.push({
      pathname: '/(deck)/DeckScreen',
      params: { pack: packId },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>{totalActivities} activities to explore</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Quick Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersContainer}
        >
          {QUICK_FILTERS.map((filter) => (
            <Pressable
              key={filter.id}
              style={[
                styles.quickFilter,
                activeQuickFilter === filter.id && styles.quickFilterActive,
              ]}
              onPress={() => setActiveQuickFilter(
                activeQuickFilter === filter.id ? null : filter.id
              )}
            >
              <Text style={[
                styles.quickFilterText,
                activeQuickFilter === filter.id && styles.quickFilterTextActive,
              ]}>
                {filter.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((category) => (
              <Pressable
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: `${category.color}15` }]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryIconText}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <Text style={[styles.categoryCount, { color: category.color }]}>
                  {category.count} activities
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Moods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moods</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodsContainer}
          >
            {MOODS.map((mood) => (
              <Pressable
                key={mood.id}
                style={[
                  styles.moodChip,
                  selectedMood === mood.id && styles.moodChipActive,
                ]}
                onPress={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodText,
                  selectedMood === mood.id && styles.moodTextActive,
                ]}>
                  {mood.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Intensity Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intensity</Text>
          <View style={styles.intensityContainer}>
            {[1, 2, 3, 4, 5].map((level) => (
              <Pressable
                key={level}
                style={[
                  styles.intensityButton,
                  selectedIntensity === level && styles.intensityButtonActive,
                ]}
                onPress={() => setSelectedIntensity(
                  selectedIntensity === level ? null : level
                )}
              >
                <View style={styles.intensityDots}>
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <View
                      key={dot}
                      style={[
                        styles.intensityDot,
                        dot <= level && styles.intensityDotFilled,
                      ]}
                    />
                  ))}
                </View>
                <Text style={[
                  styles.intensityLabel,
                  selectedIntensity === level && styles.intensityLabelActive,
                ]}>
                  {level === 1 && 'Beginner'}
                  {level === 2 && 'Easy'}
                  {level === 3 && 'Moderate'}
                  {level === 4 && 'Advanced'}
                  {level === 5 && 'Expert'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Curated Packs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Curated Packs</Text>
          <View style={styles.packsContainer}>
            {PACKS.map((pack) => (
              <Pressable
                key={pack.id}
                style={styles.packCard}
                onPress={() => handlePackPress(pack.id)}
              >
                <View style={styles.packHeader}>
                  <Text style={styles.packIcon}>{pack.icon}</Text>
                  <View style={styles.packBadge}>
                    <Text style={styles.packBadgeText}>{pack.activities}</Text>
                  </View>
                </View>
                <Text style={styles.packName}>{pack.name}</Text>
                <Text style={styles.packDescription}>{pack.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Start Button */}
        <Pressable 
          style={styles.startButton}
          onPress={() => router.push('/(deck)/DeckScreen')}
        >
          <Text style={styles.startButtonText}>Start Exploring</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SIZES.padding * 1.5,
    paddingTop: SIZES.padding,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.padding,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  quickFiltersContainer: {
    paddingHorizontal: SIZES.padding * 1.5,
    paddingVertical: SIZES.padding,
    gap: 10,
  },
  quickFilter: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickFilterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickFilterText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  quickFilterTextActive: {
    color: COLORS.background,
  },
  section: {
    marginTop: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding * 1.5,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (SCREEN_W - SIZES.padding * 4) / 2,
    padding: SIZES.padding,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  categoryCount: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.small,
  },
  moodsContainer: {
    gap: 10,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  moodChipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  moodTextActive: {
    color: COLORS.background,
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  intensityButtonActive: {
    backgroundColor: COLORS.cardElevated,
    borderColor: COLORS.primary,
  },
  intensityDots: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 6,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  intensityDotFilled: {
    backgroundColor: COLORS.primary,
  },
  intensityLabel: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  intensityLabelActive: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  packsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  packCard: {
    width: (SCREEN_W - SIZES.padding * 4) / 2,
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  packHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  packIcon: {
    fontSize: 32,
  },
  packBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
  },
  packBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.caption,
    color: COLORS.background,
  },
  packName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 4,
  },
  packDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.padding * 1.5,
    marginTop: SIZES.padding * 3,
    marginBottom: SIZES.padding * 2,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  startButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.background,
  },
});
