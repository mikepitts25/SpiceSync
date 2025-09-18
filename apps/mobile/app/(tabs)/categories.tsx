// apps/mobile/app/(tabs)/categories.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFilters } from '../../lib/state/filters';
import { useKinks } from '../../lib/data';

const TIERS: { key: 'romance'|'soft'|'naughty'|'xxx'; label: string; desc: string }[] = [
  { key: 'romance', label: 'Romance', desc: 'sweet, caring' },
  { key: 'soft', label: 'Soft Kinks', desc: 'gentle spice' },
  { key: 'naughty', label: 'Naughty Kinks', desc: 'bolder play' },
  { key: 'xxx', label: 'XXX Kinks', desc: 'hard spice' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const { setTier } = useFilters();
  const { kinks } = useKinks(); // defaults EN

  const counts = kinks.reduce<Record<string, number>>((acc, k) => {
    const t = k.tier || 'soft';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const onPick = (tier: 'romance'|'soft'|'naughty'|'xxx') => {
    const count = counts[tier] || 0;
    if (count <= 0) {
      Alert.alert('No items yet', `No ${tier} items available right now. Try a different category or add your own.`);
      return;
    }
    setTier(tier);
    // Go straight to swiping:
    router.push('/(tabs)/deck');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.h1}>Choose a category</Text>
      <View style={styles.grid}>
        {TIERS.map(t => (
          <Pressable key={t.key} style={styles.card} onPress={() => onPick(t.key)} accessibilityRole="button">
            <Text style={styles.title}>{t.label}</Text>
            <Text style={styles.desc}>{t.desc}</Text>
            <Text style={styles.count}>{counts[t.key] || 0} items</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ height: 12 }} />
      <Pressable style={styles.primary} onPress={() => { setTier(null); router.push('/(tabs)/deck'); }}>
        <Text style={styles.primaryText}>Skip category → Start Swiping</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#0b0f14' },
  h1: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { flexBasis: '47%', padding: 14, borderRadius: 14, backgroundColor: '#1f2937' },
  title: { color: 'white', fontSize: 16, fontWeight: '700' },
  desc: { color: '#cbd5e1', marginTop: 4 },
  count: { color: '#93c5fd', marginTop: 8, fontWeight: '700' },
  primary: { padding: 14, borderRadius: 14, backgroundColor: '#3b82f6', alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '800' },
});
