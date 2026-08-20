import React, { useState } from 'react';
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
import { ui } from '../../lib/i18n/uiLiteral';

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : ui('Could not restore your account.');
}

export default function RestoreAccountScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const restore = async (credential: ProviderCredential) => {
    setError(null);
    setIsRestoring(true);
    try {
      await getAccountService().signIn(credential);
      const result = await recoverPermanentAccount({
        requireProfileConfirmation: true,
      });

      if (result.kind === 'no-couple') {
        router.replace('/(onboarding)/partner-connect');
        return;
      }

      await useProfilesStore.getState().hydrate();
      const link = useCoupleLinkStore.getState().link;
      const destination = getRecoveryDestination({
        profileCount: useProfilesStore.getState().getProfiles().length,
        requiresConfirmation: link?.requiresProfileConfirmation ?? true,
      });
      router.replace(destination as never);
    } catch (restoreError) {
      setError(getErrorMessage(restoreError));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <BackHeader title={ui('Restore existing account')} />
      <View style={styles.content}>
        <Text style={styles.title}>{ui('Welcome back')}</Text>
        <Text style={styles.body}>
          {ui(
            'Sign in with the account you used before to restore your partner connection.'
          )}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AccountProviderButtons
          disabled={isRestoring}
          onCredential={restore}
          onError={(providerError) => setError(getErrorMessage(providerError))}
        />
        <Pressable
          accessibilityRole="button"
          disabled={isRestoring}
          onPress={() => router.back()}
          style={[styles.back, isRestoring && styles.disabled]}
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
