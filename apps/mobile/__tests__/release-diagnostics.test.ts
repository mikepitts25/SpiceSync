import {
  buildReleaseDiagnostics,
  summarizeReleaseDiagnostics,
} from '../lib/diagnostics/releaseReadiness';

function byId(checks: ReturnType<typeof buildReleaseDiagnostics>, id: string) {
  const check = checks.find((item) => item.id === id);
  if (!check) {
    throw new Error(`Missing diagnostic check: ${id}`);
  }
  return check;
}

describe('release readiness diagnostics', () => {
  it('flags placeholder and free-mode configuration before release', () => {
    const checks = buildReleaseDiagnostics({
      appName: 'SpiceSync',
      version: '1.0.0',
      iosBundleIdentifier: 'com.anonymous.spicesync',
      androidPackage: 'com.anonymous.spicesync',
      easProjectId: 'local',
      supabaseConfigured: false,
      purchasesConfigured: false,
      appOwnership: 'expo',
      legalRoutesPresent: true,
    });

    expect(byId(checks, 'app-identity').status).toBe('fail');
    expect(byId(checks, 'eas-project').status).toBe('warning');
    expect(byId(checks, 'supabase-relay').status).toBe('warning');
    expect(byId(checks, 'purchases').status).toBe('warning');
    expect(byId(checks, 'notifications').status).toBe('warning');
    expect(byId(checks, 'legal-routes').status).toBe('pass');

    expect(summarizeReleaseDiagnostics(checks)).toEqual({
      pass: 2,
      warning: 4,
      fail: 1,
      overall: 'fail',
    });
  });

  it('passes production configuration checks without exposing secrets', () => {
    const checks = buildReleaseDiagnostics({
      appName: 'SpiceSync',
      version: '1.2.3',
      iosBundleIdentifier: 'com.spicesync.app',
      androidPackage: 'com.spicesync.app',
      easProjectId: '7a49fd20-7190-4a28-b368-3d1b4a13a930',
      supabaseConfigured: true,
      purchasesConfigured: true,
      appOwnership: 'standalone',
      legalRoutesPresent: true,
    });

    expect(checks.map((check) => check.status)).toEqual([
      'pass',
      'pass',
      'pass',
      'pass',
      'pass',
      'pass',
      'pass',
    ]);
    expect(JSON.stringify(checks)).not.toContain('EXPO_PUBLIC');
    expect(JSON.stringify(checks)).not.toContain('anon');
    expect(summarizeReleaseDiagnostics(checks).overall).toBe('pass');
  });
});
