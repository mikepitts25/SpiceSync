#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mobileRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(mobileRoot, '..', '..');

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
    throw new Error('The TestFlight profile must use the production environment.');
  }

  if (profile?.env?.EXPO_PUBLIC_PURCHASES_ENABLED !== 'false') {
    throw new Error('TestFlight purchases must be disabled for beta access.');
  }

  if (profile?.env?.EXPO_PUBLIC_FREE_BETA_ACCESS !== 'true') {
    throw new Error('TestFlight premium beta access must be enabled.');
  }

  console.log('TestFlight profile OK: all premium features unlocked.');
}

run(
  'Admin content QA tests',
  'node',
  ['--test', 'admin/test/*.test.js'],
  repoRoot
);
run('Mobile Jest suite', 'npm', ['test', '--', '--runInBand']);
run('TypeScript check', 'npx', ['tsc', '-p', 'tsconfig.json', '--noEmit']);
assertExpoConfig();
assertTestFlightConfig();
console.log('\nRelease check passed.');
