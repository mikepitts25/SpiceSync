// apps/mobile/app/(tabs)/browse.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SettingsButton from '../../src/components/SettingsButton';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useProfilesStore } from '../../lib/state/profiles';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../lib/i18n';

export default function BrowseScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const { selectedTier, clearTier } = useFilters();
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const { t } = useTranslation();
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

  const [searchQuery, setSearchQuery] = useState('');

  const rows = useMemo(
    () => {
      let filtered = selectedTier ? kinks.filter((k) => k.tier === selectedTier) : kinks;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (k) =>
            k.title.toLowerCase().includes(query) ||
            k.description.toLowerCase().includes(query) ||
            k.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      return filtered;
    },
    [kinks, selectedTier, searchQuery]
  );

  if (!isHydrated || !hasActive) {
    return null;
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
      accessibilityLabel="Browse list screen"
    >
      <View style={styles.topBar}>
        <Text style={styles.h1}>{t.browse.title}</Text>
        {selectedTier ? (
          <Text style={styles.tier}>• {selectedTier.toUpperCase()}</Text>
        ) : null}
        {selectedTier ? (
          <Pressable
            style={styles.chip}
            onPress={clearTier}
            accessibilityRole="button"
            accessibilityLabel="Clear filter"
          >
            <Text style={styles.chipText}>{t.browse.clearFilter}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search kinks..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.description && (
              <Text style={styles.desc}>{item.description}</Text>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{t.common.tier}: {item.tier?.toUpperCase()}</Text>
              <Text style={styles.meta}>{t.common.intensity}: {item.intensityScale}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text style={styles.empty}>{t.browse.noItems}</Text>
          </View>
        }
      />
      <SettingsButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  tier: { color: '#9ca3af', fontWeight: '600' },
  chip: {
    marginLeft: 'auto',
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: 'white', fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  card: { padding: 14, borderRadius: 14, backgroundColor: '#1f2937' },
  title: { color: 'white', fontWeight: '700', fontSize: 16 },
  desc: { color: '#cbd5e1', marginTop: 6 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  meta: { color: '#93c5fd', fontWeight: '600' },
  empty: { color: '#9ca3af' },
});
