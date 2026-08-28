import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

const mobileRoot = path.join(__dirname, '..');
const releaseCheckPath = path.join(mobileRoot, 'scripts', 'release-check.js');
const easProfileFixtureRunnerPath = path.join(
  mobileRoot,
  'test-support',
  'release-check-eas-profile-runner.js'
);

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
  icon?: string;
  scheme?: string;
  ios?: { bundleIdentifier?: string; usesAppleSignIn?: boolean };
  android?: { package?: string };
  plugins?: unknown[];
};

type ReleaseEnvironment = Record<string, string | undefined>;
type EASBuildProfiles = Record<string, unknown>;
type CheckedInNativeIosConfig = {
  infoPlist: string;
  entitlements: string;
};
type ProcessResult = {
  error: Error | undefined;
  output: string;
  status: number | null;
};

type ReleaseCheckConfig = {
  collectAppIconSyncErrors?(input: {
    mobileRoot: string;
    expoConfig: ExpoReleaseConfig;
  }): string[];
  collectProductionSocialRecoveryErrors(input: {
    environment: ReleaseEnvironment;
    expoConfig: ExpoReleaseConfig;
    nativeIosConfig?: CheckedInNativeIosConfig | null;
    requireSocialRecovery?: boolean;
  }): string[];
  readCheckedInNativeIosConfig?: (
    root: string
  ) => CheckedInNativeIosConfig | null;
};

function runReleaseCheck(
  environment: ReleaseEnvironment,
  expoConfig: ExpoReleaseConfig,
  options: {
    nativeIosConfig?: CheckedInNativeIosConfig | null;
    requireSocialRecovery?: boolean;
  } = {}
): { stderr: string } {
  // This is a pure fixture seam: it exercises exactly the validation used by
  // the executable release check without spawning the whole mobile suite.
  const { collectProductionSocialRecoveryErrors } =
    require('../scripts/release-check-config.js') as ReleaseCheckConfig;
  return {
    stderr: collectProductionSocialRecoveryErrors({
      environment,
      expoConfig,
      ...options,
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
): ProcessResult {
  const isolatedEnvironment: NodeJS.ProcessEnv = {
    ...process.env,
  };
  for (const name of socialRecoveryEnvironmentNames) {
    delete isolatedEnvironment[name];
  }
  Object.assign(isolatedEnvironment, environment);

  const result = spawnSync(process.execPath, [releaseCheckPath, ...args], {
    cwd: mobileRoot,
    encoding: 'utf8',
    env: isolatedEnvironment,
    timeout: 2000,
  });
  return {
    error: result.error,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    status: result.status,
  };
}

function runEasPreInstallHook(environment: ReleaseEnvironment): ProcessResult {
  const isolatedEnvironment: NodeJS.ProcessEnv = {
    ...process.env,
  };
  for (const name of socialRecoveryEnvironmentNames) {
    delete isolatedEnvironment[name];
  }
  Object.assign(isolatedEnvironment, environment);

  const result = spawnSync(
    'npm',
    ['run', 'eas-build-pre-install', '--silent'],
    {
      cwd: mobileRoot,
      encoding: 'utf8',
      env: isolatedEnvironment,
      timeout: 5000,
    }
  );
  return {
    error: result.error,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    status: result.status,
  };
}

function runEasProfileFixture(
  profileName: string,
  buildProfiles: EASBuildProfiles
): ProcessResult {
  const result = spawnSync(
    process.execPath,
    [easProfileFixtureRunnerPath, profileName, JSON.stringify(buildProfiles)],
    {
      cwd: mobileRoot,
      encoding: 'utf8',
      timeout: 2000,
    }
  );

  return {
    error: result.error,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    status: result.status,
  };
}

function expectEasFixtureFailure(
  result: ProcessResult,
  expectedMessage: string
) {
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.output).toContain(expectedMessage);
  expect(result.output).toContain('Refusing to skip social-recovery preflight');
}

function expectResolvedEasEnvironment(
  profileName: string,
  buildProfiles: EASBuildProfiles,
  environment: string
) {
  const result = runEasProfileFixture(profileName, buildProfiles);

  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  expect(JSON.parse(result.output)).toMatchObject({ environment });
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

  it('rejects checked-in iOS projects that omit native social-auth wiring', () => {
    const result = runReleaseCheck(
      productionSocialRecoveryEnvironment(),
      productionExpoConfig(),
      {
        requireSocialRecovery: true,
        nativeIosConfig: {
          infoPlist: `<?xml version="1.0" encoding="UTF-8"?>
            <plist><dict>
              <key>CFBundleURLTypes</key>
              <array><dict><key>CFBundleURLSchemes</key><array>
                <string>spicesync</string>
              </array></dict></array>
            </dict></plist>`,
          entitlements: `<?xml version="1.0" encoding="UTF-8"?>
            <plist><dict></dict></plist>`,
        },
      }
    );

    expect(result.stderr).toContain(
      'checked-in iOS entitlements must enable Sign in with Apple'
    );
    expect(result.stderr).toContain(
      'checked-in iOS Info.plist must register Google callback scheme'
    );
  });

  it('does not accept an unrelated Default value as the Apple entitlement', () => {
    const result = runReleaseCheck(
      productionSocialRecoveryEnvironment(),
      productionExpoConfig(),
      {
        requireSocialRecovery: true,
        nativeIosConfig: {
          infoPlist: `<?xml version="1.0" encoding="UTF-8"?>
            <plist><dict><key>CFBundleURLTypes</key><array><dict>
              <key>CFBundleURLSchemes</key><array>
                <string>com.googleusercontent.apps.123456789012-iosclient</string>
              </array>
            </dict></array></dict></plist>`,
          entitlements: `<?xml version="1.0" encoding="UTF-8"?>
            <plist><dict>
              <key>com.apple.developer.applesignin</key><array/>
              <key>unrelated</key><array><string>Default</string></array>
            </dict></plist>`,
        },
      }
    );

    expect(result.stderr).toContain(
      'checked-in iOS entitlements must enable Sign in with Apple'
    );
  });

  it('rejects the remote-push entitlement when the release has only local notifications', () => {
    const result = runReleaseCheck(
      productionSocialRecoveryEnvironment(),
      productionExpoConfig(),
      {
        requireSocialRecovery: true,
        nativeIosConfig: {
          infoPlist: `<?xml version="1.0" encoding="UTF-8"?>
            <plist><dict><key>CFBundleURLTypes</key><array><dict>
              <key>CFBundleURLSchemes</key><array>
                <string>com.googleusercontent.apps.123456789012-iosclient</string>
              </array>
            </dict></array></dict></plist>`,
          entitlements: `<?xml version="1.0" encoding="UTF-8"?>
            <plist><dict>
              <key>aps-environment</key><string>development</string>
              <key>com.apple.developer.applesignin</key>
              <array><string>Default</string></array>
            </dict></plist>`,
        },
      }
    );

    expect(result.stderr).toContain(
      'checked-in iOS entitlements must not request remote push notifications'
    );
  });

  it('does not accept the Google callback value outside URL schemes', () => {
    const result = runReleaseCheck(
      productionSocialRecoveryEnvironment(),
      productionExpoConfig(),
      {
        requireSocialRecovery: true,
        nativeIosConfig: {
          infoPlist: `<?xml version="1.0" encoding="UTF-8"?>
            <plist><dict>
              <key>UnrelatedValue</key>
              <string>com.googleusercontent.apps.123456789012-iosclient</string>
              <key>CFBundleURLTypes</key><array><dict>
                <key>CFBundleURLSchemes</key><array>
                  <string>spicesync</string>
                </array>
              </dict></array>
            </dict></plist>`,
          entitlements: `<?xml version="1.0" encoding="UTF-8"?>
            <plist><dict>
              <key>com.apple.developer.applesignin</key>
              <array><string>Default</string></array>
            </dict></plist>`,
        },
      }
    );

    expect(result.stderr).toContain(
      'checked-in iOS Info.plist must register Google callback scheme'
    );
  });

  it('reads checked-in native iOS release files for executable validation', () => {
    const fixtureRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'spicesync-native-release-')
    );
    const nativeDirectory = path.join(fixtureRoot, 'ios', 'SpiceSync');
    fs.mkdirSync(nativeDirectory, { recursive: true });
    fs.writeFileSync(path.join(nativeDirectory, 'Info.plist'), 'plist-fixture');
    fs.writeFileSync(
      path.join(nativeDirectory, 'SpiceSync.entitlements'),
      'entitlements-fixture'
    );

    try {
      const releaseConfig =
        require('../scripts/release-check-config.js') as ReleaseCheckConfig;
      const nativeIosConfig = releaseConfig.readCheckedInNativeIosConfig
        ? releaseConfig.readCheckedInNativeIosConfig(fixtureRoot)
        : null;

      expect(nativeIosConfig).toEqual({
        infoPlist: 'plist-fixture',
        entitlements: 'entitlements-fixture',
      });
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('rejects a checked-in iOS app icon that differs from the Expo source', () => {
    const fixtureRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'spicesync-app-icon-')
    );
    const expoIconPath = path.join(fixtureRoot, 'assets', 'icon.png');
    const nativeIconDirectory = path.join(
      fixtureRoot,
      'ios',
      'SpiceSync',
      'Images.xcassets',
      'AppIcon.appiconset'
    );
    fs.mkdirSync(path.dirname(expoIconPath), { recursive: true });
    fs.mkdirSync(nativeIconDirectory, { recursive: true });
    fs.writeFileSync(expoIconPath, 'approved-flame-icon');
    fs.writeFileSync(
      path.join(nativeIconDirectory, 'placeholder.png'),
      'stale-placeholder-icon'
    );
    fs.writeFileSync(
      path.join(nativeIconDirectory, 'Contents.json'),
      JSON.stringify({
        images: [{ filename: 'placeholder.png', idiom: 'universal' }],
        info: { version: 1, author: 'expo' },
      })
    );

    try {
      const releaseConfig =
        require('../scripts/release-check-config.js') as ReleaseCheckConfig;

      expect(
        releaseConfig.collectAppIconSyncErrors?.({
          mobileRoot: fixtureRoot,
          expoConfig: { icon: './assets/icon.png' },
        })
      ).toEqual([
        'The checked-in iOS AppIcon must match the Expo icon at ./assets/icon.png.',
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});

const executableDescribe =
  process.env.RELEASE_CHECK_TEST_CHILD === '1' ? describe.skip : describe;

executableDescribe('release check executable preflight', () => {
  it('runs the required TestFlight preflight from the EAS pre-install hook', () => {
    const result = runEasPreInstallHook({
      ...productionSocialRecoveryEnvironment(),
      EAS_BUILD_PROFILE: 'testflight',
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.output).toContain(
      'checked-in iOS Info.plist must register Google callback scheme'
    );
    expect(result.output).not.toContain(
      'checked-in iOS entitlements must enable Sign in with Apple'
    );
  });

  it('keeps the EAS pre-install hook available to preview builds', () => {
    const result = runEasPreInstallHook({ EAS_BUILD_PROFILE: 'preview' });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.output).toContain('Release configuration preflight passed.');
  });

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

  it('fails closed when a supplied EAS build profile name is blank', () => {
    const result = runReleaseCheckExecutable(['--config-only'], {
      EAS_BUILD_PROFILE: '   ',
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      'EAS build profile name must be a non-empty string'
    );
    expect(result.output).toContain(
      'Refusing to skip social-recovery preflight'
    );
  });

  it('fails closed on an unknown resolved EAS environment value', () => {
    const result = runEasProfileFixture('invalid-environment', {
      'invalid-environment': { environment: 'staging' },
    });

    expectEasFixtureFailure(result, 'environment must be one of');
  });

  it('fails closed on a non-string resolved EAS environment', () => {
    const result = runEasProfileFixture('invalid-environment-type', {
      'invalid-environment-type': { environment: true },
    });

    expectEasFixtureFailure(result, 'environment must be one of');
  });

  it('fails closed on a non-string EAS extends value', () => {
    const result = runEasProfileFixture('invalid-extends', {
      'invalid-extends': { extends: 42 },
    });

    expectEasFixtureFailure(result, 'invalid extends value');
  });

  it('fails closed when an EAS profile parent is missing', () => {
    const result = runEasProfileFixture('missing-parent', {
      'missing-parent': { extends: 'absent-parent' },
    });

    expectEasFixtureFailure(result, 'absent-parent');
  });

  it('fails closed on a two-node EAS inheritance cycle', () => {
    const result = runEasProfileFixture('cycle-a', {
      'cycle-a': { extends: 'cycle-b' },
      'cycle-b': { extends: 'cycle-a' },
    });

    expectEasFixtureFailure(result, 'cycle-a -> cycle-b -> cycle-a');
  });

  it('treats an empty named EAS profile as production by default', () => {
    expectResolvedEasEnvironment('empty', { empty: {} }, 'production');
  });

  it('treats an omitted environment with internal distribution as preview', () => {
    expectResolvedEasEnvironment(
      'internal',
      { internal: { distribution: 'internal' } },
      'preview'
    );
  });

  it('treats an omitted environment with a development client as development', () => {
    expectResolvedEasEnvironment(
      'development',
      { development: { developmentClient: true } },
      'development'
    );
  });

  it('treats an omitted environment with store distribution as production', () => {
    expectResolvedEasEnvironment(
      'store',
      { store: { distribution: 'store' } },
      'production'
    );
  });

  it('fails closed on an invalid EAS distribution value', () => {
    const result = runEasProfileFixture('invalid-distribution', {
      'invalid-distribution': { distribution: 'adhoc' },
    });

    expectEasFixtureFailure(result, 'distribution must be internal or store');
  });

  it('fails closed on a non-string EAS distribution value', () => {
    const result = runEasProfileFixture('invalid-distribution-type', {
      'invalid-distribution-type': { distribution: true },
    });

    expectEasFixtureFailure(result, 'distribution must be internal or store');
  });

  it('fails closed on a non-boolean EAS development client value', () => {
    const result = runEasProfileFixture('invalid-development-client', {
      'invalid-development-client': { developmentClient: 'true' },
    });

    expectEasFixtureFailure(result, 'developmentClient must be boolean');
  });

  it('validates malformed EAS build fields even with an explicit environment', () => {
    const result = runEasProfileFixture('corrupt-explicit-preview', {
      'corrupt-explicit-preview': {
        environment: 'preview',
        distribution: 'adhoc',
      },
    });

    expectEasFixtureFailure(result, 'distribution must be internal or store');
  });

  it('keeps config-only baseline checks offline for the development profile', () => {
    const result = runReleaseCheckExecutable(['--config-only'], {
      EAS_BUILD_PROFILE: 'development',
    });

    expect(result.status).toBe(0);
    expect(result.output).toContain('Not required: both public Supabase relay');
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

  it('blocks TestFlight while checked-in native iOS auth wiring is stale', () => {
    const result = runReleaseCheckExecutable(['--config-only'], {
      ...productionSocialRecoveryEnvironment(),
      EAS_BUILD_PROFILE: 'testflight',
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      'checked-in iOS Info.plist must register Google callback scheme'
    );
    expect(result.output).not.toContain(
      'checked-in iOS entitlements must enable Sign in with Apple'
    );
  });
});
