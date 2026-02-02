import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { usePremium } from '../src/stores/premium';
import { useSettings } from '../lib/state/useStore';
import {
  filterTruthDareDeck,
  getTruthDareDeck,
  pickRandomCard,
  type TruthDareLevel,
  type TruthDareType,
} from '../lib/truthDare';

const LEVELS: Array<{ key: TruthDareLevel | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'romantic', label: 'Romantic' },
  { key: 'flirty', label: 'Flirty' },
  { key: 'spicy', label: 'Spicy' },
  { key: 'kinky', label: 'Kinky' },
];

const TYPES: Array<{ key: TruthDareType | 'both'; label: string }> = [
  { key: 'both', label: 'Truth + Dare' },
  { key: 'truth', label: 'Truth' },
  { key: 'dare', label: 'Dare' },
];

export default function TruthDareScreen() {
  const router = useRouter();
  const { isPro } = usePremium();
  const { language } = useSettings();

  const [level, setLevel] = useState<TruthDareLevel | 'all'>('all');
  const [type, setType] = useState<TruthDareType | 'both'>('both');

  // NOTE: UI strings are still EN for now; this switches the content pack.
  const allCards = useMemo(() => getTruthDareDeck(language === 'es' ? 'es' : 'en'), [language]);
  const deck = useMemo(() => filterTruthDareDeck(allCards, { level, type }), [allCards, level, type]);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = useMemo(() => {
    if (!currentId) return null;
    return deck.find((c) => c.id === currentId) ?? null;
  }, [deck, currentId]);

  // Pro gate (simple and explicit)
  if (!isPro) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>Truth or Dare</Text>
        <Text style={styles.p}>This game mode is part of SpiceSync Pro.</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/paywall')} accessibilityRole="button">
          <Text style={styles.btnText}>Unlock Pro</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.secondary]} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.btnText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.h1}>Truth or Dare</Text>
      <Text style={styles.meta}>Consent-first. Skip anything. No guilt.</Text>

      <View style={styles.filters}>
        <View style={styles.row}>
          {LEVELS.map((x) => (
            <Pressable
              key={x.key}
              style={[styles.pill, level === x.key && styles.pillActive]}
              onPress={() => setLevel(x.key)}
              accessibilityRole="button"
            >
              <Text style={[styles.pillText, level === x.key && styles.pillTextActive]}>{x.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.row}>
          {TYPES.map((x) => (
            <Pressable
              key={x.key}
              style={[styles.pill, type === x.key && styles.pillActive]}
              onPress={() => setType(x.key)}
              accessibilityRole="button"
            >
              <Text style={[styles.pillText, type === x.key && styles.pillTextActive]}>{x.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        {current ? (
          <>
            <Text style={styles.cardTag}>{current.type.toUpperCase()} • {current.level.toUpperCase()}</Text>
            <Text style={styles.cardText}>{current.prompt}</Text>
          </>
        ) : (
          <Text style={styles.cardText}>Tap “Deal” to pull a card.</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.btn}
          onPress={() => {
            const next = pickRandomCard(deck);
            setCurrentId(next?.id ?? null);
          }}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Deal</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, styles.secondary]}
          onPress={() => setCurrentId(null)}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Clear</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.btn, styles.secondary]} onPress={() => router.back()} accessibilityRole="button">
        <Text style={styles.btnText}>Back</Text>
      </Pressable>

      <Text style={styles.foot}>{deck.length} cards in this filter</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: '#0b0f14' },
  h1: { fontSize: 26, fontWeight: '900', color: 'white' },
  p: { color: '#cbd5e1', fontSize: 16 },
  meta: { color: '#94a3b8' },
  filters: { gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' },
  pillActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  pillText: { color: '#cbd5e1', fontWeight: '800', fontSize: 12 },
  pillTextActive: { color: 'white' },

  card: { flex: 1, backgroundColor: '#0e1526', borderWidth: 1, borderColor: '#111827', borderRadius: 16, padding: 16, justifyContent: 'center' },
  cardTag: { color: '#93c5fd', fontWeight: '900', marginBottom: 10 },
  cardText: { color: 'white', fontSize: 18, fontWeight: '800', lineHeight: 24 },

  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  secondary: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' },
  btnText: { color: 'white', fontWeight: '900' },
  foot: { color: '#64748b', textAlign: 'center', marginTop: 4 },
});
