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
  const partnerId = useMemo(() => profiles.find(p => p.id !== currentUserId)?.id ?? null, [profiles, currentUserId]);
  const { kinks, kinksById } = useKinks(language==='es'?'es':'en');

  const m = computeMatches(currentUserId, partnerId, kinks);

  const sections = useMemo(()=>[
    { title:'Mutual YES', data: m.mutualYes.map(id => kinksById[id]) },
    { title:'One-Sided', data: m.oneSided.map(x => kinksById[x.kinkId]) },
    { title:'Mutual NO', data: m.mutualNo.map(id => kinksById[id]) },
  ], [m, kinksById]);

  return (
    <SafeAreaView style={styles.screen} edges={['top','left','right']}>
      <Text style={styles.h1}>Matches</Text>
      {(!currentUserId || !partnerId) ? (
        <Text style={styles.p}>Need two local profiles with votes to compute matches.</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({section:{title,data}}) => (
            <View style={styles.header}><Text style={styles.headerText}>{title} ({data.length})</Text></View>
          )}
          renderItem={({item}) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
              <View style={{flexDirection:'row', gap:10, marginTop:6}}>
                <Text style={styles.meta}>Tier: {item.tier?.toUpperCase()}</Text>
                <Text style={styles.meta}>Intensity: {item.intensityScale}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24, gap:8 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, padding:12, backgroundColor:'#0b0f14' },
  h1: { fontSize:22, fontWeight:'800', color:'white', marginBottom:8 },
  p: { color:'#94a3b8' },
  header: { paddingVertical:6 },
  headerText: { color:'#93c5fd', fontWeight:'800' },
  card: { padding:14, borderRadius:14, backgroundColor:'#1f2937' },
  title: { color:'white', fontWeight:'800', fontSize:16 },
  desc: { color:'#cbd5e1', marginTop:6 },
  meta: { color:'#93c5fd', fontWeight:'600' },
});
