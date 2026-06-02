import fs from 'fs';
import path from 'path';

const appRoot = path.join(__dirname, '..', 'app');

describe('expo router file layout', () => {
  it('keeps welcome helper modules outside the app route tree', () => {
    expect(fs.existsSync(path.join(appRoot, 'welcome', 'content.ts'))).toBe(
      false
    );
    expect(fs.existsSync(path.join(appRoot, 'welcome', 'routing.ts'))).toBe(
      false
    );
  });

  it('does not register root stack route groups without layouts', () => {
    const rootLayout = fs.readFileSync(
      path.join(appRoot, '_layout.tsx'),
      'utf8'
    );

    expect(rootLayout).not.toContain('<Stack.Screen name="(unlock)"');
    expect(rootLayout).not.toContain('<Stack.Screen name="(redeem)"');
    expect(rootLayout).not.toContain('<Stack.Screen name="(conversation)"');
  });

  it('mounts the deep-link handler from the root layout', () => {
    const rootLayout = fs.readFileSync(
      path.join(appRoot, '_layout.tsx'),
      'utf8'
    );

    expect(rootLayout).toContain(
      "import { useDeepLinks } from '../lib/deepLinks'"
    );
    expect(rootLayout).toContain('useDeepLinks();');
  });

  it('routes partner connection entry points to the partner-connect screen', () => {
    const settingsScreen = fs.readFileSync(
      path.join(appRoot, '(settings)', 'index.tsx'),
      'utf8'
    );
    const profilesTab = fs.readFileSync(
      path.join(appRoot, '(tabs)', 'profiles.tsx'),
      'utf8'
    );

    expect(settingsScreen).toContain("'/(onboarding)/partner-connect'");
    expect(profilesTab).toContain(
      "router.push('/(onboarding)/partner-connect')"
    );
  });

  it('routes active remote partner entry points to the sync dashboard', () => {
    const settingsLayout = fs.readFileSync(
      path.join(appRoot, '(settings)', '_layout.tsx'),
      'utf8'
    );
    const settingsScreen = fs.readFileSync(
      path.join(appRoot, '(settings)', 'index.tsx'),
      'utf8'
    );
    const profilesTab = fs.readFileSync(
      path.join(appRoot, '(tabs)', 'profiles.tsx'),
      'utf8'
    );

    expect(settingsLayout).toContain('<Stack.Screen name="partner-sync" />');
    expect(settingsScreen).toContain('remotePartnerActive');
    expect(settingsScreen).toContain("'/(settings)/partner-sync'");
    expect(profilesTab).toContain("router.push('/(settings)/partner-sync')");
  });

  it('removes legacy partner short-code routes and entry points', () => {
    const partnerConnect = fs.readFileSync(
      path.join(appRoot, '(onboarding)', 'partner-connect.tsx'),
      'utf8'
    );
    const deepLinks = fs.readFileSync(
      path.join(appRoot, '..', 'lib', 'deepLinks.ts'),
      'utf8'
    );
    const profilesTab = fs.readFileSync(
      path.join(appRoot, '(tabs)', 'profiles.tsx'),
      'utf8'
    );

    expect(partnerConnect).not.toContain('short-code');
    expect(partnerConnect).not.toContain('legacy short code');
    expect(partnerConnect).not.toContain('usePartnerStore');
    expect(deepLinks).not.toContain('parseInviteCode');
    expect(deepLinks).not.toContain('usePartnerStore');
    expect(profilesTab).not.toContain('usePartnerStore');
  });

  it('navigates completed partner setup to a concrete tab route', () => {
    const partnerConnect = fs.readFileSync(
      path.join(appRoot, '(onboarding)', 'partner-connect.tsx'),
      'utf8'
    );

    expect(partnerConnect).toContain("router.replace('/(tabs)/deck')");
    expect(partnerConnect).not.toContain("router.replace('/(tabs)')");
  });

  it('supports sharing remote invite links without messaging between devices', () => {
    const partnerConnect = fs.readFileSync(
      path.join(appRoot, '(onboarding)', 'partner-connect.tsx'),
      'utf8'
    );

    expect(partnerConnect).toContain('react-native-qrcode-svg');
    expect(partnerConnect).toContain('expo-clipboard');
    expect(partnerConnect).toContain('Paste invite link');
    expect(partnerConnect).toContain('parseInviteUrl');
  });

  it('renders invite QR codes with visible dark modules on a light background', () => {
    const partnerConnect = fs.readFileSync(
      path.join(appRoot, '(onboarding)', 'partner-connect.tsx'),
      'utf8'
    );

    expect(partnerConnect).toContain('color="#111111"');
    expect(partnerConnect).toContain('backgroundColor="#FFFFFF"');
    expect(partnerConnect).not.toContain('color={COLORS.text}');
  });

  it('cleans up removed local partner-code storage on launch', () => {
    const rootLayout = fs.readFileSync(
      path.join(appRoot, '_layout.tsx'),
      'utf8'
    );

    expect(rootLayout).toContain('cleanupLegacyPartnerCodes');
  });

  it('does not grant mock premium purchases from the unlock UI', () => {
    const unlockScreen = fs.readFileSync(
      path.join(appRoot, '(unlock)', 'index.tsx'),
      'utf8'
    );

    expect(unlockScreen).not.toContain('mock_receipt');
    expect(unlockScreen).not.toContain('upgrade(');
    expect(unlockScreen).toContain('Join waitlist');
  });

  it('exposes release diagnostics from Settings', () => {
    const settingsLayout = fs.readFileSync(
      path.join(appRoot, '(settings)', '_layout.tsx'),
      'utf8'
    );
    const settingsScreen = fs.readFileSync(
      path.join(appRoot, '(settings)', 'index.tsx'),
      'utf8'
    );

    expect(
      fs.existsSync(path.join(appRoot, '(settings)', 'release-diagnostics.tsx'))
    ).toBe(true);
    expect(settingsLayout).toContain(
      '<Stack.Screen name="release-diagnostics" />'
    );
    expect(settingsScreen).toContain("'/(settings)/release-diagnostics'");
  });
});
