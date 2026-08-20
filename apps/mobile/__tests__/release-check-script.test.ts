import fs from 'fs';
import path from 'path';

const mobileRoot = path.join(__dirname, '..');

type ExpoReleaseConfig = {
  scheme?: string;
  ios?: { bundleIdentifier?: string; usesAppleSignIn?: boolean };
  android?: { package?: string };
  plugins?: unknown[];
};

type ReleaseEnvironment = Record<string, string | undefined>;

type ReleaseCheckConfig = {
  collectProductionSocialRecoveryErrors(input: {
    environment: ReleaseEnvironment;
    expoConfig: ExpoReleaseConfig;
  }): string[];
};

function runReleaseCheck(
  environment: ReleaseEnvironment,
  expoConfig: ExpoReleaseConfig
): { stderr: string } {
  // This is a pure fixture seam: it exercises exactly the validation used by
  // the executable release check without spawning the whole mobile suite.
  const { collectProductionSocialRecoveryErrors } =
    require('../scripts/release-check-config.js') as ReleaseCheckConfig;
  return {
    stderr: collectProductionSocialRecoveryErrors({
      environment,
      expoConfig,
    }).join('\n'),
  };
}

function productionExpoConfig(): ExpoReleaseConfig {
  return {
    scheme: 'spicesync',
    ios: {
      bundleIdentifier: 'com.spicesync.app',
      usesAppleSignIn: true,
    },
    android: { package: 'com.spicesync.app' },
    plugins: [
      'expo-apple-authentication',
      [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme: 'com.googleusercontent.apps.123456789012-iosclient' },
      ],
    ],
  };
}

describe('release check command', () => {
  it('exposes a one-command release verification script', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(mobileRoot, 'package.json'), 'utf8')
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.['release:check']).toBe(
      'node scripts/release-check.js'
    );
    expect(
      fs.existsSync(path.join(mobileRoot, 'scripts', 'release-check.js'))
    ).toBe(true);
  });

  it('requires production social-auth configuration when partner sync is enabled', () => {
    const result = runReleaseCheck(
      {
        EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'publishable',
      },
      {
        scheme: 'missing-callback-scheme',
        ios: {
          bundleIdentifier: 'com.placeholder.app',
          usesAppleSignIn: false,
        },
        android: { package: 'com.placeholder.app' },
        plugins: [],
      }
    );

    expect(result.stderr).toContain('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
    expect(result.stderr).toContain('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
    expect(result.stderr).toContain('Apple Sign In capability');
    expect(result.stderr).toContain('redirect/callback scheme');
    expect(result.stderr).toContain('iOS bundle identifier');
    expect(result.stderr).toContain('Android package');
    expect(result.stderr).toContain('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('accepts a complete production-shaped social-recovery fixture', () => {
    const result = runReleaseCheck(
      {
        EXPO_PUBLIC_SUPABASE_URL:
          'https://release-validation-87654321.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY:
          'sb_publishable_release_validation_fixture_not_a_secret',
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
          '123456789012-webclient.apps.googleusercontent.com',
        EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:
          '123456789012-iosclient.apps.googleusercontent.com',
      },
      productionExpoConfig()
    );

    expect(result.stderr).toBe('');
  });
});
