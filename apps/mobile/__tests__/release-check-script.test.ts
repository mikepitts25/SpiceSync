import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const mobileRoot = path.join(__dirname, '..');
const releaseCheckPath = path.join(mobileRoot, 'scripts', 'release-check.js');

const socialRecoveryEnvironmentNames = [
  'EAS_BUILD_PROFILE',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'SPICESYNC_ACCOUNT_DELETION_URL',
  'SPICESYNC_DELETION_RATE_LIMIT_VERIFIED',
];

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

function runReleaseCheckExecutable(
  args: string[],
  environment: ReleaseEnvironment
): { output: string; status: number | null } {
  const isolatedEnvironment: NodeJS.ProcessEnv = {
    ...process.env,
    RELEASE_CHECK_TEST_CHILD: '1',
  };
  for (const name of socialRecoveryEnvironmentNames) {
    delete isolatedEnvironment[name];
  }
  Object.assign(isolatedEnvironment, environment);

  const result = spawnSync(process.execPath, [releaseCheckPath, ...args], {
    cwd: mobileRoot,
    encoding: 'utf8',
    env: isolatedEnvironment,
  });
  return {
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    status: result.status,
  };
}

function productionSocialRecoveryEnvironment(): ReleaseEnvironment {
  return {
    EXPO_PUBLIC_SUPABASE_URL: 'https://release-validation-87654321.supabase.co',
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      'sb_publishable_release_validation_fixture_not_a_secret',
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
      '123456789012-webclient.apps.googleusercontent.com',
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:
      '123456789012-iosclient.apps.googleusercontent.com',
    SPICESYNC_ACCOUNT_DELETION_URL:
      'https://delete.spicesync.app/account-deletion',
    SPICESYNC_DELETION_RATE_LIMIT_VERIFIED: 'true',
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

const executableDescribe =
  process.env.RELEASE_CHECK_TEST_CHILD === '1' ? describe.skip : describe;

executableDescribe('release check executable preflight', () => {
  it('fails required social recovery mode when every required input is absent', () => {
    const result = runReleaseCheckExecutable(['--require-social-recovery'], {});

    expect(result.status).toBe(1);
    expect(result.output).toContain('EXPO_PUBLIC_SUPABASE_URL');
    expect(result.output).toContain('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
    expect(result.output).toContain('SPICESYNC_ACCOUNT_DELETION_URL');
    expect(result.output).toContain('SPICESYNC_DELETION_RATE_LIMIT_VERIFIED');
  });

  it('automatically requires social recovery on an EAS production build signal', () => {
    const result = runReleaseCheckExecutable([], {
      EAS_BUILD_PROFILE: 'production',
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    expect(result.output).toContain('SPICESYNC_ACCOUNT_DELETION_URL');
  });

  it('requires social recovery when TestFlight inherits the production environment', () => {
    const result = runReleaseCheckExecutable(['--config-only'], {
      EAS_BUILD_PROFILE: 'testflight',
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain('EXPO_PUBLIC_SUPABASE_URL');
    expect(result.output).toContain('SPICESYNC_ACCOUNT_DELETION_URL');
  });

  it('keeps config-only baseline checks offline for a non-production EAS profile', () => {
    const result = runReleaseCheckExecutable(['--config-only'], {
      EAS_BUILD_PROFILE: 'preview',
    });

    expect(result.status).toBe(0);
    expect(result.output).toContain('Not required: both public Supabase relay');
  });

  it('fails closed when a supplied EAS build profile cannot be resolved', () => {
    const result = runReleaseCheckExecutable(['--config-only'], {
      EAS_BUILD_PROFILE: 'missing-profile',
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain('missing-profile');
    expect(result.output).toContain(
      'Refusing to skip social-recovery preflight'
    );
  });

  it('rejects a raw Supabase deletion function URL in required mode', () => {
    const result = runReleaseCheckExecutable(
      ['--require-social-recovery', '--config-only'],
      {
        ...productionSocialRecoveryEnvironment(),
        SPICESYNC_ACCOUNT_DELETION_URL:
          'https://release-validation-87654321.supabase.co/functions/v1/spicesync-account-deletion',
      }
    );

    expect(result.status).toBe(1);
    expect(result.output).toContain('SPICESYNC_ACCOUNT_DELETION_URL');
    expect(result.output).toContain('not a raw *.supabase.co/functions/v1 URL');
  });

  it('passes a production-shaped fixture through the inherited TestFlight profile', () => {
    const result = runReleaseCheckExecutable(['--config-only'], {
      ...productionSocialRecoveryEnvironment(),
      EAS_BUILD_PROFILE: 'testflight',
    });

    expect(result.status).toBe(0);
    expect(result.output).toContain(
      'Social recovery public mobile configuration OK.'
    );
    expect(result.output).toContain('Release configuration preflight passed.');
  });
});
