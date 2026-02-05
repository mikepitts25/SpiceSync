// apps/mobile/app/(deck)/DeckScreen.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SwipeDeck from '../../components/SwipeDeck';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useSettings } from '../../lib/state/useStore';

type VoteValue = 'yes' | 'no' | 'maybe';

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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
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

  if (!source.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.h1}>No items in this category</Text>
        {selectedTier ? (
          <Text style={styles.p}>
            The “{selectedTier}” category has no items right now. You can clear
            the filter or go back to categories.
          </Text>
        ) : (
          <Text style={styles.p}>
            No content found. Try switching language or refreshing your pack.
          </Text>
        )}
        <View style={styles.row}>
          {selectedTier ? (
            <Pressable
              style={styles.secondary}
              onPress={clearTier}
              accessibilityRole="button"
            >
              <Text style={styles.btnText}>Clear filter</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.primary}
            onPress={goCategories}
            accessibilityRole="button"
          >
            <Text style={styles.btnTextStrong}>Back to Categories</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.h1}>You’re all caught up 🎉</Text>
        <Text style={styles.p}>
          You’ve reviewed everything
          {selectedTier ? ` in “${selectedTier}”` : ''}.
        </Text>
        <View style={styles.row}>
          {selectedTier ? (
            <Pressable
              style={styles.secondary}
              onPress={clearTier}
              accessibilityRole="button"
            >
              <Text style={styles.btnText}>Clear filter</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.primary}
            onPress={goCategories}
            accessibilityRole="button"
          >
            <Text style={styles.btnTextStrong}>Back to Categories</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen} accessibilityLabel="Swipe deck screen">
      <View style={styles.topBar}>
        <Text style={styles.count}>
          {index + 1}/{source.length}
        </Text>
        {selectedTier ? (
          <Text style={styles.tier}>• {selectedTier.toUpperCase()}</Text>
        ) : null}
        <Pressable
          style={styles.link}
          onPress={goCategories}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Categories</Text>
        </Pressable>
      </View>

      {/* Swipe-only deck (no extra buttons at bottom) */}
      <View style={styles.deckArea}>
        <SwipeDeck
          item={current}
          onSwipe={onSwipe}
          onUndo={() => setIndex((i) => Math.max(0, i - 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  wrap: {
    flex: 1,
    padding: 16,
    gap: 12,
    justifyContent: 'center',
    backgroundColor: '#0b0f14',
  },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  p: { fontSize: 16, color: '#94a3b8' },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primary: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  secondary: {
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnText: { color: 'white', fontWeight: '600' },
  btnTextStrong: { color: 'white', fontWeight: '800' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  count: { fontWeight: '700', color: 'white' },
  tier: { color: '#9ca3af', fontWeight: '600' },
  link: { marginLeft: 'auto', padding: 8 },
  linkText: { color: '#60a5fa', fontWeight: '700' },
  deckArea: { flex: 1, paddingBottom: 8 },
});
