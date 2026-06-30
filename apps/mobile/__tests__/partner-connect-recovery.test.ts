import fs from 'fs';
import path from 'path';

const partnerConnectPath = path.join(
  __dirname,
  '..',
  'app',
  '(onboarding)',
  'partner-connect.tsx'
);

describe('partner connect recovery UX', () => {
  const source = () => fs.readFileSync(partnerConnectPath, 'utf8');

  it('offers inline retry and local-device fallback for remote sync failures', () => {
    const partnerConnect = source();

    expect(partnerConnect).toContain('function RecoveryCard');
    expect(partnerConnect).toContain('Use this device instead');
    expect(partnerConnect).toContain('Could not create invite');
    expect(partnerConnect).toContain('Could not load invite');
    expect(partnerConnect).toContain('Could not link');
    expect(partnerConnect).toContain('onRetryLookup');
    expect(partnerConnect).toContain('lookupRetryKey');
  });

  it('shows paste and invite status errors without dead-ending on accept', () => {
    const partnerConnect = source();

    expect(partnerConnect).toContain('pasteError');
    expect(partnerConnect).toContain('Invite expired');
    expect(partnerConnect).toContain('Invite already used');
    expect(partnerConnect).toContain('Ask your partner to create a new invite');
    expect(partnerConnect).not.toContain(
      "Alert.alert(\n        'Could not create invite'"
    );
    expect(partnerConnect).not.toContain("Alert.alert(\n        'Could not link'");
  });
});
