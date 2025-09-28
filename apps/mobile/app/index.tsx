// apps/mobile/app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useSettings } from '../lib/state/useStore';
import { useProfilesStore } from '../lib/state/profiles';
import { useShallow } from 'zustand/react/shallow';

export default function EntryGate() {
  const router = useRouter();
  const nav = useRootNavigationState();

  // Age gate from your settings store
  const { ageConfirmed, setAgeConfirmed } =
    (useSettings() as any) || { ageConfirmed: false, setAgeConfirmed: () => {} };

  // Profiles (same-device couple mode)
  const { hydrated, hasActiveProfile, profileCount } = useProfilesStore(
    useShallow((state) => ({
      hydrated: state.isHydrated(),
      hasActiveProfile: state.hasActiveProfile(),
      profileCount: state.getProfiles().length,
    }))
  );

  const [ready, setReady] = useState(false);
  useEffect(() => { if (nav?.key) setReady(true); }, [nav?.key]);

  // When router is ready and age is confirmed, decide destination based on profiles
  useEffect(() => {
    if (!ready) return;
    if (!ageConfirmed || !hydrated) return;

    if (!hasActiveProfile) {
      router.replace('/welcome'); // create first profile
    } else {
      router.replace('/(tabs)/categories'); // normal home
    }
  }, [ready, ageConfirmed, hydrated, hasActiveProfile, router]);

  // While waiting for router
  if (!ready) {
    return <View style={styles.center}><Text style={styles.h1}>Loading…</Text></View>;
  }

  // If already confirmed, show a small status (the effect above will redirect)
  if (ageConfirmed) {
    return (
      <View style={styles.center}>
        <Text style={styles.p}>
          {profileCount === 0 ? 'Preparing profile setup…' : 'Taking you to Categories…'}
        </Text>
      </View>
    );
  }

  // Age gate screen
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>Adults Only (18+)</Text>
      <Text style={styles.p}>
        This app is for adults exploring consensual intimacy. By continuing, you confirm you are at
        least 18 years old and agree to use it for legal, consensual, non-exploitative content.
      </Text>
      <View style={styles.card}>
        <Text style={styles.h2}>Safety & Consent</Text>
        <Text style={styles.li}>• Consent is required and can be revoked anytime.</Text>
        <Text style={styles.li}>• Agree on boundaries, safe words/signals, and aftercare.</Text>
        <Text style={styles.li}>• We disallow minors, non-consent, and unsafe acts.</Text>
      </View>
      <View style={styles.row}>
        <Pressable
          style={[styles.btn, styles.secondary]}
          onPress={() => Alert.alert('Notice', 'You must be 18+ to use this app.')}
        >
          <Text style={styles.btnText}>I’m not 18</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.primary]}
          onPress={() => { setAgeConfirmed(true); /* nav will route in effect above */ }}
        >
          <Text style={styles.btnStrong}>I’m 18 or older</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f14' },
  wrap: { padding: 18, gap: 14, backgroundColor: '#0b0f14', flexGrow: 1 },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  p: { fontSize: 16, color: '#94a3b8' },
  card: { backgroundColor: '#111827', padding: 14, borderRadius: 14 },
  h2: { fontSize: 18, fontWeight: '700', color: 'white', marginBottom: 6 },
  li: { color: '#cbd5e1', marginTop: 4 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primary: { backgroundColor: '#3b82f6' },
  secondary: { backgroundColor: '#1f2937' },
  btnText: { color: 'white', fontWeight: '700' },
  btnStrong: { color: 'white', fontWeight: '900' },
});
