// apps/mobile/app/_layout.tsx
import 'react-native-gesture-handler';
import 'react-native-get-random-values';

import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
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
import { useProfilesStore } from '../lib/state/profiles';
import { useVotesStore } from '../src/stores/votes';
import { bootstrapAccountState } from '../lib/auth/accountStore';
import BiometricLockGate from '../components/BiometricLockGate';
import { STACK_SCREEN_OPTIONS } from '../lib/navigation/transitions';
import {
  isCoupleLinkSyncable,
  shouldStartRemoteSyncForLinkTransition,
  useCoupleLinkStore,
} from '../lib/sync/coupleLink';
import {
  finalizePendingInvite,
  recoverExistingCouple,
} from '../lib/sync/inviteFlow';
import { cleanupLegacyPartnerCodes } from '../lib/sync/legacyPartnerCleanup';
import { startSyncLoop, stopSyncLoop, syncOnce } from '../lib/sync/syncLoop';
import { startVoteSync, useVoteSyncStore } from '../lib/sync/voteSync';
import {
  bindLegacyPendingToPersistedLink,
  useEventQueueStore,
} from '../lib/sync/eventQueue';
import { shouldInitializeNotificationsOnLaunch } from '../lib/notifications/environment';
import {
  isPurchaseProviderConfigured,
  purchaseService,
} from '../lib/purchases/purchaseService';
import { getNotificationDestination } from '../lib/notifications/routing';

export default function RootLayout() {
  useEffect(() => {
    let responseSubscription: { remove: () => void } | null = null;
    let cancelledResponseSetup = false;
    import('../lib/notifications')
      .then(
        async ({
          addNotificationResponseListener,
          getLastNotificationResponse,
        }) => {
          const openResponse = (response: {
            notification: {
              request: { content: { data?: Record<string, unknown> } };
            };
          }) => {
            const destination = getNotificationDestination(
              response.notification.request.content.data
            );
            if (destination) router.push(destination as never);
          };

          if (cancelledResponseSetup) return;
          responseSubscription = addNotificationResponseListener(openResponse);
          const lastResponse = await getLastNotificationResponse();
          if (!cancelledResponseSetup && lastResponse)
            openResponse(lastResponse);
        }
      )
      .catch((error) => {
        console.warn('[App] Notification response setup failed:', error);
      });

    if (isPurchaseProviderConfigured()) {
      purchaseService.initialize().catch((error) => {
        console.warn('[App] Purchase initialization failed:', error);
      });
    }

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
      cancelledResponseSetup = true;
      responseSubscription?.remove();
      if (isPurchaseProviderConfigured()) {
        purchaseService.dispose().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let recoveryInFlight = false;

    const recoverPartnerLink = async (discoverExisting: boolean = false) => {
      if (cancelled || recoveryInFlight) return;
      const linkState = useCoupleLinkStore.getState();
      if (linkState.link?.status === 'active' && !!linkState.link.ownerUserId) {
        return;
      }
      if (!linkState.pendingInviteId && !discoverExisting) return;
      recoveryInFlight = true;
      try {
        const result = linkState.pendingInviteId
          ? await finalizePendingInvite()
          : await recoverExistingCouple();
        if (!result || cancelled) return;
        await useProfilesStore.getState().hydrate();
        const activeProfileId =
          useProfilesStore.getState().getActiveProfileId() ?? null;
        await startVoteSync(activeProfileId);
        if (isCoupleLinkSyncable(useCoupleLinkStore.getState().link)) {
          startSyncLoop();
        }
      } catch {
        // The interval retries transient auth/network failures while the invite
        // remains pending. The partner setup screen shows actionable errors.
      } finally {
        recoveryInFlight = false;
      }
    };

    Promise.all([
      useCoupleLinkStore.persist.rehydrate(),
      useEventQueueStore.persist.rehydrate(),
      useVoteSyncStore.persist.rehydrate(),
      useVotesStore.persist.rehydrate(),
      useProfilesStore.getState().hydrate(),
    ])
      .then(async () => {
        if (cancelled) return;
        bindLegacyPendingToPersistedLink();
        await bootstrapAccountState();
        if (cancelled) return;
        const activeProfileId =
          useProfilesStore.getState().getActiveProfileId() ?? null;
        await startVoteSync(activeProfileId);
        const link = useCoupleLinkStore.getState().link;
        if (isCoupleLinkSyncable(link)) startSyncLoop();
        return recoverPartnerLink(true);
      })
      .catch(() => undefined);

    const recoveryHandle = setInterval(() => {
      recoverPartnerLink().catch(() => undefined);
    }, 4000);

    const unsubLink = useCoupleLinkStore.subscribe((state, previousState) => {
      if (
        !recoveryInFlight &&
        shouldStartRemoteSyncForLinkTransition(previousState.link, state.link)
      ) {
        startSyncLoop();
      } else if (!isCoupleLinkSyncable(state.link)) {
        stopSyncLoop();
      }
    });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        recoverPartnerLink(true).catch(() => undefined);
        const current = useCoupleLinkStore.getState().link;
        if (isCoupleLinkSyncable(current)) {
          const activeProfileId =
            useProfilesStore.getState().getActiveProfileId() ?? null;
          startVoteSync(activeProfileId)
            .then(() => syncOnce())
            .catch(() => undefined);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubLink();
      appStateSub.remove();
      clearInterval(recoveryHandle);
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
              <Stack.Screen name="(auth)" />
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
