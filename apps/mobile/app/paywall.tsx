import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePremium } from '../src/stores/premium';

export default function PaywallScreen() {
  const router = useRouter();
  const { isPro, setPro } = usePremium();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.h1}>SpiceSync Pro</Text>
      <Text style={styles.p}>
        Unlock extra content packs, couple games, and advanced privacy-first tools.
      </Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Included (planned)</Text>
        <Text style={styles.li}>• Spicier content packs (consent-first)</Text>
        <Text style={styles.li}>• Truth-or-dare style couple prompts</Text>
        <Text style={styles.li}>• Session mode (timer + aftercare)</Text>
        <Text style={styles.li}>• Advanced filters + "match of the day"</Text>
        <Text style={styles.li}>• Encrypted export/import</Text>
        <Text style={styles.meta}>
          Payments not wired yet in this build. This screen is a scaffold.
        </Text>
      </View>

      {__DEV__ ? (
        <Pressable
          onPress={() => setPro(!isPro)}
          style={[styles.btn, styles.devBtn]}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>DEV: Toggle Pro ({isPro ? 'ON' : 'OFF'})</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={() => router.back()} style={styles.btn} accessibilityRole="button">
        <Text style={styles.btnText}>Back</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 12, backgroundColor: '#0b0f14' },
  h1: { fontSize: 26, fontWeight: '900', color: 'white' },
  h2: { fontSize: 16, fontWeight: '900', color: 'white', marginBottom: 8 },
  p: { color: '#cbd5e1', fontSize: 16 },
  li: { color: '#e2e8f0', marginTop: 6 },
  meta: { color: '#94a3b8', marginTop: 10 },
  card: { backgroundColor: '#0e1526', borderWidth: 1, borderColor: '#111827', borderRadius: 14, padding: 14 },
  btn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  devBtn: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' },
  btnText: { color: 'white', fontWeight: '900' },
});
