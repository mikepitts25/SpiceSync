jest.mock('expo-local-authentication', () => ({}));
jest.mock('expo-secure-store', () => ({}));

import {
  getBiometricSupport,
  mapAuthenticationResult,
  shouldLockForAppStateChange,
} from '../lib/lock';

describe('biometric app lock helpers', () => {
  it('reports biometric lock as unavailable without hardware or enrollment', async () => {
    await expect(
      getBiometricSupport({
        hasHardwareAsync: jest.fn().mockResolvedValue(false),
        isEnrolledAsync: jest.fn().mockResolvedValue(true),
      })
    ).resolves.toEqual({
      available: false,
      reason: 'Biometric authentication is not available on this device.',
    });

    await expect(
      getBiometricSupport({
        hasHardwareAsync: jest.fn().mockResolvedValue(true),
        isEnrolledAsync: jest.fn().mockResolvedValue(false),
      })
    ).resolves.toEqual({
      available: false,
      reason: 'Set up Face ID, Touch ID, or fingerprint unlock first.',
    });
  });

  it('reports biometric lock as available when hardware and enrollment exist', async () => {
    await expect(
      getBiometricSupport({
        hasHardwareAsync: jest.fn().mockResolvedValue(true),
        isEnrolledAsync: jest.fn().mockResolvedValue(true),
      })
    ).resolves.toEqual({ available: true });
  });

  it('maps authentication outcomes into UI-safe messages', () => {
    expect(mapAuthenticationResult({ success: true })).toEqual({ ok: true });

    expect(
      mapAuthenticationResult({ success: false, error: 'user_cancel' })
    ).toEqual({
      ok: false,
      message: 'Authentication canceled.',
    });

    expect(mapAuthenticationResult({ success: false })).toEqual({
      ok: false,
      message: 'Could not verify your identity. Try again.',
    });
  });

  it('locks immediately when biometric lock is enabled and the app leaves active state', () => {
    expect(
      shouldLockForAppStateChange({
        enabled: true,
        previousState: 'active',
        nextState: 'background',
        authenticating: false,
      })
    ).toBe(true);
  });

  it('does not lock while disabled or while biometric auth is already in progress', () => {
    expect(
      shouldLockForAppStateChange({
        enabled: false,
        previousState: 'active',
        nextState: 'background',
        authenticating: false,
      })
    ).toBe(false);

    expect(
      shouldLockForAppStateChange({
        enabled: true,
        previousState: 'active',
        nextState: 'inactive',
        authenticating: true,
      })
    ).toBe(false);
  });
});
