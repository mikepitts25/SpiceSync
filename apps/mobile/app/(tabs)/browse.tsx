// apps/mobile/app/(tabs)/browse.tsx
// Redesigned with modern search and card visuals

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import SettingsButton from '../../src/components/SettingsButton';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useProfilesStore } from '../../lib/state/profiles';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../lib/i18n';
import { COLORS, GRADIENTS, SIZES, SHADOWS } from '../constants/theme';

const TIER_GRADIENTS: Record<string, string[]> = {
  soft: GRADIENTS.soft,
  naughty: GRADIENTS.naughty,
  xxx: GRADIENTS.xxx,
};

const TIER_ICONS: Record<string, string> = {
  soft: '💜',
  naughty: '🔥',
  xxx: '❌',
};

export default function BrowseScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const { selectedTier, clearTier } = useFilters();
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const { t } = useTranslation();
  const { isHydrated, hasActive } = useProfilesStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated(),
      hasActive: state.hasActiveProfile(),
    }))
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isHydrated && !hasActive) {
      router.replace('/welcome');
    }
  }, [isHydrated, hasActive, router]);

  const rows = useMemo(() => {
    let filtered = selectedTier ? kinks.filter((k) => k.tier === selectedTier) : kinks;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (k) =>
          k.title.toLowerCase().includes(query) ||
          k.description.toLowerCase().includes(query) ||
          k.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [kinks, selectedTier, searchQuery]);

  if (!isHydrated || !hasActive) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 Browse All Kinks</Text>
        {selectedTier && (
          <View style={styles.filterBadge}>
            <View style={[styles.filterBadgeInner, { backgroundColor: TIER_GRADIENTS[selectedTier][0] || '#FF6B9D' }]}>
              <Text style={styles.filterBadgeText}>
                {TIER_ICONS[selectedTier]} {selectedTier.toUpperCase()}
              </Text>
            </View>
            <Pressable onPress={clearTier} style={styles.clearFilter}>
              <Text style={styles.clearFilterText}>✕</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search kinks, tags, descriptions..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Results count */}
      <Text style={styles.resultsText}>
        {rows.length} {rows.length === 1 ? 'kink' : 'kinks'} found
      </Text>

      {/* List */}
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item, index }) => {
          const tierGradient = TIER_GRADIENTS[item.tier] || GRADIENTS.soft;
          const tierIcon = TIER_ICONS[item.tier] || '💜';
          
          return (
            <Animated.View entering={FadeInUp.delay(index * 50)}>
              <View style={styles.card}>
                {/* Tier strip */}
                <View style={[styles.tierStrip, { backgroundColor: tierGradient[0] }]} />
                
                <View style={styles.cardContent}>
                  {/* Header row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {item.category?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.tierBadgeSmall}>
                      <Text style={styles.tierBadgeSmallText}>
                        {tierIcon} {item.tier?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Title */}
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  
                  {/* Description */}
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  
                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.intensityContainer}>
                      <Text style={styles.intensityLabel}>Intensity</Text>
                      <View style={styles.intensityDots}>
                        {[1, 2, 3].map((level) => (
                          <View
                            key={level}
                            style={[
                              styles.intensityDot,
                              level <= (item.intensityScale || 1) && {
                                backgroundColor: tierGradient[0],
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                    
                    {item.tags && item.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {item.tags.slice(0, 2).map((tag: string, idx: number) => (
                          <View key={idx} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No kinks found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or clearing filters
            </Text>
          </View>
        }
      />
      
      <SettingsButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    paddingHorizontal: SIZES.paddingLarge,
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.padding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  filterBadgeInner: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  clearFilter: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearFilterText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    paddingHorizontal: SIZES.padding,
    marginHorizontal: SIZES.paddingLarge,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: SIZES.body,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Results
  resultsText: {
    color: COLORS.textMuted,
    fontSize: SIZES.small,
    fontWeight: '600',
    marginHorizontal: SIZES.paddingLarge,
    marginBottom: SIZES.padding,
  },
  
  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    marginHorizontal: SIZES.paddingLarge,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  tierStrip: {
    height: 4,
  },
  cardContent: {
    padding: SIZES.padding,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tierBadgeSmall: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SIZES.radius,
  },
  tierBadgeSmallText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: SIZES.large,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    lineHeight: 22,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intensityLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  intensityDots: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusFull,
  },
  tagText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
