// Root entry point - redirects based on user state
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useSettings } from '../lib/state/useStore';
import { useProfilesStore } from '../lib/state/profiles';
import { getAppEntryDestination } from '../lib/welcome/routing';

export default function EntryGate() {
  const router = useRouter();
  const nav = useRootNavigationState();
  const [ready, setReady] = useState(false);

  const ageConfirmed = useSettings((state) => state.ageConfirmed);
  const { hydrated, hasActiveProfile } = useProfilesStore((state) => ({
    hydrated: state.isHydrated(),
    hasActiveProfile: state.hasActiveProfile(),
  }));

  useEffect(() => {
    if (nav?.key) setReady(true);
  }, [nav?.key]);

  // Route based on state
  useEffect(() => {
    if (!ready) return;

    const destination = getAppEntryDestination(
      ageConfirmed,
      hydrated,
      hasActiveProfile
    );

    if (destination) {
      router.replace(destination as never);
    }
  }, [ready, ageConfirmed, hydrated, hasActiveProfile, router]);

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
