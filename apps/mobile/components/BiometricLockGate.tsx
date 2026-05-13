import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint } from 'lucide-react-native';

import {
  authenticateWithBiometrics,
  shouldLockForAppStateChange,
} from '../lib/lock';
import { useSettingsStore } from '../src/stores/settingsStore';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/theme';
import { SpiceSyncLogo } from './app-chrome';

function useSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useSettingsStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setHydrated(true);
      return undefined;
    }

    return useSettingsStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);

  return hydrated;
}

export default function BiometricLockGate({
  children,
}: PropsWithChildren) {
  const biometricLockEnabled = useSettingsStore(
    (state) => state.biometricLockEnabled
  );
  const settingsHydrated = useSettingsHydrated();
  const [locked, setLocked] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lockedRef = useRef(true);
  const authenticatingRef = useRef(false);
  const previousEnabledRef = useRef<boolean | null>(null);

  const updateLocked = useCallback((nextLocked: boolean) => {
    lockedRef.current = nextLocked;
    setLocked(nextLocked);
  }, []);

  const runAuthentication = useCallback(async () => {
    if (!settingsHydrated || !biometricLockEnabled) {
      updateLocked(false);
      return;
    }

    authenticatingRef.current = true;
    setAuthenticating(true);
    setMessage(null);

    const result = await authenticateWithBiometrics('Unlock SpiceSync');

    if (result.ok) {
      updateLocked(false);
      setMessage(null);
    } else {
      updateLocked(true);
      setMessage(result.message);
    }

    authenticatingRef.current = false;
    setAuthenticating(false);
  }, [biometricLockEnabled, settingsHydrated, updateLocked]);

  useEffect(() => {
    if (!settingsHydrated) {
      updateLocked(true);
      return;
    }

    const previouslyEnabled = previousEnabledRef.current;
    previousEnabledRef.current = biometricLockEnabled;

    if (!biometricLockEnabled) {
      updateLocked(false);
      setMessage(null);
      return;
    }

    if (previouslyEnabled === null) {
      updateLocked(true);
      runAuthentication().catch(() => {
        updateLocked(true);
        setMessage('Could not verify your identity. Try again.');
        authenticatingRef.current = false;
        setAuthenticating(false);
      });
      return;
    }

    if (previouslyEnabled === false) {
      updateLocked(false);
      setMessage(null);
    }
  }, [
    biometricLockEnabled,
    runAuthentication,
    settingsHydrated,
    updateLocked,
  ]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (
        shouldLockForAppStateChange({
          enabled: biometricLockEnabled,
          previousState,
          nextState,
          authenticating: authenticatingRef.current,
        })
      ) {
        updateLocked(true);
        setMessage(null);
        return;
      }

      if (
        settingsHydrated &&
        biometricLockEnabled &&
        nextState === 'active' &&
        lockedRef.current &&
        !authenticatingRef.current
      ) {
        runAuthentication().catch(() => {
          updateLocked(true);
          setMessage('Could not verify your identity. Try again.');
          authenticatingRef.current = false;
          setAuthenticating(false);
        });
      }
    });

    return () => subscription.remove();
  }, [
    biometricLockEnabled,
    runAuthentication,
    settingsHydrated,
    updateLocked,
  ]);

  const showLock = !settingsHydrated || (biometricLockEnabled && locked);
  const title = settingsHydrated ? 'SpiceSync is locked' : 'Securing SpiceSync';
  const subtitle =
    message ??
    (authenticating
      ? 'Waiting for verification.'
      : 'Verify with Face ID, Touch ID, or fingerprint to continue.');

  return (
    <View style={styles.container}>
      {children}
      {showLock ? (
        <View
          style={styles.lockScreen}
          accessibilityViewIsModal
          testID="biometric-lock-gate"
        >
          <SpiceSyncLogo width={178} height={67} style={styles.logo} />
          <View style={styles.panel}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.iconBadge}
            >
              <Fingerprint size={28} color={COLORS.textPrimary} />
            </LinearGradient>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {!settingsHydrated || authenticating ? (
              <ActivityIndicator color={COLORS.pink} />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={runAuthentication}
                style={styles.unlockPress}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.unlockButton}
                >
                  <Text style={styles.unlockText}>Unlock</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lockScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    marginBottom: 26,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 14,
    ...SHADOWS.card,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSub,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  unlockPress: {
    width: '100%',
    marginTop: 4,
  },
  unlockButton: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
});
