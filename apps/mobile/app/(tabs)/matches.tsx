// apps/mobile/app/(tabs)/matches.tsx
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { useProfiles } from '../../lib/state/profiles';
import { computeMatches } from '../../lib/state/votes';
import { useKinks } from '../../lib/data';
import { useSettings } from '../../lib/state/useStore';

export default function MatchesScreen() {
  const { language } = (useSettings() as any) || { language: 'en' };
  const { currentUserId, profiles } = useProfiles();
  const partnerId = useMemo(
    () => profiles.find(p => p.id !== currentUserId)?.id ?? null,
    [profiles, currentUserId]
  );
  const { kinks, kinksById } = useKinks(language === 'es' ? 'es' : 'en');

  // Compute all buckets, but we will only render Mutual YES + Mutual NO for now.
  const m = computeMatches(currentUserId, partnerId, kinks);
  const hiddenOneSidedCount = m.oneSided.length;

  const sections = useMemo(
    () => [
      { title: 'Mutual YES', data: m.mutualYes.map(id => kinksById[id]).filter(Boolean) },
      { title: 'Mutual NO', data: m.mutualNo.map(id => kinksById[id]).filter(Boolean) },
    ],
    [m.mutualYes, m.mutualNo, kinksById]
  );

  const empty =
    (!!currentUserId && !!partnerId) &&
    sections.every(s => s.data.length === 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.h1}>Matches</Text>

      {(!currentUserId || !partnerId) ? (
        <Text style={styles.p}>
          Create two local profiles and swipe to see mutual matches.
        </Text>
      ) : empty ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.p}>No mutual matches yet. Keep swiping!</Text>
          {hiddenOneSidedCount > 0 && (
            <Text style={styles.muted}>
              {hiddenOneSidedCount} one-sided item(s) are currently hidden.
            </Text>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title, data } }) => (
            <View style={styles.header}>
              <Text style={styles.headerText}>{title} ({data.length})</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                <Text style={styles.meta}>Tier: {item.tier?.toUpperCase() || '—'}</Text>
                <Text style={styles.meta}>Intensity: {item.intensityScale}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListFooterComponent={
            hiddenOneSidedCount > 0 ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.muted}>
                  {hiddenOneSidedCount} one-sided item(s) hidden. They’ll be viewable later under the right conditions.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  h1: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 8 },
  p: { color: '#94a3b8' },
  muted: { color: '#64748b' },
  header: { paddingVertical: 6 },
  headerText: { color: '#93c5fd', fontWeight: '800' },
  card: { padding: 14, borderRadius: 14, backgroundColor: '#1f2937' },
  title: { color: 'white', fontWeight: '800', fontSize: 16 },
  desc: { color: '#cbd5e1', marginTop: 6 },
  meta: { color: '#93c5fd', fontWeight: '600' },
});
