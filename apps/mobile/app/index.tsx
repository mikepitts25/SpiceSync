// Root entry point - redirects based on user state
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function EntryGate() {
  const router = useRouter();
  const nav = useRootNavigationState();
  const [ready, setReady] = useState(false);
  
  // Get state from unified store
  const ageVerified = useSettingsStore((state) => state.ageVerified);
  const activeProfileId = useSettingsStore((state) => state.activeProfileId);

  useEffect(() => {
    if (nav?.key) setReady(true);
  }, [nav?.key]);

  // Route based on state
  useEffect(() => {
    if (!ready) return;

    if (!ageVerified) {
      // Go to onboarding (privacy screen first for age verification)
      router.replace('/(onboarding)');
    } else if (!activeProfileId) {
      // Age verified but no profile - go to profile creation
      router.replace('/(onboarding)/profile');
    } else {
      // Fully onboarded - go to main app
      router.replace('/(tabs)');
    }
  }, [ready, ageVerified, activeProfileId, router]);

  // Loading state
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💑</Text>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  text: {
    color: '#A0A0B0',
    fontSize: 16,
  },
});
