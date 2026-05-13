// apps/mobile/app/_layout.tsx
import 'react-native-gesture-handler';

import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { initializeNotifications } from '../lib/notifications';
import { useStreakStore } from '../lib/achievements';
import BiometricLockGate from '../components/BiometricLockGate';
import { STACK_SCREEN_OPTIONS } from '../lib/navigation/transitions';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { startSyncLoop, stopSyncLoop, syncOnce } from '../lib/sync/syncLoop';
import { startVoteSync } from '../lib/sync/voteSync';

export default function RootLayout() {
  useEffect(() => {
    initializeNotifications().then((success) => {
      if (success) {
        console.log('[App] Notifications initialized');
      }
    });

    const { checkAndUpdateStreak } = useStreakStore.getState();
    const result = checkAndUpdateStreak();
    if (result.streakUpdated) {
      console.log('[App] Streak updated:', result);
    }
  }, []);

  useEffect(() => {
    startVoteSync();
    const link = useCoupleLinkStore.getState().link;
    if (link && link.status === 'active') startSyncLoop();

    const unsubLink = useCoupleLinkStore.subscribe((state) => {
      if (state.link?.status === 'active') startSyncLoop();
      else stopSyncLoop();
    });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        const current = useCoupleLinkStore.getState().link;
        if (current?.status === 'active')
          void syncOnce().catch(() => undefined);
      }
    });

    return () => {
      unsubLink();
      appStateSub.remove();
      stopSyncLoop();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <BiometricLockGate>
          <View style={styles.background}>
            <Stack screenOptions={STACK_SCREEN_OPTIONS}>
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(settings)" />
              <Stack.Screen name="(game)" />
              <Stack.Screen name="(insights)" />
              <Stack.Screen name="(unlock)" />
              <Stack.Screen name="(redeem)" />
              <Stack.Screen name="(conversation)" />
            </Stack>
          </View>
        </BiometricLockGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
});
