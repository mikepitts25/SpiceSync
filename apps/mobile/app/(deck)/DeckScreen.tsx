// apps/mobile/app/(deck)/DeckScreen.tsx
// Redesigned deck screen with modern visuals

import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import SwipeDeck from '../../components/SwipeDeckRedesigned';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useSettings } from '../../lib/state/useStore';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

type VoteValue = 'yes' | 'no' | 'maybe';

const TIER_GRADIENTS: Record<string, string[]> = {
  soft: GRADIENTS.soft,
  naughty: GRADIENTS.naughty,
  xxx: GRADIENTS.xxx,
};

export default function DeckScreen() {
  const router = useRouter();
  const { language } = useSettings();
  const { selectedTier, clearTier } = useFilters();
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');

  const source = useMemo(
    () => (selectedTier ? kinks.filter((k) => k.tier === selectedTier) : kinks),
    [kinks, selectedTier]
  );

  const [index, setIndex] = useState(0);
  const current = source[index] || null;

  const saveVote = useCallback((kinkId: string, value: VoteValue) => {
    try {
      const store = require('../../lib/state/useStore');
      const votes =
        (store.useVotes ? store.useVotes() : store.default?.useVotes?.()) || {};
      if (typeof votes.setVote === 'function') {
        votes.setVote(null, kinkId, value);
      } else if (typeof votes.vote === 'function') {
        votes.vote({ kinkId, value });
      } else if (typeof votes.upsertVote === 'function') {
        votes.upsertVote({ userId: null, kinkId, value });
      }
    } catch {}
  }, []);

  const onSwipe = useCallback(
    (dir: 'left' | 'right' | 'down') => {
      if (!current) return;
      const map: Record<typeof dir, VoteValue> = {
        left: 'no',
        right: 'yes',
        down: 'maybe',
      };
      saveVote(current.id, map[dir]);
      setIndex((i) => Math.min(source.length, i + 1));
    },
    [current, saveVote, source.length]
  );

  const goCategories = () => router.replace('/(tabs)/categories');

  const tierGradient = selectedTier ? TIER_GRADIENTS[selectedTier] : null;

  if (!source.length) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Animated.View entering={FadeIn} style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptyText}>
            {selectedTier
              ? `The "${selectedTier}" category has no items right now.`
              : 'No content found. Try switching language.'}
          </Text>
          <Pressable style={[styles.emptyButton, { backgroundColor: COLORS.primary }]} onPress={goCategories}>
            <Text style={styles.emptyButtonText}>Back to Categories</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Animated.View entering={FadeIn} style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptyText}>
            You've reviewed everything{selectedTier ? ` in "${selectedTier}"` : ''}.
          </Text>
          <View style={styles.emptyButtons}>
            {selectedTier && (
              <Pressable style={styles.emptyButtonSecondary} onPress={clearTier}>
                <Text style={styles.emptyButtonSecondaryText}>Clear Filter</Text>
              </Pressable>
            )}
            <Pressable style={[styles.emptyButton, { backgroundColor: COLORS.primary }]} onPress={goCategories}>
              <Text style={styles.emptyButtonText}>Back to Categories</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goCategories} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        
        {selectedTier && tierGradient && (
          <View style={[styles.tierBadge, { backgroundColor: tierGradient[0] }]}>
            <Text style={styles.tierBadgeText}>{selectedTier.toUpperCase()}</Text>
          </View>
        )}
        
        <View style={styles.spacer} />
      </View>

      {/* Deck */}
      <View style={styles.deckContainer}>
        <SwipeDeck
          item={current}
          onSwipe={onSwipe}
          onUndo={() => setIndex((i) => Math.max(0, i - 1))}
          currentIndex={index}
          totalCount={source.length}
        />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backArrow: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '700',
  },
  tierBadge: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  tierBadgeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tierBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  spacer: {
    width: 44,
  },
  
  // Deck
  deckContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  
  // Empty states
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.paddingLarge,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: SIZES.h2,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.md,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: SIZES.medium,
    fontWeight: '700',
  },
  emptyButtonSecondary: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: SIZES.radiusLarge,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyButtonSecondaryText: {
    color: COLORS.text,
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
});
