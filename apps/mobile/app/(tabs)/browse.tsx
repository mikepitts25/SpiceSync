// apps/mobile/app/(tabs)/browse.tsx
import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SettingsButton from '../../src/components/SettingsButton';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useSettings } from '../../lib/state/useStore';
import { useProfilesStore } from '../../lib/state/profiles';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

export default function BrowseScreen() {
  const router = useRouter();
  const { language } = useSettings();
  const { selectedTier, clearTier } = useFilters();
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const { isHydrated, hasActive } = useProfilesStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated(),
      hasActive: state.hasActiveProfile(),
    }))
  );

  useEffect(() => {
    if (isHydrated && !hasActive) {
      router.replace('/welcome');
    }
  }, [isHydrated, hasActive, router]);

  const rows = useMemo(
    () => (selectedTier ? kinks.filter(k => k.tier === selectedTier) : kinks),
    [kinks, selectedTier]
  );

  if (!isHydrated || !hasActive) {
    return null;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']} accessibilityLabel="Browse list screen">
      <View style={styles.topBar}>
        <Text style={styles.h1}>Browse</Text>
        {selectedTier ? <Text style={styles.tier}>• {selectedTier.toUpperCase()}</Text> : null}
        {selectedTier ? (
          <Pressable style={styles.chip} onPress={clearTier} accessibilityRole="button" accessibilityLabel="Clear filter">
            <Text style={styles.chipText}>Clear filter</Text>
          </Pressable>
        ) : null}
      </View>

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
      <SettingsButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  tier: { color: '#9ca3af', fontWeight: '600' },
  chip: { marginLeft: 'auto', backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipText: { color: 'white', fontWeight: '600' },
  card: { padding: 14, borderRadius: 14, backgroundColor: '#1f2937' },
  title: { color: 'white', fontWeight: '700', fontSize: 16 },
  desc: { color: '#cbd5e1', marginTop: 6 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  meta: { color: '#93c5fd', fontWeight: '600' },
  empty: { color: '#9ca3af' },
});
