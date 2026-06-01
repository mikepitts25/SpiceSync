/* eslint-env node */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro's package-exports validation warns on @noble/hashes@1.8.0's
// internal crypto.js fallback. The dependency resolves correctly through
// file-based resolution, so keep Metro on that legacy resolver path.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
