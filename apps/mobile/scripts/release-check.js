#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const {
  collectProductionSocialRecoveryErrors,
  isPartnerSyncEnabled,
} = require('./release-check-config');

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
  const easJson = JSON.parse(
    fs.readFileSync(path.join(mobileRoot, 'eas.json'))
  );
  const buildProfiles = easJson.build;

  if (!buildProfiles || typeof buildProfiles !== 'object') {
    throw new Error(
      'eas.json must define build profiles. Refusing to skip social-recovery preflight.'
    );
  }

  return buildProfiles;
}

function resolveEasBuildProfile(profileName) {
  const buildProfiles = readEasBuildProfiles();
  const profileChain = [];
  const visitedProfiles = new Set();
  let currentProfileName = profileName;

  while (currentProfileName) {
    if (visitedProfiles.has(currentProfileName)) {
      throw new Error(
        `EAS build profile inheritance cycle: ${[
          ...profileChain,
          currentProfileName,
        ].join(' -> ')}. Refusing to skip social-recovery preflight.`
      );
    }
    visitedProfiles.add(currentProfileName);

    const profile = buildProfiles[currentProfileName];
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      throw new Error(
        `EAS build profile "${currentProfileName}" is missing. Refusing to skip social-recovery preflight.`
      );
    }
    profileChain.push(currentProfileName);

    if (
      profile.extends !== undefined &&
      (typeof profile.extends !== 'string' || !profile.extends.trim())
    ) {
      throw new Error(
        `EAS build profile "${currentProfileName}" has an invalid extends value. Refusing to skip social-recovery preflight.`
      );
    }
    currentProfileName = profile.extends?.trim() || '';
  }

  return profileChain.reverse().reduce((resolvedProfile, currentName) => {
    return { ...resolvedProfile, ...buildProfiles[currentName] };
  }, {});
}

function isEasProductionEnvironmentProfile(environment) {
  const profileName = environment.EAS_BUILD_PROFILE?.trim();
  if (!profileName) return false;

  return resolveEasBuildProfile(profileName).environment === 'production';
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

  return {
    configOnly: process.argv.includes('--config-only'),
    requireSocialRecovery:
      process.argv.includes('--require-social-recovery') ||
      isEasProductionEnvironmentProfile(process.env),
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
