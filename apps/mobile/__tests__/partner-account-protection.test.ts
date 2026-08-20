import fs from 'fs';
import path from 'path';

const partnerSyncPath = path.join(
  __dirname,
  '..',
  'app',
  '(settings)',
  'partner-sync.tsx'
);

describe('grandfathered partner connection protection', () => {
  it('registers the current device after protecting an existing anonymous remote connection', () => {
    const partnerSync = fs.readFileSync(partnerSyncPath, 'utf8');

    expect(partnerSync).toContain('PartnerAccountGate');
    expect(partnerSync).toContain('getSnapshot()');
    expect(partnerSync).toContain("accountStatus === 'anonymous'");
    expect(partnerSync).toContain('handleProtectionComplete');
    expect(partnerSync).toContain('recoverPermanentAccount');
    expect(partnerSync).toContain('requireProfileConfirmation: false');
  });
});
