import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { useKinks } from '../../lib/data';
import { useSettingsStore } from '../../src/stores/settingsStore';

const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '✨' },
  { id: 'adventure', name: 'Adventure', emoji: '🏔️' },
  { id: 'sensual', name: 'Sensual', emoji: '🌹' },
  { id: 'playful', name: 'Playful', emoji: '🎮' },
  { id: 'fantasy', name: 'Fantasy', emoji: '🔮' },
  { id: 'bdsm', name: 'Kink', emoji: '⛓️' },
  { id: 'public', name: 'Public', emoji: '🌆' },
];

const MOODS = [
  { id: 'spontaneous', name: 'Spontaneous', emoji: '⚡' },
  { id: 'romantic', name: 'Romantic', emoji: '🌙' },
  { id: 'adventurous', name: 'Adventurous', emoji: '🎢' },
  { id: 'relaxed', name: 'Relaxed', emoji: '🛁' },
  { id: 'intense', name: 'Intense', emoji: '🔥' },
];

export default function DiscoveryHub() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [intensityRange, setIntensityRange] = useState([1, 5]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Filter activities based on all criteria
  const filteredActivities = useMemo(() => {
    return kinks.filter((activity) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          activity.title.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (selectedCategory !== 'all' && activity.category !== selectedCategory) {
        return false;
      }
      
      // Intensity filter
      const intensity = activity.intensityScale || 1;
      if (intensity < intensityRange[0] || intensity > intensityRange[1]) {
        return false;
      }
      
      return true;
    });
  }, [kinks, searchQuery, selectedCategory, intensityRange]);

  const toggleMood = (moodId: string) => {
    setSelectedMoods((prev) =>
      prev.includes(moodId)
        ? prev.filter((m) => m !== moodId)
        : [...prev, moodId]
    );
  };

  const startSwiping = () => {
    router.push('/(deck)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
            {filteredActivities.length} activities to explore
          </Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Search */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search activities..."
              placeholderTextColor={COLORS.textMuted}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextSelected,
                  ]}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Moods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood</Text>
            <View style={styles.moodGrid}>
              {MOODS.map((mood) => (
                <Pressable
                  key={mood.id}
                  style={[
                    styles.moodChip,
                    selectedMoods.includes(mood.id) && styles.moodChipSelected,
                  ]}
                  onPress={() => toggleMood(mood.id)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodText,
                    selectedMoods.includes(mood.id) && styles.moodTextSelected,
                  ]}>
                    {mood.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Intensity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Intensity: {intensityRange[0]} - {intensityRange[1]}
            </Text>
            <View style={styles.intensityRow}>
              {[1, 2, 3, 4, 5].map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.intensityDot,
                    level >= intensityRange[0] && level <= intensityRange[1] && styles.intensityDotActive,
                  ]}
                  onPress={() => setIntensityRange([1, level])}
                >
                  <Text style={[
                    styles.intensityText,
                    level >= intensityRange[0] && level <= intensityRange[1] && styles.intensityTextActive,
                  ]}>
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsCard}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{filteredActivities.length}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {new Set(filteredActivities.map(a => a.category)).size}
              </Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable 
            style={styles.ctaButton}
            onPress={startSwiping}
          >
            <Text style={styles.ctaText}>
              Start Swiping ({filteredActivities.length})
            </Text>
          </Pressable>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding * 2,
    marginBottom: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
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
  clearIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
    padding: 4,
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
  categoriesScroll: {
    gap: 10,
    paddingRight: SIZES.padding * 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  categoryTextSelected: {
    color: '#fff',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodChipSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  moodEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  moodText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  moodTextSelected: {
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding * 2,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
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
  },
  ctaText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
});
