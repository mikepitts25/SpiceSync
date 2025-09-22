// apps/mobile/app/(tabs)/deck.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeDeck from '../../components/SwipeDeck';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useProfiles } from '../../lib/state/profiles';
import { useVotes, VoteValue } from '../../lib/state/votes';
import { useSettings } from '../../lib/state/useStore';
import { useFocusEffect } from 'expo-router';

export default function DeckScreen() {
  const { language } = (useSettings() as any) || { language: 'en' };
  const { selectedTier } = useFilters();
  const { currentUserId, profiles } = useProfiles();
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const setVote = useVotes(s => s.setVote);

  const source = useMemo(
    () => (selectedTier ? kinks.filter(k => k.tier === selectedTier) : kinks),
    [kinks, selectedTier]
  );

  // Index keyed by user + tier so a user can have their own position per category
  const key = `${currentUserId ?? 'none'}::${selectedTier ?? 'all'}`;
  const [indexByKey, setIndexByKey] = useState<Record<string, number>>({});
  const index = indexByKey[key] ?? 0;
  const current = source[index] ?? null;

  // Reset deck when profile changes or source changes and index would be out-of-range
  useEffect(() => {
    const max = Math.max(0, source.length - 1);
    if (index > max) {
      setIndexByKey(prev => ({ ...prev, [key]: 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, source.length]);

  // Also reset when screen refocuses after profile switch
  useFocusEffect(
    useCallback(() => {
      // no-op; but could re-validate index here if desired
      return () => {};
    }, [])
  );

  const setIndex = (n: number) => {
    setIndexByKey(prev => ({ ...prev, [key]: Math.max(0, Math.min(source.length, n)) }));
  };

  const onSwipe = useCallback(
    (dir: 'left' | 'right' | 'down') => {
      if (!current || !currentUserId) return;
      const map: Record<typeof dir, VoteValue> = { left: 'no', right: 'yes', down: 'maybe' };
      setVote(currentUserId, current.id, map[dir]);
      // Advance; when we reach the end, current will be null and UI shows "All done" state below.
      setIndex(index + 1);
    },
    [current, currentUserId, index, setVote]
  );

  if (!currentUserId) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>Choose a profile</Text>
        <Text style={styles.p}>Select who is swiping. Open the Settings/Profiles section to switch or create one.</Text>
      </SafeAreaView>
    );
  }

  if (!source.length) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>No items in this category</Text>
        <Text style={styles.p}>Try another category or add content.</Text>
      </SafeAreaView>
    );
  }

  // Finished state — safe UI, no null passed to SwipeDeck
  if (!current) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Text style={styles.user}>
            {profiles.find(p => p.id === currentUserId)?.emoji}{' '}
            {profiles.find(p => p.id === currentUserId)?.displayName}
          </Text>
          {selectedTier ? <Text style={styles.tier}>• {selectedTier?.toUpperCase()}</Text> : null}
        </View>
        <View style={[styles.doneCard]}>
          <Text style={styles.h1}>All done!</Text>
          <Text style={styles.p}>You’ve reached the end of this deck.</Text>
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={() => setIndex(0)}>
              <Text style={styles.btnStrong}>Restart deck</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const leftCount = Math.max(0, source.length - index);
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{leftCount} left</Text>
        {selectedTier ? <Text style={styles.tier}>• {selectedTier?.toUpperCase()}</Text> : null}
        <Text style={styles.user}>
          {profiles.find(p => p.id === currentUserId)?.emoji}{' '}
          {profiles.find(p => p.id === currentUserId)?.displayName}
        </Text>
      </View>
      <View style={styles.deckArea}>
        <SwipeDeck item={current} onSwipe={onSwipe} onUndo={() => setIndex(index - 1)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  wrap: { flex: 1, padding: 16, gap: 12, justifyContent: 'center', backgroundColor: '#0b0f14' },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  p: { fontSize: 16, color: '#94a3b8' },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  primary: { backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  secondary: { backgroundColor: '#1f2937', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  btnStrong: { color: 'white', fontWeight: '900' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, marginBottom: 6 },
  count: { fontWeight: '700', color: 'white' },
  tier: { color: '#9ca3af', fontWeight: '600' },
  user: { marginLeft: 'auto', color: '#93c5fd', fontWeight: '800' },
  deckArea: { flex: 1, paddingBottom: 8 },

  doneCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#111827',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
