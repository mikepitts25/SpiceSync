import * as LocalAuthentication from 'expo-local-authentication';
import type {
  LocalAuthenticationError,
  LocalAuthenticationResult,
} from 'expo-local-authentication';

type AppLockState =
  | 'active'
  | 'background'
  | 'inactive'
  | 'unknown'
  | 'extension';

type BiometricSupportApi = Pick<
  typeof LocalAuthentication,
  'hasHardwareAsync' | 'isEnrolledAsync'
>;

type BiometricAuthApi = BiometricSupportApi &
  Pick<typeof LocalAuthentication, 'authenticateAsync'>;

type BiometricSupport =
  | { available: true }
  | { available: false; reason: string };

type BiometricAuthResult =
  | { ok: true }
  | { ok: false; message: string };

type AppStateLockInput = {
  enabled: boolean;
  previousState: AppLockState;
  nextState: AppLockState;
  authenticating: boolean;
};

const AUTHENTICATION_MESSAGES: Partial<Record<LocalAuthenticationError, string>> =
  {
    app_cancel: 'Authentication canceled.',
    authentication_failed: 'Could not verify your identity. Try again.',
    invalid_context: 'Could not verify your identity. Try again.',
    lockout: 'Too many attempts. Unlock your device, then try again.',
    not_available: 'Biometric authentication is not available on this device.',
    not_enrolled: 'Set up Face ID, Touch ID, or fingerprint unlock first.',
    passcode_not_set: 'Set a device passcode before enabling biometric lock.',
    system_cancel: 'Authentication canceled.',
    timeout: 'Authentication timed out. Try again.',
    unable_to_process: 'Could not verify your identity. Try again.',
    unknown: 'Could not verify your identity. Try again.',
    user_cancel: 'Authentication canceled.',
    user_fallback: 'Use your device passcode or try again.',
  };

export async function getBiometricSupport(
  api: BiometricSupportApi = LocalAuthentication
): Promise<BiometricSupport> {
  const hasHardware = await api.hasHardwareAsync();
  if (!hasHardware) {
    return {
      available: false,
      reason: 'Biometric authentication is not available on this device.',
    };
  }

  const isEnrolled = await api.isEnrolledAsync();
  if (!isEnrolled) {
    return {
      available: false,
      reason: 'Set up Face ID, Touch ID, or fingerprint unlock first.',
    };
  }

  return { available: true };
}

export function mapAuthenticationResult(
  result:
    | LocalAuthenticationResult
    | { success: false; error?: LocalAuthenticationError }
): BiometricAuthResult {
  if (result.success) {
    return { ok: true };
  }

  const error = result.error;
  return {
    ok: false,
    message:
      (error ? AUTHENTICATION_MESSAGES[error] : undefined) ??
      'Could not verify your identity. Try again.',
  };
}

export async function authenticateWithBiometrics(
  promptMessage = 'Unlock SpiceSync',
  api: BiometricAuthApi = LocalAuthentication
): Promise<BiometricAuthResult> {
  const support = await getBiometricSupport(api);
  if (!support.available) {
    return { ok: false, message: support.reason };
  }

  try {
    const result = await api.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
      biometricsSecurityLevel: 'strong',
    });

    return mapAuthenticationResult(result);
  } catch {
    return {
      ok: false,
      message: 'Could not verify your identity. Try again.',
    };
  }
}

export function shouldLockForAppStateChange({
  enabled,
  previousState,
  nextState,
  authenticating,
}: AppStateLockInput): boolean {
  if (!enabled || authenticating || previousState !== 'active') {
    return false;
  }

  return nextState === 'inactive' || nextState === 'background';
}

export function useAppLock() {
  return {
    authenticate: authenticateWithBiometrics,
    ensureLockReady: getBiometricSupport,
  };
}
