import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { getAccountService } from '../../lib/auth/accountService';
import type { ProviderCredential } from '../../lib/auth/types';
import { ui } from '../../lib/i18n/uiLiteral';
import { AccountProviderButtons } from './AccountProviderButtons';

type OnboardingAccountProtectionProps = {
  onComplete: () => void | Promise<void>;
  onRestore: () => void;
};

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

function isProviderCancellation(error: unknown): boolean {
  return (
    hasErrorCode(error, 'CANCELLED') ||
    hasErrorCode(error, 'ERR_REQUEST_CANCELED')
  );
}

export function OnboardingAccountProtection({
  onComplete,
  onRestore,
}: OnboardingAccountProtectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleCredential = async (credential: ProviderCredential) => {
    setError(null);
    const account = await getAccountService().linkProvider(credential);
    if (account.accountChanged) {
      setError(
        ui(
          'This sign-in already belongs to an existing account. Restore it instead.'
        )
      );
      return;
    }
    await onComplete();
  };

  const handleProviderError = (providerError: unknown) => {
    if (isProviderCancellation(providerError)) {
      setError(null);
      return;
    }
    if (hasErrorCode(providerError, 'ACCOUNT_EXISTS')) {
      setError(
        ui(
          'This sign-in already belongs to an existing account. Restore it instead.'
        )
      );
      return;
    }
    setError(ui('Could not protect your account. Try again.'));
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconWrap}>
        <ShieldCheck size={52} color={COLORS.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{ui('Protect your account')}</Text>
      <Text style={styles.body}>
        {ui(
          'Optional: continue with Apple or Google so you can recover your account and protected partner connection on another device.'
        )}
      </Text>
      <Text style={styles.privacyNote}>
        {ui('Your private profiles, votes, and history stay on this device.')}
      </Text>

      <View style={styles.actions}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AccountProviderButtons
          disabled={isPending}
          onCredential={handleCredential}
          onError={handleProviderError}
          onPendingChange={setIsPending}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isPending }}
          disabled={isPending}
          onPress={onComplete}
          style={[styles.notNow, isPending && styles.disabled]}
        >
          <Text style={styles.notNowText}>{ui('Not now')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isPending }}
          disabled={isPending}
          onPress={onRestore}
          style={[styles.restore, isPending && styles.disabled]}
        >
          <Text style={styles.restoreText}>
            {ui('Already have an account? Restore it')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: SIZES.padding * 2,
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding * 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,45,146,0.12)',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    lineHeight: 24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  privacyNote: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    lineHeight: 20,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: SIZES.padding * 2,
  },
  actions: {
    gap: 10,
  },
  error: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    lineHeight: 20,
    color: COLORS.no,
    textAlign: 'center',
  },
  notNow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notNowText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  restore: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.small,
    color: COLORS.primary,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.55,
  },
});
