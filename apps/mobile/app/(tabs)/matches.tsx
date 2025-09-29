// apps/mobile/app/(tabs)/matches.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import SettingsButton from '../../src/components/SettingsButton';
import { useProfilesStore } from '../../src/stores/profiles';
import { useVotesStore, MutualBuckets } from '../../src/stores/votes';
import { useSettings } from '../../lib/state/useStore';
import { useKinks } from '../../lib/data';

const EMPTY_BUCKETS: MutualBuckets = {
  mutualYes: [],
  partialYesMaybe: [],
  mutualMaybe: [],
};

type MatchFilterKey = keyof MutualBuckets;

type PartnerOption = {
  id: string;
  label: string;
};

type MatchRow = {
  id: string;
  title: string;
  tier?: string;
  category?: string;
};

export default function MatchesScreen() {
  const router = useRouter();
  const { language } = useSettings();

  const { hydrated, activeId, profiles } = useProfilesStore(
    useShallow((state) => ({
      hydrated: state.isHydrated(),
      activeId: state.getActiveProfileId(),
      profiles: state.getProfiles(),
    }))
  );

  useEffect(() => {
    if (hydrated && !activeId) {
      router.replace('/welcome');
    }
  }, [hydrated, activeId, router]);

  const partners = useMemo(
    () => profiles.filter((profile) => profile.id !== activeId),
    [profiles, activeId]
  );

  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!partners.length) {
      setSelectedPartnerId(null);
      setPartnerPickerOpen(false);
      return;
    }

    if (partners.length <= 1) {
      setPartnerPickerOpen(false);
    }

    if (!selectedPartnerId || !partners.some((p) => p.id === selectedPartnerId)) {
      setSelectedPartnerId(partners[0].id);
    }
  }, [partners, selectedPartnerId]);

  const partnerProfile = partners.find((p) => p.id === selectedPartnerId) ?? null;

  const { kinksById } = useKinks(language === 'es' ? 'es' : 'en');

  const buckets = useVotesStore((state) => {
    if (!activeId || !partnerProfile) {
      return EMPTY_BUCKETS;
    }
    return state.getMutuals(activeId, partnerProfile.id);
  });

  const [filterKey, setFilterKey] = useState<MatchFilterKey>('mutualYes');

  useEffect(() => {
    // Reset to Mutual Yes whenever partner changes so the UI stays predictable
    setFilterKey('mutualYes');
  }, [partnerProfile?.id]);

  const filterOptions = useMemo(() => (
    [
      { key: 'mutualYes' as MatchFilterKey, label: 'Mutual Yes', data: buckets.mutualYes },
      { key: 'partialYesMaybe' as MatchFilterKey, label: 'Partial', data: buckets.partialYesMaybe },
      { key: 'mutualMaybe' as MatchFilterKey, label: 'Maybe', data: buckets.mutualMaybe },
    ]
  ), [buckets]);

  const activeIds = filterOptions.find((opt) => opt.key === filterKey)?.data ?? [];

  const rows: MatchRow[] = useMemo(() => {
    const mapped = activeIds
      .map((id) => {
        const item = kinksById[id];
        if (!item) {
          return {
            id,
            title: id,
            tier: undefined,
            category: 'Other',
          } satisfies MatchRow;
        }
        return {
          id: item.id,
          title: item.title,
          tier: item.tier,
          category: item.category,
        } satisfies MatchRow;
      })
      .filter(Boolean) as MatchRow[];

    return mapped.sort((a, b) => {
      const catA = (a.category ?? '').toLowerCase();
      const catB = (b.category ?? '').toLowerCase();
      if (catA === catB) {
        return a.title.localeCompare(b.title);
      }
      return catA.localeCompare(catB);
    });
  }, [activeIds, kinksById]);

  if (!hydrated || !activeId) {
    return null;
  }

  if (!profiles.length) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>No profiles yet</Text>
        <Text style={styles.p}>Create a profile to start swiping and build matches.</Text>
        <SettingsButton />
      </SafeAreaView>
    );
  }

  const activeProfile = profiles.find((profile) => profile.id === activeId) ?? null;

  if (!partners.length || !partnerProfile) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>Need two profiles</Text>
        <Text style={styles.p}>Create another profile in Settings → Profiles to compare matches.</Text>
        <SettingsButton />
      </SafeAreaView>
    );
  }

  const partnerOptions: PartnerOption[] = partners.map((profile) => ({
    id: profile.id,
    label: `${profile.emoji} ${profile.displayName ?? profile.name}`,
  }));

  const hasAnyMatches = filterOptions.some((opt) => opt.data.length > 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.subtitle}>
          {activeProfile?.emoji} {activeProfile?.displayName ?? activeProfile?.name} • {partnerProfile.emoji} {partnerProfile.displayName ?? partnerProfile.name}
        </Text>
      </View>

      {partners.length > 1 ? (
        <View style={styles.partnerPicker}>
          <Pressable
            style={styles.partnerButton}
            accessibilityRole="button"
            accessibilityLabel="Choose partner to compare"
            onPress={() => setPartnerPickerOpen((prev) => !prev)}
          >
            <Text style={styles.partnerButtonLabel}>
              Viewing with {partnerProfile.emoji} {partnerProfile.displayName ?? partnerProfile.name}
            </Text>
          </Pressable>
          {partnerPickerOpen ? (
            <View style={styles.partnerDropdown}>
              {partnerOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.partnerOption,
                    option.id === partnerProfile.id && styles.partnerOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedPartnerId(option.id);
                    setPartnerPickerOpen(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.partnerOptionLabel,
                      option.id === partnerProfile.id && styles.partnerOptionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.tabs}>
        {filterOptions.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabButton, filterKey === tab.key && styles.tabButtonActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: filterKey === tab.key }}
            onPress={() => setFilterKey(tab.key)}
          >
            <Text style={[styles.tabLabel, filterKey === tab.key && styles.tabLabelActive]}>
              {tab.label} ({tab.data.length})
            </Text>
          </Pressable>
        ))}
      </View>

      {hasAnyMatches ? (
        rows.length ? (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  {item.category ? <Text style={styles.rowMeta}>{item.category}</Text> : null}
                </View>
                {item.tier ? <Text style={styles.rowTier}>{item.tier.toUpperCase()}</Text> : null}
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No {filterOptions.find((tab) => tab.key === filterKey)?.label.toLowerCase()} yet</Text>
            <Text style={styles.emptyCopy}>Keep swiping to uncover more in this bucket.</Text>
          </View>
        )
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyCopy}>Keep swiping together—only mutual interest shows up here.</Text>
        </View>
      )}

      <SettingsButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14', paddingBottom: 12 },
  wrap: {
    flex: 1,
    backgroundColor: '#0b0f14',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  h1: { color: 'white', fontWeight: '900', fontSize: 22 },
  p: { color: '#94a3b8' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 6 },
  title: { color: 'white', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#93c5fd', fontWeight: '600' },
  partnerPicker: { paddingHorizontal: 16, marginBottom: 8 },
  partnerButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
  },
  partnerButtonLabel: { color: 'white', fontWeight: '700' },
  partnerDropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  partnerOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  partnerOptionActive: {
    backgroundColor: '#1d4ed8',
  },
  partnerOptionLabel: { color: 'white', fontWeight: '600' },
  partnerOptionLabelActive: { color: 'white' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  tabLabel: { color: '#cbd5e1', fontWeight: '700' },
  tabLabelActive: { color: 'white' },
  listContent: { paddingBottom: 24, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rowTitle: { color: 'white', fontWeight: '700', fontSize: 16 },
  rowMeta: { color: '#a1a1aa', fontSize: 13, marginTop: 4 },
  rowTier: { color: '#f97316', fontWeight: '800' },
  separator: { height: 1, backgroundColor: '#111827' },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  emptyTitle: { color: 'white', fontWeight: '800', fontSize: 18 },
  emptyCopy: { color: '#94a3b8', textAlign: 'center' },
});
