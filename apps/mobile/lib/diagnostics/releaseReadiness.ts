import { shouldInitializeNotificationsOnLaunch } from '../notifications/environment';

export type ReleaseDiagnosticStatus = 'pass' | 'warning' | 'fail';

export type ReleaseDiagnosticCheck = {
  id: string;
  label: string;
  status: ReleaseDiagnosticStatus;
  value: string;
  detail: string;
};

export type ReleaseDiagnosticsInput = {
  appName?: string | null;
  version?: string | null;
  iosBundleIdentifier?: string | null;
  androidPackage?: string | null;
  easProjectId?: string | null;
  supabaseConfigured: boolean;
  purchasesConfigured: boolean;
  appOwnership?: string | null;
  legalRoutesPresent: boolean;
};

export type ReleaseDiagnosticsSummary = {
  pass: number;
  warning: number;
  fail: number;
  overall: ReleaseDiagnosticStatus;
};

function clean(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function isPlaceholderIdentifier(identifier: string): boolean {
  const normalized = identifier.toLowerCase();
  return (
    !normalized ||
    normalized.includes('.anonymous.') ||
    normalized.startsWith('com.anonymous')
  );
}

function isProductionIdentifier(identifier: string): boolean {
  return /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/.test(identifier);
}

function makeCheck(
  id: string,
  label: string,
  status: ReleaseDiagnosticStatus,
  value: string,
  detail: string
): ReleaseDiagnosticCheck {
  return { id, label, status, value, detail };
}

export function buildReleaseDiagnostics(
  input: ReleaseDiagnosticsInput
): ReleaseDiagnosticCheck[] {
  const appName = clean(input.appName);
  const version = clean(input.version);
  const iosBundleIdentifier = clean(input.iosBundleIdentifier);
  const androidPackage = clean(input.androidPackage);
  const easProjectId = clean(input.easProjectId);
  const identityReady =
    appName.length > 0 &&
    isProductionIdentifier(iosBundleIdentifier) &&
    isProductionIdentifier(androidPackage) &&
    !isPlaceholderIdentifier(iosBundleIdentifier) &&
    !isPlaceholderIdentifier(androidPackage);

  return [
    makeCheck(
      'app-identity',
      'App identity',
      identityReady ? 'pass' : 'fail',
      identityReady ? 'Production IDs' : 'Placeholder IDs',
      identityReady
        ? 'Bundle and package identifiers are release shaped.'
        : 'Replace anonymous bundle/package identifiers before store submission.'
    ),
    makeCheck(
      'version',
      'App version',
      /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version) ? 'pass' : 'fail',
      version || 'Missing',
      version
        ? 'A visible semantic app version is configured.'
        : 'Add an app version before release review.'
    ),
    makeCheck(
      'eas-project',
      'EAS project',
      easProjectId && easProjectId !== 'local' ? 'pass' : 'warning',
      easProjectId && easProjectId !== 'local' ? 'Configured' : 'Local',
      easProjectId && easProjectId !== 'local'
        ? 'Builds can target an EAS project.'
        : 'Set a real EAS project id before relying on hosted builds.'
    ),
    makeCheck(
      'supabase-relay',
      'Supabase relay',
      input.supabaseConfigured ? 'pass' : 'warning',
      input.supabaseConfigured ? 'Configured' : 'Not configured',
      input.supabaseConfigured
        ? 'Remote partner sync can reach the relay.'
        : 'Remote partner sync needs Supabase URL and anon key in release builds.'
    ),
    makeCheck(
      'purchases',
      'Purchases',
      input.purchasesConfigured ? 'pass' : 'warning',
      input.purchasesConfigured ? 'Provider enabled' : 'Free mode',
      input.purchasesConfigured
        ? 'The purchase provider flag is enabled for this build.'
        : 'Purchases are disabled, so premium unlocks remain unavailable.'
    ),
    makeCheck(
      'notifications',
      'Notifications',
      shouldInitializeNotificationsOnLaunch(input.appOwnership)
        ? 'pass'
        : 'warning',
      input.appOwnership === 'expo' ? 'Expo Go' : 'Release capable',
      shouldInitializeNotificationsOnLaunch(input.appOwnership)
        ? 'Launch notification setup is enabled outside Expo Go.'
        : 'Expo Go skips launch notification setup; verify in a development or release build.'
    ),
    makeCheck(
      'legal-routes',
      'Legal screens',
      input.legalRoutesPresent ? 'pass' : 'fail',
      input.legalRoutesPresent ? 'Mounted' : 'Missing',
      input.legalRoutesPresent
        ? 'Privacy Policy and Terms are available from Settings.'
        : 'Mount legal screens before submitting to stores.'
    ),
  ];
}

export function summarizeReleaseDiagnostics(
  checks: ReleaseDiagnosticCheck[]
): ReleaseDiagnosticsSummary {
  const summary = checks.reduce<ReleaseDiagnosticsSummary>(
    (result, check) => ({
      ...result,
      [check.status]: result[check.status] + 1,
    }),
    { pass: 0, warning: 0, fail: 0, overall: 'pass' }
  );

  if (summary.fail > 0) {
    summary.overall = 'fail';
  } else if (summary.warning > 0) {
    summary.overall = 'warning';
  }

  return summary;
}
