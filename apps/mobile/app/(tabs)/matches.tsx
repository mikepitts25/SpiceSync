import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { useProfiles } from '../../lib/state/profiles';
import { computeMatches } from '../../lib/state/votes';
import { useKinks } from '../../lib/data';
import { useSettings } from '../../lib/state/useStore';
import { useVotes } from '../../lib/state/votes';

export default function MatchesScreen() {
  const { language } = (useSettings() as any) || { language: 'en' };
  const { profiles, currentUserId } = useProfiles();
  const partnerId = useMemo(
    () => profiles.find(p => p.id !== currentUserId)?.id ?? null,
    [profiles, currentUserId]
  );
  const aProfile = useMemo(() => profiles.find(p => p.id === currentUserId) || null, [profiles, currentUserId]);
  const bProfile = useMemo(() => profiles.find(p => p.id === partnerId) || null, [profiles, partnerId]);

  const { kinks, kinksById } = useKinks(language === 'es' ? 'es' : 'en');

  // Compute all buckets. We only render Mutual YES + Mutual NO right now, but keep oneSided for later.
  const m = computeMatches(currentUserId, partnerId, kinks);
  const hiddenOneSidedCount = m.oneSided.length;

  // Build sections for Mutuals only.
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

  // votes lookup for emoji logic
  const byUser = useVotes.getState().byUser;
  const has = (v: any) => v === 'yes' || v === 'no' || v === 'maybe';
  const isPos = (v: any) => v === 'yes' || v === 'maybe';

  /**
   * Decide which emoji to show for a given kink:
   * - Mutual (both have any vote): show both emoji (order: current then partner).
   * - One-sided positive (someone YES/MAYBE, other unset or NO): show that person's emoji only.
   * - Solo NO (only one 'no' and other unset): show none (ignored when one-sided hidden).
   */
  function emojiForKink(kinkId: string): string[] {
    if (!currentUserId || !partnerId) return [];
    const va = byUser[currentUserId]?.[kinkId]?.value ?? null;
    const vb = byUser[partnerId]?.[kinkId]?.value ?? null;

    // Mutual: both voted anything (YES/NO/MAYBE)
    if (has(va) && has(vb)) {
      const arr: string[] = [];
      if (aProfile?.emoji) arr.push(aProfile.emoji);
      if (bProfile?.emoji) arr.push(bProfile.emoji);
      return arr;
    }

    // If one-sided positive in future: show only the positive voter's emoji
    if (isPos(va) && !has(vb)) return aProfile?.emoji ? [aProfile.emoji] : [];
    if (isPos(vb) && !has(va)) return bProfile?.emoji ? [bProfile.emoji] : [];

    // Solo NO (one 'no' and other unset): no emoji
    return [];
  }

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
          renderItem={({ item }) => {
            const emojis = emojiForKink(item.id);
            return (
              <View style={styles.card}>
                <Text style={styles.title}>{item.title}</Text>
                {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <Text style={styles.meta}>Tier: {item.tier?.toUpperCase() || '—'}</Text>
                  <Text style={styles.meta}>Intensity: {item.intensityScale}</Text>
                </View>

                {/* Emoji badges bottom-right */}
                {emojis.length > 0 && (
                  <View style={styles.emojiWrap}>
                    {emojis.map((e, i) => (
                      <View key={i} style={[styles.emojiBadge, { right: i * 22 }]}>
                        <Text style={{ fontSize: 14 }}>{e}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
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
  card: { padding: 14, borderRadius: 14, backgroundColor: '#1f2937', position: 'relative' },
  title: { color: 'white', fontWeight: '800', fontSize: 16 },
  desc: { color: '#cbd5e1', marginTop: 6 },
  meta: { color: '#93c5fd', fontWeight: '600' },

  // Emoji badges
  emojiWrap: { position: 'absolute', bottom: 8, right: 8, height: 20, flexDirection: 'row' },
  emojiBadge: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 12,
    backgroundColor: '#0e1526',
    borderWidth: 1,
    borderColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
