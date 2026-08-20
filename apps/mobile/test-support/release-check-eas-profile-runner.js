#!/usr/bin/env node

try {
  const {
    resolveEasBuildProfile,
  } = require('../scripts/release-check-eas-profile');
  const [profileName, buildProfilesJson] = process.argv.slice(2);
  const profile = resolveEasBuildProfile(
    JSON.parse(buildProfilesJson),
    profileName
  );

  process.stdout.write(JSON.stringify(profile));
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
