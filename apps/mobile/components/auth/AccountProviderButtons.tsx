import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../../constants/theme';
import {
  getAppleCredential,
  getGoogleCredential,
  isAppleAvailable,
} from '../../lib/auth/providers';
import type { ProviderCredential } from '../../lib/auth/types';
import { ui } from '../../lib/i18n/uiLiteral';

type Provider = ProviderCredential['provider'];

type AccountProviderButtonsProps = {
  onCredential: (credential: ProviderCredential) => Promise<void>;
  onError: (error: unknown) => void;
  disabled?: boolean;
  provider?: Provider;
  actionLabel?: string;
};

export function AccountProviderButtons({
  onCredential,
  onError,
  disabled = false,
  provider,
  actionLabel,
}: AccountProviderButtonsProps) {
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);

  useEffect(() => {
    let active = true;
    isAppleAvailable()
      .then((available) => {
        if (active) setAppleAvailable(available);
      })
      .catch(() => {
        if (active) setAppleAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const runProvider = async (
    selectedProvider: Provider,
    getCredential: () => Promise<ProviderCredential>
  ) => {
    try {
      setPendingProvider(selectedProvider);
      await onCredential(await getCredential());
    } catch (error) {
      onError(error);
    } finally {
      setPendingProvider(null);
    }
  };

  const showGoogle = !provider || provider === 'google';
  const showApple = appleAvailable && (!provider || provider === 'apple');

  return (
    <View style={styles.buttons}>
      {showGoogle ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled || pendingProvider !== null}
          onPress={() => {
            runProvider('google', getGoogleCredential);
          }}
          style={[
            styles.button,
            (disabled || pendingProvider !== null) && styles.disabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {pendingProvider === 'google'
              ? ui('Continuing...')
              : (actionLabel ?? ui('Continue with Google'))}
          </Text>
        </Pressable>
      ) : null}
      {showApple ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled || pendingProvider !== null}
          onPress={() => {
            runProvider('apple', getAppleCredential);
          }}
          style={[
            styles.button,
            (disabled || pendingProvider !== null) && styles.disabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {pendingProvider === 'apple'
              ? ui('Continuing...')
              : (actionLabel ?? ui('Continue with Apple'))}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: {
    gap: 10,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#fff',
  },
  disabled: {
    opacity: 0.55,
  },
});
