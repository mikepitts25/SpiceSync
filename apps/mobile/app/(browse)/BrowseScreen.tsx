// apps/mobile/app/(browse)/BrowseScreen.tsx
import React, { useMemo } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useSettings } from '../../lib/state/useStore';

export default function BrowseScreen() {
  const router = useRouter();
  const { language } = useSettings();
  const { selectedTier, clearTier } = useFilters();
  const { kinks } = useKinks(language === 'en' ? 'en' : 'es');

  const rows = useMemo(
    () => (selectedTier ? kinks.filter(k => k.tier === selectedTier) : kinks),
    [kinks, selectedTier]
  );

  const goCategories = () => router.replace('/(tabs)/categories');

  return (
    <View style={styles.screen} accessibilityLabel="Browse list screen">
      <View style={styles.topBar}>
        <Text style={styles.h1}>Browse</Text>
        {selectedTier ? <Text style={styles.tier}>• {selectedTier.toUpperCase()}</Text> : null}
        <Pressable style={styles.link} onPress={goCategories} accessibilityRole="button">
          <Text style={styles.linkText}>Categories</Text>
        </Pressable>
      </View>

      {selectedTier ? (
        <Pressable style={styles.chip} onPress={clearTier} accessibilityRole="button" accessibilityLabel="Clear filter">
          <Text style={styles.chipText}>Clear filter</Text>
        </Pressable>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
            <View style={styles.metaRow}>
              <Text style={styles.meta}>Tier: {item.tier?.toUpperCase()}</Text>
              <Text style={styles.meta}>Intensity: {item.intensityScale}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={styles.empty}>No items to show.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  tier: { color: '#9ca3af', fontWeight: '600' },
  link: { marginLeft: 'auto', padding: 8 },
  linkText: { color: '#60a5fa', fontWeight: '700' },
  chip: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipText: { color: 'white', fontWeight: '600' },
  card: { padding: 14, borderRadius: 14, backgroundColor: '#1f2937' },
  title: { color: 'white', fontWeight: '700', fontSize: 16 },
  desc: { color: '#cbd5e1', marginTop: 6 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  meta: { color: '#93c5fd', fontWeight: '600' },
  empty: { color: '#9ca3af' },
});
