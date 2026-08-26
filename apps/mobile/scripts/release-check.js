#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const {
  collectProductionSocialRecoveryErrors,
  isPartnerSyncEnabled,
  readCheckedInNativeIosConfig,
} = require('./release-check-config');
const { resolveEasBuildProfile } = require('./release-check-eas-profile');

const mobileRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(mobileRoot, '..', '..');
const adminTestDir = path.join(repoRoot, 'admin', 'test');
const adminTestFiles = fs
  .readdirSync(adminTestDir)
  .filter((fileName) => fileName.endsWith('.test.js'))
  .sort()
  .map((fileName) => path.join(adminTestDir, fileName));

function run(label, command, args, cwd = mobileRoot) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function assertExpoConfig() {
  console.log('\n==> Expo release config sanity');
  const appJson = JSON.parse(
    fs.readFileSync(path.join(mobileRoot, 'app.json'))
  );
  const expo = appJson.expo || {};
  const iosBundleIdentifier = expo.ios?.bundleIdentifier;
  const androidPackage = expo.android?.package;
  const easProjectId = expo.extra?.eas?.projectId;
  const usesNonExemptEncryption =
    expo.ios?.infoPlist?.ITSAppUsesNonExemptEncryption;

  if (iosBundleIdentifier !== 'com.spicesync.app') {
    throw new Error(`Unexpected iOS bundle identifier: ${iosBundleIdentifier}`);
  }

  if (androidPackage !== 'com.spicesync.app') {
    throw new Error(`Unexpected Android package: ${androidPackage}`);
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      easProjectId || ''
    )
  ) {
    throw new Error('Missing real EAS project id.');
  }

  if (usesNonExemptEncryption !== false) {
    throw new Error(
      'iOS export compliance must declare OS-provided/exempt encryption.'
    );
  }

  console.log(
    `Config OK: ${iosBundleIdentifier}, ${androidPackage}, ${easProjectId}`
  );
}

function assertTestFlightConfig() {
  console.log('\n==> TestFlight profile sanity');
  const easJson = JSON.parse(
    fs.readFileSync(path.join(mobileRoot, 'eas.json'))
  );
  const profile = easJson.build?.testflight;

  if (profile?.extends !== 'production') {
    throw new Error('The TestFlight profile must extend production.');
  }

  if (profile?.environment !== 'production') {
    throw new Error(
      'The TestFlight profile must use the production environment.'
    );
  }

  if (profile?.env?.EXPO_PUBLIC_PURCHASES_ENABLED !== 'false') {
    throw new Error('TestFlight purchases must be disabled for beta access.');
  }

  if (profile?.env?.EXPO_PUBLIC_FREE_BETA_ACCESS !== 'true') {
    throw new Error('TestFlight premium beta access must be enabled.');
  }

  console.log('TestFlight profile OK: all premium features unlocked.');
}

function readResolvedExpoConfig() {
  const configFactory = require(path.join(mobileRoot, 'app.config.js'));
  return configFactory();
}

function readEasBuildProfiles() {
  const easConfigPath = path.join(mobileRoot, 'eas.json');
  let easJson;
  try {
    easJson = JSON.parse(fs.readFileSync(easConfigPath, 'utf8'));
  } catch {
    throw new Error(
      `Unable to read EAS build profiles from ${easConfigPath}. Refusing to skip social-recovery preflight.`
    );
  }
  return easJson.build;
}

function isEasProductionEnvironmentProfile(environment) {
  const profileName = environment.EAS_BUILD_PROFILE;
  if (profileName === undefined) return false;

  return (
    resolveEasBuildProfile(readEasBuildProfiles(), profileName).environment ===
    'production'
  );
}

function readCommandOptions() {
  const supportedFlags = new Set([
    '--config-only',
    '--require-social-recovery',
  ]);
  const unsupportedFlags = process.argv
    .slice(2)
    .filter((argument) => !supportedFlags.has(argument));

  if (unsupportedFlags.length > 0) {
    throw new Error(
      `Unsupported release-check option(s): ${unsupportedFlags.join(', ')}`
    );
  }

  const easProfileRequiresSocialRecovery = isEasProductionEnvironmentProfile(
    process.env
  );

  return {
    configOnly: process.argv.includes('--config-only'),
    requireSocialRecovery:
      process.argv.includes('--require-social-recovery') ||
      easProfileRequiresSocialRecovery,
  };
}

function assertSocialRecoveryConfig({ requireSocialRecovery }) {
  console.log('\n==> Social recovery production configuration');
  if (!requireSocialRecovery && !isPartnerSyncEnabled(process.env)) {
    console.log(
      'Not required: both public Supabase relay variables are absent. Validate a social-recovery release with the EAS production environment and --require-social-recovery.'
    );
    return;
  }

  if (requireSocialRecovery) {
    console.log(
      'Required: explicit social-recovery preflight or an EAS profile resolved to environment=production.'
    );
  }

  const errors = collectProductionSocialRecoveryErrors({
    environment: process.env,
    expoConfig: readResolvedExpoConfig(),
    nativeIosConfig: readCheckedInNativeIosConfig(mobileRoot),
    requireSocialRecovery,
  });
  if (errors.length > 0) {
    throw new Error(
      `Social recovery release configuration failed:\n${errors
        .map((error) => `- ${error}`)
        .join('\n')}`
    );
  }

  console.log('Social recovery public mobile configuration OK.');
}

const options = readCommandOptions();

if (options.configOnly) {
  assertExpoConfig();
  assertTestFlightConfig();
  assertSocialRecoveryConfig(options);
  console.log('\nRelease configuration preflight passed.');
  process.exit(0);
}

assertSocialRecoveryConfig(options);
run('Admin content QA tests', 'node', ['--test', ...adminTestFiles], repoRoot);
run('Mobile Jest suite', 'npm', ['test', '--', '--runInBand']);
run('TypeScript check', 'npx', ['tsc', '-p', 'tsconfig.json', '--noEmit']);
assertExpoConfig();
assertTestFlightConfig();
console.log('\nRelease check passed.');
