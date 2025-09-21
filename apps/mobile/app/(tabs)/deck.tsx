// apps/mobile/app/(tabs)/deck.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeDeck from '../../components/SwipeDeck';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useProfiles } from '../../lib/state/profiles';
import { useVotes, VoteValue } from '../../lib/state/votes';
import { useSettings } from '../../lib/state/useStore';

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

  const [index, setIndex] = useState(0);
  const current = source[index] || null;

  const onSwipe = useCallback(
    (dir: 'left'|'right'|'down') => {
      if (!current || !currentUserId) return;
      const map: Record<typeof dir, VoteValue> = { left: 'no', right: 'yes', down: 'maybe' };
      setVote(currentUserId, current.id, map[dir]);
      setIndex(i => Math.min(source.length, i + 1));
    },
    [current, currentUserId, setVote, source.length]
  );

  if (!currentUserId) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top','left','right']}>
        <Text style={styles.h1}>Choose a profile</Text>
        <Text style={styles.p}>You need to select who is swiping. Go to the Profiles tab to switch or create one.</Text>
        <View style={styles.row}>
          <Pressable style={styles.primary} onPress={() => { /* user can tap bottom tab */ }}>
            <Text style={styles.btnStrong}>Open Profiles tab</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!source.length) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top','left','right']}>
        <Text style={styles.h1}>No items to swipe</Text>
        <Text style={styles.p}>Try another category or add content.</Text>
      </SafeAreaView>
    );
  }

  const leftCount = Math.max(0, source.length - index);
  return (
    <SafeAreaView style={styles.screen} edges={['top','left','right']}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{leftCount} left</Text>
        {selectedTier ? <Text style={styles.tier}>• {selectedTier?.toUpperCase()}</Text> : null}
        <Text style={styles.user}>
          {profiles.find(p=>p.id===currentUserId)?.emoji} {profiles.find(p=>p.id===currentUserId)?.displayName}
        </Text>
      </View>
      <View style={styles.deckArea}>
        <SwipeDeck item={current} onSwipe={onSwipe} onUndo={() => setIndex(i => Math.max(0, i - 1))} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  wrap: { flex: 1, padding: 16, gap: 12, justifyContent: 'center', backgroundColor: '#0b0f14' },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  p: { fontSize: 16, color: '#94a3b8' },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primary: { backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  btnStrong: { color: 'white', fontWeight: '800' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, marginBottom: 6 },
  count: { fontWeight: '700', color: 'white' },
  tier: { color: '#9ca3af', fontWeight: '600' },
  user: { marginLeft:'auto', color:'#93c5fd', fontWeight:'800' },
  deckArea: { flex: 1, paddingBottom: 8 },
});
