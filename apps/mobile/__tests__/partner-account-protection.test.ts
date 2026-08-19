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
  it('offers account protection for an existing anonymous remote connection without invoking recovery', () => {
    const partnerSync = fs.readFileSync(partnerSyncPath, 'utf8');

    expect(partnerSync).toContain('PartnerAccountGate');
    expect(partnerSync).toContain('getSnapshot()');
    expect(partnerSync).toContain("accountStatus === 'anonymous'");
    expect(partnerSync).toContain('handleProtectionComplete');
    expect(partnerSync).not.toContain('recoverPermanentAccount');
  });
});
