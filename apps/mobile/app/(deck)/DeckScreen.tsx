// apps/mobile/app/(deck)/DeckScreen.tsx
import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SwipeDeck from '../../components/SwipeDeck';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useSettings, useVotes } from '../../lib/state/useStore';
import { useProfilesStore } from '../../lib/state/profiles';

type VoteValue = 'yes' | 'no' | 'maybe';

export default function DeckScreen() {
  const router = useRouter();
  const { language } = useSettings();
  const votes = useVotes();
  const activeProfileId = useProfilesStore((s) => s.activeProfileId);
  const { selectedTier, clearTier } = useFilters();
  const { kinks } = useKinks(language === 'en' ? 'en' : 'es');

  const historyRef = useRef<Array<{ kinkId: string; prevVote?: VoteValue }>>([]);

  const source = useMemo(
    () => (selectedTier ? kinks.filter(k => k.tier === selectedTier) : kinks),
    [kinks, selectedTier]
  );

  const [index, setIndex] = useState(0);
  const current = source[index] || null;

  const saveVote = useCallback(
    (kinkId: string, value: VoteValue) => {
      if (!activeProfileId) return;
      const prevVote = votes.getVote(activeProfileId, kinkId);
      historyRef.current.push({ kinkId, prevVote });
      votes.setVote(activeProfileId, kinkId, value);
    },
    [activeProfileId, votes]
  );

  const onSwipe = useCallback(
    (dir: 'left' | 'right' | 'down') => {
      if (!current) return;
      const map: Record<typeof dir, VoteValue> = { left: 'no', right: 'yes', down: 'maybe' };
      saveVote(current.id, map[dir]);
      setIndex((i) => Math.min(source.length, i + 1));
    },
    [current, saveVote, source.length]
  );

  const onUndo = useCallback(() => {
    if (!activeProfileId) return;
    const last = historyRef.current.pop();
    if (!last) return;

    if (last.prevVote) {
      votes.setVote(activeProfileId, last.kinkId, last.prevVote);
    } else {
      votes.clearVote(activeProfileId, last.kinkId);
    }

    setIndex((i) => Math.max(0, i - 1));
  }, [activeProfileId, votes]);

  const goCategories = () => router.replace('/(tabs)/categories');

  if (!source.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.h1}>No items in this category</Text>
        {selectedTier ? (
          <Text style={styles.p}>
            The “{selectedTier}” category has no items right now. You can clear the filter or go back to categories.
          </Text>
        ) : (
          <Text style={styles.p}>No content found. Try switching language or refreshing your pack.</Text>
        )}
        <View style={styles.row}>
          {selectedTier ? (
            <Pressable style={styles.secondary} onPress={clearTier} accessibilityRole="button">
              <Text style={styles.btnText}>Clear filter</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.primary} onPress={goCategories} accessibilityRole="button">
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
        <Text style={styles.p}>You’ve reviewed everything{selectedTier ? ` in “${selectedTier}”` : ''}.</Text>
        <View style={styles.row}>
          {selectedTier ? (
            <Pressable style={styles.secondary} onPress={clearTier} accessibilityRole="button">
              <Text style={styles.btnText}>Clear filter</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.primary} onPress={goCategories} accessibilityRole="button">
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
        {selectedTier ? <Text style={styles.tier}>• {selectedTier.toUpperCase()}</Text> : null}
        <Pressable style={styles.undo} onPress={onUndo} accessibilityRole="button">
          <Text style={styles.undoText}>Undo</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={goCategories} accessibilityRole="button">
          <Text style={styles.linkText}>Categories</Text>
        </Pressable>
      </View>

      {/* Swipe-only deck (no extra buttons at bottom) */}
      <View style={styles.deckArea}>
        <SwipeDeck item={current} onSwipe={onSwipe} onUndo={onUndo} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  wrap: { flex: 1, padding: 16, gap: 12, justifyContent: 'center', backgroundColor: '#0b0f14' },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  p: { fontSize: 16, color: '#94a3b8' },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  primary: { backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  secondary: { backgroundColor: '#1f2937', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  btnText: { color: 'white', fontWeight: '600' },
  btnTextStrong: { color: 'white', fontWeight: '800' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, marginBottom: 6 },
  count: { fontWeight: '700', color: 'white' },
  tier: { color: '#9ca3af', fontWeight: '600' },
  undo: { marginLeft: 'auto', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#111827' },
  undoText: { color: '#e2e8f0', fontWeight: '800' },
  link: { padding: 8 },
  linkText: { color: '#60a5fa', fontWeight: '700' },
  deckArea: { flex: 1, paddingBottom: 8 },
});
