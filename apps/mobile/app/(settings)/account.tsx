import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { BackHeader } from '../../components/app-chrome';
import { AccountProviderButtons } from '../../components/auth/AccountProviderButtons';
import { AccountStatusCard } from '../../components/auth/AccountStatusCard';
import { SafeAreaView } from '../../components/SafeAreaView';
import { COLORS, SHADOWS } from '../../constants/theme';
import { getAccountService } from '../../lib/auth/accountService';
import {
  getAppleCredential,
  getGoogleCredential,
} from '../../lib/auth/providers';
import type { AccountSnapshot, ProviderCredential } from '../../lib/auth/types';
import { useTranslation } from '../../lib/i18n';
import { resetAppOnDevice } from '../../lib/safety/localDataControls';
import { getIdentityIfExists } from '../../lib/sync/identity';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';

type Provider = ProviderCredential['provider'];

function isProviderCancellation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'CANCELLED' || error.code === 'ERR_REQUEST_CANCELED')
  );
}

function isProviderUnavailable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'PROVIDER_UNAVAILABLE'
  );
}

function localOnlySnapshot(): AccountSnapshot {
  return {
    status: 'local-only',
    userId: null,
    providers: [],
    error: null,
  };
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const latestSyncAt = useCoupleLinkStore(
    (state) => state.link?.lastSyncedAt ?? null
  );
  const hasPausedLink = useCoupleLinkStore(
    (state) => state.link?.status === 'active'
  );
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [identityCreatedAt, setIdentityCreatedAt] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    'link' | 'sign-out' | 'forget' | 'delete' | null
  >(null);
  const [deletionProviderUnavailable, setDeletionProviderUnavailable] =
    useState(false);
  const mountedRef = useRef(true);
  const deletionInFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    const [nextSnapshot, identity] = await Promise.all([
      getAccountService().getSnapshot(),
      getIdentityIfExists(),
    ]);
    if (!mountedRef.current) return;
    setSnapshot(nextSnapshot);
    setIdentityCreatedAt(identity?.identity.createdAt ?? null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh().catch(() => {
      if (mountedRef.current) setSnapshot(null);
    });
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const handleProviderCredential = useCallback(
    async (credential: ProviderCredential) => {
      setError(null);
      setPendingAction('link');
      try {
        const nextSnapshot = await getAccountService().linkProvider(credential);
        if (mountedRef.current) setSnapshot(nextSnapshot);
      } catch {
        if (mountedRef.current) setError(t.settings.linkProviderFailed);
      } finally {
        if (mountedRef.current) setPendingAction(null);
      }
    },
    [t.settings.linkProviderFailed]
  );

  const handleProviderError = useCallback(
    (providerError: unknown) => {
      if (isProviderCancellation(providerError)) return;
      setError(t.settings.linkProviderFailed);
    },
    [t.settings.linkProviderFailed]
  );

  const signOut = useCallback(async () => {
    if (pendingAction) return;
    setError(null);
    setPendingAction('sign-out');
    try {
      await getAccountService().signOut();
      if (mountedRef.current) setSnapshot(localOnlySnapshot());
    } catch {
      if (mountedRef.current) setError(t.settings.signOutFailed);
    } finally {
      if (mountedRef.current) setPendingAction(null);
    }
  }, [pendingAction, t.settings.signOutFailed]);

  const forgetDevice = useCallback(async () => {
    if (pendingAction) return;
    setError(null);
    setPendingAction('forget');
    try {
      await getAccountService().forgetCurrentDevice();
      if (mountedRef.current) {
        setSnapshot(localOnlySnapshot());
        setIdentityCreatedAt(null);
      }
    } catch (forgetError) {
      if (mountedRef.current) {
        setError(
          forgetError instanceof Error &&
            'code' in forgetError &&
            forgetError.code === 'DEVICE_NOT_FOUND'
            ? t.settings.forgetDeviceNotFound
            : t.settings.forgetDeviceFailed
        );
      }
    } finally {
      if (mountedRef.current) setPendingAction(null);
    }
  }, [
    pendingAction,
    t.settings.forgetDeviceFailed,
    t.settings.forgetDeviceNotFound,
  ]);

  const deleteCurrentAccount = useCallback(async () => {
    if (!mountedRef.current || deletionInFlightRef.current) return;

    deletionInFlightRef.current = true;
    setPendingAction('delete');
    let provider: Provider | null = null;
    try {
      const service = getAccountService();
      provider = await service.getDeletionProvider();
      // Google classic native sign-in has no nonce parameter. Bind it to the
      // original session with a short-lived one-time server challenge first.
      const deletionProof = await service.prepareAccountDeletion(provider);
      const credential =
        provider === 'apple'
          ? await getAppleCredential()
          : await getGoogleCredential();

      // A confirmation callback can outlive this screen. Do not begin a
      // destructive server operation after its owning screen has gone away.
      if (!mountedRef.current) return;

      setError(null);
      await service.deleteAccount(credential, deletionProof);

      try {
        // The service resolves only after the Edge Function has returned 204.
        // A reset failure is therefore not a deletion failure: the account is
        // already gone and the user needs an honest local-cleanup message.
        await resetAppOnDevice();
      } catch {
        if (mountedRef.current) {
          setError(t.settings.deleteAccountCleanupFailed);
        }
        return;
      }

      if (mountedRef.current) router.replace('/welcome');
    } catch (deleteError) {
      if (!isProviderCancellation(deleteError) && mountedRef.current) {
        if (provider === 'apple' && isProviderUnavailable(deleteError)) {
          setDeletionProviderUnavailable(true);
          setError(t.settings.deleteAccountAppleIosRequired);
        } else {
          setError(t.settings.deleteAccountFailed);
        }
      }
    } finally {
      deletionInFlightRef.current = false;
      if (mountedRef.current) setPendingAction(null);
    }
  }, [
    router,
    t.settings.deleteAccountAppleIosRequired,
    t.settings.deleteAccountCleanupFailed,
    t.settings.deleteAccountFailed,
  ]);

  const providers = snapshot?.providers ?? [];
  const isAppleOnly =
    providers.includes('apple') && !providers.includes('google');
  const availableProviders: Provider[] =
    Platform.OS === 'ios' ? ['google', 'apple'] : ['google'];
  const actionPending = pendingAction !== null;
  const deletionUnavailable =
    snapshot?.status !== 'permanent' || deletionProviderUnavailable;
  // A signed-out device keeps its link and pauses sync. Linking a provider onto
  // a session that does not exist is not the way back; restoring the account is.
  const isSignedOut =
    snapshot !== null && snapshot.status === 'local-only' && hasPausedLink;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader
        title={t.settings.accountAndDevices}
        subtitle={t.settings.accountAndDevicesSubtitle}
        onBack={() => router.back()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <AccountStatusCard
          snapshot={snapshot}
          lastLocalSyncAt={latestSyncAt}
          deviceAddedAt={identityCreatedAt}
        />

        {isSignedOut ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.settings.signedOutTitle}</Text>
            <Text style={styles.cardCopy}>{t.settings.signedOutCopy}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={actionPending}
              onPress={() => router.push('/(auth)/restore')}
              style={[styles.secondaryAction, actionPending && styles.disabled]}
            >
              <Text style={styles.secondaryActionText}>
                {t.settings.signInAndResume}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.settings.linkedProviders}</Text>
          <Text style={styles.cardCopy}>{t.settings.linkedProvidersCopy}</Text>
          {isAppleOnly ? (
            <Text style={styles.warning}>
              {t.settings.linkGoogleForAndroidRecovery}
            </Text>
          ) : null}
          {availableProviders.map((provider) => {
            const linked = providers.includes(provider);
            const providerName =
              provider === 'apple' ? t.settings.apple : t.settings.google;
            return (
              <View key={provider} style={styles.providerRow}>
                <View style={styles.providerCopy}>
                  <Text style={styles.providerName}>{providerName}</Text>
                  <Text
                    style={
                      linked ? styles.providerLinked : styles.providerMissing
                    }
                  >
                    {linked ? t.settings.linked : t.settings.notLinked}
                  </Text>
                </View>
                {!linked ? (
                  <AccountProviderButtons
                    provider={provider}
                    actionLabel={
                      provider === 'apple'
                        ? t.settings.linkApple
                        : t.settings.linkGoogle
                    }
                    disabled={actionPending}
                    onCredential={handleProviderCredential}
                    onError={handleProviderError}
                    onPendingChange={(pending) => {
                      setPendingAction((current) =>
                        pending ? 'link' : current === 'link' ? null : current
                      );
                    }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.settings.session}</Text>
          <Text style={styles.cardCopy}>{t.settings.sessionCopy}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={actionPending}
            onPress={() =>
              Alert.alert(
                t.settings.signOutConfirmTitle,
                t.settings.signOutConfirmBody,
                [
                  { text: t.common.cancel, style: 'cancel' },
                  { text: t.settings.signOut, onPress: signOut },
                ]
              )
            }
            style={[styles.secondaryAction, actionPending && styles.disabled]}
          >
            <Text style={styles.secondaryActionText}>{t.settings.signOut}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={actionPending}
            onPress={() =>
              Alert.alert(
                t.settings.forgetDeviceConfirmTitle,
                t.settings.forgetDeviceConfirmBody,
                [
                  { text: t.common.cancel, style: 'cancel' },
                  {
                    text: t.settings.forgetThisDevice,
                    style: 'destructive',
                    onPress: forgetDevice,
                  },
                ]
              )
            }
            style={[styles.dangerAction, actionPending && styles.disabled]}
          >
            <Text style={styles.dangerActionText}>
              {pendingAction === 'forget'
                ? t.settings.forgettingDevice
                : t.settings.forgetThisDevice}
            </Text>
          </Pressable>
        </View>

        <View style={styles.deleteCard}>
          <Text style={styles.cardTitle}>{t.settings.deleteAccount}</Text>
          <Text style={styles.cardCopy}>{t.settings.deleteAccountCopy}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.settings.deleteAccount}
            accessibilityState={{
              disabled: actionPending || deletionUnavailable,
            }}
            disabled={actionPending || deletionUnavailable}
            onPress={() =>
              Alert.alert(
                t.settings.deleteAccountConfirmTitle,
                t.settings.deleteAccountConfirmBody,
                [
                  { text: t.common.cancel, style: 'cancel' },
                  {
                    text: t.settings.deleteAccount,
                    style: 'destructive',
                    onPress: deleteCurrentAccount,
                  },
                ]
              )
            }
            style={[
              styles.dangerAction,
              (actionPending || deletionUnavailable) && styles.disabled,
            ]}
          >
            <Text style={styles.dangerActionText}>
              {pendingAction === 'delete'
                ? t.settings.deletingAccount
                : t.settings.deleteAccount}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 16,
  },
  card: {
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16,
    ...SHADOWS.card,
  },
  deleteCard: {
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.45)',
    backgroundColor: COLORS.card,
    padding: 16,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  cardCopy: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
  },
  warning: {
    color: COLORS.maybe,
    fontSize: 16,
    fontWeight: '800',
  },
  providerRow: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  providerCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  providerName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  providerLinked: {
    color: COLORS.yes,
    fontSize: 16,
    fontWeight: '700',
  },
  providerMissing: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  error: {
    color: COLORS.no,
    fontSize: 16,
    lineHeight: 23,
  },
  secondaryAction: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryActionText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  dangerAction: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.55)',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  dangerActionText: {
    color: COLORS.no,
    fontSize: 16,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.55,
  },
});
