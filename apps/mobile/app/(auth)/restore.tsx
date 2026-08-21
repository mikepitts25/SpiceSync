import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AccountProviderButtons } from '../../components/auth/AccountProviderButtons';
import { BackHeader } from '../../components/app-chrome';
import { SafeAreaView } from '../../components/SafeAreaView';
import { COLORS, FONTS } from '../../constants/theme';
import { getAccountService } from '../../lib/auth/accountService';
import { getRecoveryDestination } from '../../lib/auth/recoveryRouting';
import type { ProviderCredential } from '../../lib/auth/types';
import { useProfilesStore } from '../../lib/state/profiles';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { recoverPermanentAccount } from '../../lib/sync/inviteFlow';
import { startSyncLoop } from '../../lib/sync/syncLoop';
import { startVoteSync, useVoteSyncStore } from '../../lib/sync/voteSync';
import { ui } from '../../lib/i18n/uiLiteral';

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : ui('Could not restore your account.');
}

function isProviderCancellation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'CANCELLED' || error.code === 'ERR_REQUEST_CANCELED')
  );
}

export default function RestoreAccountScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isProviderOperationPending, setIsProviderOperationPending] =
    useState(false);
  const sessionIdRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sessionIdRef.current += 1;
    };
  }, []);

  const isCurrentSession = (sessionId: number) =>
    mountedRef.current && sessionId === sessionIdRef.current;

  const restore = async (credential: ProviderCredential) => {
    const sessionId = sessionIdRef.current;
    if (!isCurrentSession(sessionId)) return;
    setError(null);
    setIsRestoring(true);
    try {
      await getAccountService().signIn(credential);
      if (!isCurrentSession(sessionId)) return;
      const result = await recoverPermanentAccount({
        requireProfileConfirmation: true,
      });
      if (!isCurrentSession(sessionId)) return;

      if (result.kind === 'no-couple') {
        router.replace('/(onboarding)/partner-connect');
        return;
      }

      await useProfilesStore.getState().hydrate();
      if (!isCurrentSession(sessionId)) return;
      const link = useCoupleLinkStore.getState().link;
      const destination = getRecoveryDestination({
        profileCount: useProfilesStore.getState().getProfiles().length,
        requiresConfirmation: link?.requiresProfileConfirmation ?? true,
      });

      // Signing back into the same account recovers a link that needs no
      // confirmation, so the confirm-profile screen that normally restarts sync
      // is skipped. Resume here instead, or votes stay unsent until an AppState
      // transition happens to restart the subscription.
      if (destination === '/(tabs)/deck') {
        const activeProfileId =
          useProfilesStore.getState().getActiveProfileId() ?? null;
        useVoteSyncStore.getState().setLocalProfileId(activeProfileId);
        await startVoteSync(activeProfileId);
        if (!isCurrentSession(sessionId)) return;
        startSyncLoop();
      }

      router.replace(destination as never);
    } catch (restoreError) {
      if (isCurrentSession(sessionId)) {
        setError(getErrorMessage(restoreError));
      }
    } finally {
      if (isCurrentSession(sessionId)) {
        setIsRestoring(false);
      }
    }
  };

  const handleProviderPendingChange = (pending: boolean) => {
    if (!mountedRef.current) return;
    if (pending) {
      // Credentials obtained after a cancelled/backed-out provider operation
      // must not resurrect this route or navigate it later.
      sessionIdRef.current += 1;
    }
    setIsProviderOperationPending(pending);
  };

  const handleBack = () => {
    if (isRestoring || isProviderOperationPending) return;
    sessionIdRef.current += 1;
    router.back();
  };

  const handleProviderError = (providerError: unknown) => {
    if (!mountedRef.current || isProviderCancellation(providerError)) return;
    setError(getErrorMessage(providerError));
  };

  const isBusy = isRestoring || isProviderOperationPending;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <BackHeader title={ui('Restore existing account')} onBack={handleBack} />
      <View style={styles.content}>
        <Text style={styles.title}>{ui('Welcome back')}</Text>
        <Text style={styles.body}>
          {ui(
            'Sign in with the account you used before to restore your partner connection.'
          )}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AccountProviderButtons
          disabled={isBusy}
          onCredential={restore}
          onError={handleProviderError}
          onPendingChange={handleProviderPendingChange}
        />
        <Pressable
          accessibilityRole="button"
          disabled={isBusy}
          onPress={handleBack}
          style={[styles.back, isBusy && styles.disabled]}
        >
          <Text style={styles.backText}>{ui('Back')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONTS.bold,
    fontSize: 28,
    textAlign: 'center',
  },
  body: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  error: {
    color: COLORS.no,
    fontFamily: FONTS.regular,
    fontSize: 16,
    textAlign: 'center',
  },
  back: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.55,
  },
});
