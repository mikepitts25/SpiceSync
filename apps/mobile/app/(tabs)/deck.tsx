
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeDeck from '../../components/SwipeDeck';
import SettingsButton from '../../src/components/SettingsButton';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useProfilesStore } from '../../lib/state/profiles';
import { useVotes, VoteValue } from '../../lib/state/votes';
import { useSettings } from '../../lib/state/useStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

const { width: SCREEN_W } = Dimensions.get('window');

export default function DeckScreen() {
  const router = useRouter();
  const { language } = useSettings();
  const { selectedTier } = useFilters();
  const { isHydrated, hasActive, profiles, activeProfileId } = useProfilesStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated(),
      hasActive: state.hasActiveProfile(),
      profiles: state.getProfiles(),
      activeProfileId: state.getActiveProfileId(),
    }))
  );

  useEffect(() => {
    if (isHydrated && !hasActive) {
      router.replace('/welcome');
    }
  }, [isHydrated, hasActive, router]);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );
  const activeProfileIdValue = activeProfile?.id ?? null;
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const setVote = useVotes(s => s.setVote);

  // Source deck for current filter
  const source = useMemo(
    () => (selectedTier ? kinks.filter(k => k.tier === selectedTier) : kinks),
    [kinks, selectedTier]
  );

  // Index is stored per (user, tier)
  const key = `${activeProfileIdValue ?? 'none'}::${selectedTier ?? 'all'}`;
  const [indexByKey, setIndexByKey] = useState<Record<string, number>>({});
  const index = indexByKey[key] ?? 0;
  const current = source[index] ?? null;

  // ✅ HARD RESET when profile or category changes
  useEffect(() => {
    setIndexByKey(prev => ({ ...prev, [key]: 0 }));
  }, [key]);

  // Guard if source length shrinks (e.g., after edits)
  useEffect(() => {
    const max = Math.max(0, source.length - 1);
    if (index > max) {
      setIndexByKey(prev => ({ ...prev, [key]: 0 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.length]);

  // Optional: on refocus we could validate index (kept as no-op)
  useFocusEffect(
    useCallback(() => {
      return () => {};
    }, [])
  );

  const setIndex = (n: number) => {
    setIndexByKey(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(source.length, n)),
    }));
  };

  const onSwipe = useCallback(
    (dir: 'left' | 'right' | 'down') => {
      if (!current || !activeProfileIdValue) return;
      const map: Record<typeof dir, VoteValue> = { left: 'no', right: 'yes', down: 'maybe' };
      setVote(activeProfileIdValue, current.id, map[dir]);
      setIndex(index + 1);
    },
    [current, activeProfileIdValue, index, setVote]
  );

  if (!isHydrated || !hasActive) {
    return null;
  }

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>Choose a profile</Text>
        <Text style={styles.p}>Open Settings → Profiles to select who is swiping.</Text>
        <SettingsButton />
      </SafeAreaView>
    );
  }

  if (!source.length) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>No items in this category</Text>
        <Text style={styles.p}>Try another category or add content.</Text>
        <SettingsButton />
      </SafeAreaView>
    );
  }

  // Finished state — safe UI, no null passed to SwipeDeck
  if (!current) {
    const me = activeProfile;
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Text style={styles.user}>
            {me?.emoji} {me?.displayName ?? me?.name}
          </Text>
          {selectedTier ? <Text style={styles.tier}>• {selectedTier?.toUpperCase()}</Text> : null}
        </View>
        <View style={[styles.doneCard, styles.cardMaxW]}>
          <Text style={styles.h1}>All done!</Text>
          <Text style={styles.p}>You’ve reached the end of this deck.</Text>
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={() => setIndex(0)}>
              <Text style={styles.btnStrong}>Restart deck</Text>
            </Pressable>
          </View>
        </View>
        <SettingsButton />
      </SafeAreaView>
    );
  }

  const leftCount = Math.max(0, source.length - index);
  const me = activeProfile;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{leftCount} left</Text>
        {selectedTier ? <Text style={styles.tier}>• {selectedTier?.toUpperCase()}</Text> : null}
        <Text style={styles.user}>
          {me?.emoji} {me?.displayName ?? me?.name}
        </Text>
      </View>
      <View style={styles.deckArea}>
        <View style={styles.cardMaxW}>
          <SwipeDeck item={current} onSwipe={onSwipe} onUndo={() => setIndex(index - 1)} />
        </View>
      </View>
      <SettingsButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  wrap: { flex: 1, padding: 16, gap: 12, justifyContent: 'center', backgroundColor: '#0b0f14' },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  p: { fontSize: 16, color: '#94a3b8' },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondary: { backgroundColor: '#1f2937', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  btnStrong: { color: 'white', fontWeight: '900' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, marginBottom: 6 },
  count: { fontWeight: '700', color: 'white' },
  tier: { color: '#9ca3af', fontWeight: '600' },
  user: { marginLeft: 'auto', color: '#93c5fd', fontWeight: '800' },

  deckArea: { flex: 1, paddingBottom: 8, alignItems: 'center', justifyContent: 'center' },
  cardMaxW: { maxWidth: Math.min(SCREEN_W, 520), alignSelf: 'center' },

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
