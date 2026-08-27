const fs = require('fs');
const path = require('path');

const EXPECTED_APPLICATION_ID = 'com.spicesync.app';
const EXPECTED_APP_SCHEME = 'spicesync';
const GOOGLE_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function looksLikePlaceholder(value) {
  const normalized = clean(value).toLowerCase();
  return (
    !normalized ||
    normalized === 'publishable' ||
    normalized === 'anon-key' ||
    normalized.includes('placeholder') ||
    normalized.includes('replace-me') ||
    normalized.includes('changeme') ||
    normalized.includes('your-project') ||
    normalized.includes('your_client') ||
    normalized.includes('your-client')
  );
}

function isSupabaseProductionUrl(value) {
  if (looksLikePlaceholder(value)) return false;
  try {
    const url = new URL(clean(value));
    return (
      url.protocol === 'https:' &&
      url.pathname === '/' &&
      url.search === '' &&
      url.hash === '' &&
      /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname)
    );
  } catch {
    return false;
  }
}

function isGoogleClientId(value) {
  const clientId = clean(value);
  return (
    !looksLikePlaceholder(clientId) &&
    /^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(clientId)
  );
}

function expectedGoogleIosUrlScheme(googleIosClientId) {
  if (!isGoogleClientId(googleIosClientId)) return null;
  return `com.googleusercontent.apps.${clean(googleIosClientId).slice(
    0,
    -GOOGLE_CLIENT_ID_SUFFIX.length
  )}`;
}

function hasPlugin(expoConfig, pluginName) {
  return (expoConfig.plugins || []).some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === pluginName : plugin === pluginName
  );
}

function hasGoogleIosRedirectScheme(expoConfig, expectedScheme) {
  return (expoConfig.plugins || []).some(
    (plugin) =>
      Array.isArray(plugin) &&
      plugin[0] === '@react-native-google-signin/google-signin' &&
      plugin[1]?.iosUrlScheme === expectedScheme
  );
}

function hasPlistString(plistContents, value) {
  if (typeof plistContents !== 'string') return false;
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<string>\\s*${escapedValue}\\s*</string>`).test(
    plistContents
  );
}

function hasAppleSignInEntitlement(entitlements) {
  if (typeof entitlements !== 'string') return false;
  const appleEntitlement = entitlements.match(
    /<key>\s*com\.apple\.developer\.applesignin\s*<\/key>\s*<array>([\s\S]*?)<\/array>/
  );
  return Boolean(
    appleEntitlement && hasPlistString(appleEntitlement[1], 'Default')
  );
}

function hasRemotePushEntitlement(entitlements) {
  return (
    typeof entitlements === 'string' &&
    /<key>\s*aps-environment\s*<\/key>/.test(entitlements)
  );
}

function hasPlistUrlScheme(infoPlist, expectedScheme) {
  if (typeof infoPlist !== 'string') return false;
  const urlSchemeArrays = infoPlist.matchAll(
    /<key>\s*CFBundleURLSchemes\s*<\/key>\s*<array>([\s\S]*?)<\/array>/g
  );
  return Array.from(urlSchemeArrays).some((match) =>
    hasPlistString(match[1], expectedScheme)
  );
}

function readCheckedInNativeIosConfig(mobileRoot) {
  const iosRoot = path.join(mobileRoot, 'ios');
  if (!fs.existsSync(iosRoot)) return null;

  const nativeRoot = path.join(iosRoot, 'SpiceSync');
  const infoPlistPath = path.join(nativeRoot, 'Info.plist');
  const entitlementsPath = path.join(nativeRoot, 'SpiceSync.entitlements');

  return {
    infoPlist: fs.existsSync(infoPlistPath)
      ? fs.readFileSync(infoPlistPath, 'utf8')
      : '',
    entitlements: fs.existsSync(entitlementsPath)
      ? fs.readFileSync(entitlementsPath, 'utf8')
      : '',
  };
}

function isPartnerSyncEnabled(environment) {
  return Boolean(
    clean(environment.EXPO_PUBLIC_SUPABASE_URL) ||
    clean(environment.EXPO_PUBLIC_SUPABASE_ANON_KEY)
  );
}

function isManagedDeletionUrl(value) {
  const deletionUrl = clean(value);
  if (looksLikePlaceholder(deletionUrl)) return false;

  try {
    const url = new URL(deletionUrl);
    const isRawSupabaseFunctionOrigin =
      /(^|\.)supabase\.co$/i.test(url.hostname) &&
      url.pathname.startsWith('/functions/v1/');

    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !isRawSupabaseFunctionOrigin
    );
  } catch {
    return false;
  }
}

function isEasProductionBuild(environment) {
  return clean(environment.EAS_BUILD_PROFILE).toLowerCase() === 'production';
}

function collectProductionSocialRecoveryErrors({
  environment,
  expoConfig,
  nativeIosConfig = null,
  requireSocialRecovery = false,
}) {
  const socialRecoveryRequired =
    requireSocialRecovery || isEasProductionBuild(environment);
  if (!socialRecoveryRequired && !isPartnerSyncEnabled(environment)) return [];

  const errors = [];
  const supabaseUrl = environment.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = environment.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const googleWebClientId = environment.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleIosClientId = environment.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!isSupabaseProductionUrl(supabaseUrl)) {
    errors.push(
      'EXPO_PUBLIC_SUPABASE_URL must be a non-placeholder https://<project-ref>.supabase.co URL.'
    );
  }
  if (
    looksLikePlaceholder(supabaseAnonKey) ||
    clean(supabaseAnonKey).length < 24
  ) {
    errors.push(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing or looks like a placeholder.'
    );
  }
  if (!isGoogleClientId(googleWebClientId)) {
    errors.push(
      'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID must be a non-placeholder Google OAuth web client ID.'
    );
  }
  if (!isGoogleClientId(googleIosClientId)) {
    errors.push(
      'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must be a non-placeholder Google OAuth iOS client ID.'
    );
  }
  if (expoConfig.ios?.usesAppleSignIn !== true) {
    errors.push(
      'Apple Sign In capability must be enabled in Expo iOS configuration.'
    );
  }
  if (!hasPlugin(expoConfig, 'expo-apple-authentication')) {
    errors.push('Apple Sign In Expo plugin must be configured.');
  }
  if (expoConfig.scheme !== EXPECTED_APP_SCHEME) {
    errors.push(
      `Missing SpiceSync redirect/callback scheme: expo.scheme must be "${EXPECTED_APP_SCHEME}".`
    );
  }
  if (expoConfig.ios?.bundleIdentifier !== EXPECTED_APPLICATION_ID) {
    errors.push(`iOS bundle identifier must be ${EXPECTED_APPLICATION_ID}.`);
  }
  if (expoConfig.android?.package !== EXPECTED_APPLICATION_ID) {
    errors.push(`Android package must be ${EXPECTED_APPLICATION_ID}.`);
  }

  const expectedScheme = expectedGoogleIosUrlScheme(googleIosClientId);
  if (
    expectedScheme &&
    !hasGoogleIosRedirectScheme(expoConfig, expectedScheme)
  ) {
    errors.push(
      `Google iOS redirect/callback scheme must be ${expectedScheme}.`
    );
  }

  if (socialRecoveryRequired && nativeIosConfig) {
    if (hasRemotePushEntitlement(nativeIosConfig.entitlements)) {
      errors.push(
        'The checked-in iOS entitlements must not request remote push notifications; SpiceSync currently schedules local notifications only.'
      );
    }
    if (!hasAppleSignInEntitlement(nativeIosConfig.entitlements)) {
      errors.push(
        'The checked-in iOS entitlements must enable Sign in with Apple before a production build.'
      );
    }
    if (
      expectedScheme &&
      !hasPlistUrlScheme(nativeIosConfig.infoPlist, expectedScheme)
    ) {
      errors.push(
        `The checked-in iOS Info.plist must register Google callback scheme ${expectedScheme} before a production build.`
      );
    }
  }

  if (socialRecoveryRequired) {
    if (!isManagedDeletionUrl(environment.SPICESYNC_ACCOUNT_DELETION_URL)) {
      errors.push(
        'SPICESYNC_ACCOUNT_DELETION_URL must be a stable managed HTTPS proxy/gateway URL, not a raw *.supabase.co/functions/v1 URL.'
      );
    }
    if (clean(environment.SPICESYNC_DELETION_RATE_LIMIT_VERIFIED) !== 'true') {
      errors.push(
        'SPICESYNC_DELETION_RATE_LIMIT_VERIFIED must be exactly true after managed rate-limit, monitoring, pass-through-header, GET/POST, and origin-bypass verification.'
      );
    }
  }

  return errors;
}

module.exports = {
  collectProductionSocialRecoveryErrors,
  isEasProductionBuild,
  isPartnerSyncEnabled,
  readCheckedInNativeIosConfig,
};
