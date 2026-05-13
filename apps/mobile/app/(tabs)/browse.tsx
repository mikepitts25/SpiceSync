import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Check,
  Ellipsis,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import {
  AppHeader,
  AppTabBar,
  IntensityDots,
} from '../../components/app-chrome';
import { useKinks, type KinkItem, type Tier } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useProfilesStore } from '../../lib/state/profiles';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useVotesStore, type VoteValue } from '../../src/stores/votes';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';

const TIER_OPTIONS: { label: string; value: Tier | null }[] = [
  { label: 'ALL', value: null },
  { label: 'SOFT', value: 'soft' },
  { label: 'NAUGHTY', value: 'naughty' },
  { label: 'XXX', value: 'xxx' },
];

const TIER_COLORS: Record<string, string> = {
  soft: COLORS.pink,
  naughty: COLORS.purple,
  xxx: COLORS.no,
};

function VoteBadge({ vote }: { vote?: VoteValue }) {
  const config = {
    yes: { bg: 'rgba(34,197,94,0.12)', icon: Check, color: COLORS.yes },
    maybe: { bg: 'rgba(245,158,11,0.12)', icon: Ellipsis, color: COLORS.maybe },
    no: { bg: 'rgba(239,68,68,0.12)', icon: X, color: COLORS.no },
    none: { bg: 'rgba(255,255,255,0.04)', icon: Plus, color: COLORS.textMuted },
  }[vote ?? 'none'];
  const Icon = config.icon;

  return (
    <View style={[styles.voteBadge, { backgroundColor: config.bg }]}>
      <Icon size={18} color={config.color} strokeWidth={2.4} />
    </View>
  );
}

export default function BrowseScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const { selectedTier, setTier, clearTier } = useFilters();
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const { isHydrated, hasActive, activeProfileId } = useProfilesStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated(),
      hasActive: state.hasActiveProfile(),
      activeProfileId: state.getActiveProfileId(),
    }))
  );
  const activeVotes = useVotesStore((state) =>
    activeProfileId ? state.votesByProfile[activeProfileId] : undefined
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (isHydrated && !hasActive) {
      router.replace('/welcome');
    }
  }, [isHydrated, hasActive, router]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(kinks.map((item) => item.category).filter(Boolean))
    );
    return ['All', ...unique.slice(0, 8)];
  }, [kinks]);

  const rows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return kinks.filter((item) => {
      if (selectedTier && item.tier !== selectedTier) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory)
        return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [kinks, searchQuery, selectedCategory, selectedTier]);

  if (!isHydrated || !hasActive) {
    return null;
  }

  const renderItem = ({ item }: { item: KinkItem }) => {
    const tierColor = item.tier
      ? (TIER_COLORS[item.tier] ?? COLORS.pink)
      : COLORS.pink;
    const vote = activeVotes?.[item.id];

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemLeft}>
          <View style={styles.itemMetaRow}>
            <Text style={[styles.itemCategory, { color: tierColor }]}>
              {(item.category || item.tier || 'Activity').toUpperCase()}
            </Text>
            <IntensityDots value={item.intensityScale ?? 1} color={tierColor} />
          </View>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <VoteBadge vote={vote} />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={17} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search kinks..."
            placeholderTextColor="rgba(255,255,255,0.19)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable style={styles.filterButton} accessibilityRole="button">
          <SlidersHorizontal size={18} color={COLORS.pink} />
        </Pressable>
      </View>

      <View style={styles.tierRow}>
        {TIER_OPTIONS.map((option) => {
          const active = selectedTier === option.value;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() =>
                option.value ? setTier(option.value) : clearTier()
              }
              style={styles.tierPress}
            >
              {active ? (
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.tierActive}
                >
                  <Text style={styles.tierActiveText}>{option.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.tierInactive}>
                  <Text style={styles.tierInactiveText}>{option.label}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.chipRow}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }) => {
            const active = selectedCategory === item;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedCategory(item)}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results</Text>
            <Text style={styles.emptyCopy}>Try another search or filter.</Text>
          </View>
        }
      />

      <AppTabBar active="browse" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.19)',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.19)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tierPress: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tierActive: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tierActiveText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tierInactive: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tierInactiveText: {
    color: 'rgba(255,255,255,0.37)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  chipRow: {
    paddingBottom: 6,
  },
  chipList: {
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(194,24,91,0.12)',
    borderColor: 'rgba(194,24,91,0.25)',
  },
  categoryChipText: {
    color: 'rgba(255,255,255,0.37)',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: COLORS.pink,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  itemRow: {
    minHeight: 86,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.19)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.small,
  },
  itemLeft: {
    flex: 1,
    gap: 5,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemCategory: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  itemDescription: {
    color: 'rgba(255,255,255,0.31)',
    fontSize: 11,
    lineHeight: 15,
  },
  voteBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCopy: {
    color: COLORS.textSub,
    fontSize: 13,
  },
});
