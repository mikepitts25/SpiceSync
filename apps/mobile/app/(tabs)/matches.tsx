
// apps/mobile/app/(tabs)/matches.tsx
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { useProfiles } from '../../lib/state/profiles';
import { useSettings } from '../../lib/state/useStore';
import { useVotes } from '../../lib/state/votes';
import { useKinks } from '../../lib/data';
import { computeMatchBuckets, VoteValue } from '../../lib/match/compute';

export default function MatchesScreen() {
  const { profiles, currentUserId } = useProfiles();
  const { language } = useSettings();
  const votesStore = useVotes();
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en'); // UI language only; matching uses ids

  if (profiles.length < 2) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>Need two profiles</Text>
        <Text style={styles.p}>Create a second profile in Settings → Profiles to see matches.</Text>
      </SafeAreaView>
    );
  }

  const meIdx = Math.max(0, profiles.findIndex(p => p.id === currentUserId));
  const otherIdx = meIdx === 0 ? 1 : 0;
  const A = profiles[meIdx];
  const B = profiles[otherIdx];

  const getVotesFor = (uid: string): Record<string, VoteValue> => {
    const anyStore: any = votesStore;

    if (anyStore.byUser && typeof anyStore.byUser === 'object') {
      return anyStore.byUser[uid] || {};
    }

    if ('votesA' in anyStore || 'votesB' in anyStore) {
      const p0 = profiles[0]?.id;
      const p1 = profiles[1]?.id;
      if (uid === p0) return anyStore.votesA || {};
      if (uid === p1) return anyStore.votesB || {};
      return {};
    }

    return {};
  };

  const buckets = useMemo(
    () => computeMatchBuckets(A.id, B.id, kinks, getVotesFor),
    [A.id, B.id, kinks, votesStore]
  );

  const sections = [
    { key: 'mutualYes', title: 'Mutual Yes', data: buckets.mutualYes },
    { key: 'partial', title: 'Partial Match (Yes + Maybe)', data: buckets.partial },
    { key: 'mutualMaybe', title: 'Mutual Maybe', data: buckets.mutualMaybe },
  ].filter(s => s.data.length > 0);

  if (sections.length === 0) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>No matches yet</Text>
        <Text style={styles.p}>Keep swiping together. Mutual No and mismatches are hidden.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={styles.h1}>Matches</Text>
        <Text style={styles.p}>{A.emoji} {A.displayName}  •  {B.emoji} {B.displayName}</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.rowItem}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemTier}>{item.tier?.toUpperCase() ?? ''}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  wrap: { flex: 1, backgroundColor: '#0b0f14', padding: 16, gap: 8, justifyContent: 'center' },
  h1: { color: 'white', fontWeight: '900', fontSize: 22 },
  p: { color: '#94a3b8' },
  headerRow: { padding: 16, paddingBottom: 8 },
  sectionTitle: { color: '#93c5fd', fontWeight: '800', fontSize: 14, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  rowItem: {
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  itemTitle: { color: 'white', fontWeight: '700', flex: 1 },
  itemTier: { color: '#9ca3af', fontWeight: '600' },
  sep: { height: 1, backgroundColor: '#111827', marginLeft: 16 },
});
