import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { Platform } from 'react-native';

jest.mock('expo-apple-authentication');
jest.mock('@react-native-google-signin/google-signin');

type AppleAuthenticationModule = {
  AppleAuthenticationScope: { FULL_NAME: number; EMAIL: number };
  isAvailableAsync: jest.Mock;
  signInAsync: jest.Mock;
};
type GoogleSigninModule = {
  GoogleSignin: {
    configure: jest.Mock;
    hasPlayServices: jest.Mock;
    signIn: jest.Mock;
    getTokens: jest.Mock;
  };
};

let AppleAuthentication: AppleAuthenticationModule;
let GoogleSignin: GoogleSigninModule['GoogleSignin'];
let getAppleCredential: typeof import('../lib/auth/providers/apple.ios').getAppleCredential;
let isAppleAvailable: typeof import('../lib/auth/providers/apple.ios').isAppleAvailable;
let getGoogleCredential: typeof import('../lib/auth/providers/google').getGoogleCredential;
let isGoogleConfigured: typeof import('../lib/auth/providers/google').isGoogleConfigured;

function mockAppleCredential(input: {
  identityToken: string | null;
  authorizationCode?: string | null;
}): void {
  AppleAuthentication.signInAsync.mockResolvedValue({
    identityToken: input.identityToken,
    authorizationCode: input.authorizationCode ?? null,
  });
}

function mockGoogleCancelled(): void {
  GoogleSignin.signIn.mockResolvedValue({ type: 'cancelled' });
}

describe('native account providers', () => {
  const originalEnv = process.env;
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-client-id',
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: 'ios-client-id',
    };
    jest.resetModules();
    AppleAuthentication =
      require('expo-apple-authentication') as AppleAuthenticationModule;
    ({ GoogleSignin } =
      require('@react-native-google-signin/google-signin') as GoogleSigninModule);
    ({ getAppleCredential, isAppleAvailable } =
      require('../lib/auth/providers/apple.ios') as typeof import('../lib/auth/providers/apple.ios'));
    ({ getGoogleCredential, isGoogleConfigured } =
      require('../lib/auth/providers/google') as typeof import('../lib/auth/providers/google'));
    jest.clearAllMocks();
    AppleAuthentication.isAvailableAsync.mockResolvedValue(true);
    GoogleSignin.hasPlayServices.mockResolvedValue(true);
    GoogleSignin.getTokens.mockResolvedValue({ accessToken: 'google-access' });
  });

  afterAll(() => {
    process.env = originalEnv;
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  it('returns the raw nonce alongside the Apple identity token', async () => {
    mockAppleCredential({
      identityToken: 'apple-token',
      authorizationCode: 'apple-code',
    });

    const credential = await getAppleCredential();

    expect(credential).toMatchObject({
      provider: 'apple',
      token: 'apple-token',
      nonce: expect.any(String),
      authorizationCode: 'apple-code',
    });
    expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: bytesToHex(sha256(utf8ToBytes(credential.nonce!))),
    });
  });

  it('reports whether native Apple authentication is available', async () => {
    await expect(isAppleAvailable()).resolves.toBe(true);
  });

  it('normalizes Apple request cancellation for the partner account gate', async () => {
    AppleAuthentication.signInAsync.mockRejectedValue({
      code: 'ERR_REQUEST_CANCELED',
    });

    await expect(getAppleCredential()).rejects.toMatchObject({
      code: 'CANCELLED',
    });
  });

  it('returns Google ID and access tokens for Supabase', async () => {
    expect(isGoogleConfigured()).toBe(true);
    GoogleSignin.signIn.mockResolvedValue({
      type: 'success',
      data: { idToken: 'google-id-token' },
    });

    await expect(getGoogleCredential()).resolves.toEqual({
      provider: 'google',
      token: 'google-id-token',
      accessToken: 'google-access',
    });
    expect(GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: 'web-client-id',
      iosClientId: 'ios-client-id',
      offlineAccess: false,
    });
  });

  it('requires the iOS client ID only on iOS', () => {
    const config = {
      googleWebClientId: 'web-client-id',
      googleIosClientId: null,
    };
    expect(isGoogleConfigured('ios', config)).toBe(false);
    expect(isGoogleConfigured('android', config)).toBe(true);
  });

  it('maps Google cancellation without treating it as an auth failure', async () => {
    mockGoogleCancelled();

    await expect(getGoogleCredential()).rejects.toMatchObject({
      code: 'CANCELLED',
    });
  });
});
