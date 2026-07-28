// apps/mobile/app/_layout.tsx
import 'react-native-gesture-handler';
import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { useStreakStore } from '../lib/achievements';
import { collectBackfillSources } from '../lib/achievementBackfill';
import { useCoupleDiceStore } from '../lib/state/coupleDice';
import { useMatchMissionsStore } from '../lib/state/matchMissions';
import { useMatchPlansStore } from '../lib/state/matchPlans';
import BiometricLockGate from '../components/BiometricLockGate';
import { useDeepLinks } from '../lib/deepLinks';
import { STACK_SCREEN_OPTIONS } from '../lib/navigation/transitions';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { cleanupLegacyPartnerCodes } from '../lib/sync/legacyPartnerCleanup';
import { startSyncLoop, stopSyncLoop, syncOnce } from '../lib/sync/syncLoop';
import { startVoteSync } from '../lib/sync/voteSync';
import { shouldInitializeNotificationsOnLaunch } from '../lib/notifications/environment';

export default function RootLayout() {
  useDeepLinks();

  useEffect(() => {
    cleanupLegacyPartnerCodes();

    if (shouldInitializeNotificationsOnLaunch(Constants.appOwnership)) {
      import('../lib/notifications')
        .then(({ initializeNotifications }) => initializeNotifications())
        .then((success) => {
          if (success) {
            console.log('[App] Notifications initialized');
          }
        })
        .catch((error) => {
          console.error('[App] Notifications initialization failed:', error);
        });
    }

    // Top up the rolling notification queues so fired entries are replaced with
    // fresh messages instead of the queue draining. Deliberately outside the
    // guard above: that guard exists to avoid *requesting* permission on
    // launch, while refreshing is a no-op unless permission is already granted.
    import('../lib/notifications')
      .then(({ refreshScheduledNotifications }) =>
        refreshScheduledNotifications()
      )
      .catch((error) => {
        console.error('[App] Notification refresh failed:', error);
      });

    const { checkAndUpdateStreak } = useStreakStore.getState();
    const result = checkAndUpdateStreak();
    if (result.streakUpdated) {
      console.log('[App] Streak updated:', result);
    }

    // Credit history that predates achievement tracking. These stores
    // rehydrate from AsyncStorage asynchronously, so reading them on the
    // same tick would see empty state and permanently stamp a zero
    // backfill. Wait for every persisted source to finish rehydrating.
    let cancelled = false;
    Promise.all([
      useCoupleDiceStore.persist.rehydrate(),
      useMatchMissionsStore.persist.rehydrate(),
      useMatchPlansStore.persist.rehydrate(),
    ])
      .then(() => {
        if (cancelled) return;
        const applied = useStreakStore
          .getState()
          .applyBackfill(collectBackfillSources());
        if (applied) {
          console.log('[App] Retroactive achievement credit applied');
        }
      })
      .catch((error) => {
        console.error('[App] Achievement backfill failed:', error);
      });

    return () => {
      cancelled = true;
    };
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
        if (current?.status === 'active') {
          syncOnce().catch(() => undefined);
        }
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
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar style="light" />
        <BiometricLockGate>
          <View style={styles.background}>
            <Stack screenOptions={STACK_SCREEN_OPTIONS}>
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(settings)" />
              <Stack.Screen name="(game)" />
              <Stack.Screen name="(insights)" />
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
