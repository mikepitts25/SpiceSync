import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../../constants/theme';
import { getAccountService } from '../../lib/auth/accountService';
import type { ProviderCredential } from '../../lib/auth/types';
import { ui } from '../../lib/i18n/uiLiteral';
import { AccountProviderButtons } from './AccountProviderButtons';

type PartnerAccountGateProps = {
  intent: 'protect';
  onComplete: () => void | Promise<void>;
  onCancel: () => void;
};

function isAccountExists(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ACCOUNT_EXISTS'
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : ui('Could not protect your connection.');
}

export function PartnerAccountGate({
  intent: _intent,
  onComplete,
  onCancel,
}: PartnerAccountGateProps) {
  const [existingProvider, setExistingProvider] = useState<
    ProviderCredential['provider'] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isProviderOperationPending, setIsProviderOperationPending] =
    useState(false);
  const sessionIdRef = useRef(0);

  const handleCredential = async (credential: ProviderCredential) => {
    const sessionId = sessionIdRef.current;
    setError(null);
    const accountService = getAccountService();

    if (existingProvider) {
      const result = await accountService.signIn(credential);
      if (result.accountChanged) {
        setError(
          ui(
            'Account switched. Restore that account before continuing partner setup.'
          )
        );
        return;
      }
    } else {
      try {
        await accountService.linkProvider(credential);
      } catch (linkError) {
        if (isAccountExists(linkError)) {
          setExistingProvider(credential.provider);
          return;
        }
        throw linkError;
      }
    }

    await accountService.requirePermanentUser();
    if (sessionId !== sessionIdRef.current) return;
    setIsCompleting(true);
    try {
      await onComplete();
    } finally {
      setIsCompleting(false);
    }
  };

  const handleError = (providerError: unknown) => {
    if (
      typeof providerError === 'object' &&
      providerError !== null &&
      'code' in providerError &&
      (providerError.code === 'CANCELLED' ||
        providerError.code === 'ERR_REQUEST_CANCELED')
    ) {
      handleCancel();
      return;
    }
    setError(errorMessage(providerError));
  };

  const handleProviderPendingChange = (pending: boolean) => {
    if (pending) {
      sessionIdRef.current += 1;
    }
    setIsProviderOperationPending(pending);
  };

  const handleCancel = () => {
    sessionIdRef.current += 1;
    onCancel();
  };

  const signingIntoExistingAccount = existingProvider !== null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {signingIntoExistingAccount
          ? ui('Your existing account')
          : ui('Protect your connection')}
      </Text>
      <Text style={styles.body}>
        {signingIntoExistingAccount
          ? ui(
              'This sign-in uses a new credential and switches to the account that already uses this provider.'
            )
          : ui(
              'Add a sign-in method to keep your encrypted partner connection available on this device.'
            )}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AccountProviderButtons
        provider={existingProvider ?? undefined}
        actionLabel={
          signingIntoExistingAccount
            ? ui('Sign into existing account')
            : undefined
        }
        disabled={isCompleting || isProviderOperationPending}
        onCredential={handleCredential}
        onError={handleError}
        onPendingChange={handleProviderPendingChange}
      />
      <Pressable
        accessibilityRole="button"
        disabled={isCompleting || isProviderOperationPending}
        onPress={handleCancel}
        style={[
          styles.notNow,
          (isCompleting || isProviderOperationPending) && styles.disabled,
        ]}
      >
        <Text style={styles.notNowText}>{ui('Not now')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.text,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.textSecondary,
  },
  error: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.no,
  },
  notNow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notNowText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.55,
  },
});
