import fs from 'fs';
import path from 'path';

import { hasPremiumFeatureAccess } from '../lib/purchases/access';

const appRoot = path.join(__dirname, '..', 'app');

describe('premium access', () => {
  const originalPurchasesEnabled = process.env.EXPO_PUBLIC_PURCHASES_ENABLED;
  const originalFreeBetaAccess = process.env.EXPO_PUBLIC_FREE_BETA_ACCESS;

  afterEach(() => {
    process.env.EXPO_PUBLIC_PURCHASES_ENABLED = originalPurchasesEnabled;
    process.env.EXPO_PUBLIC_FREE_BETA_ACCESS = originalFreeBetaAccess;
  });

  it('unlocks premium features for beta builds while purchases are disabled', () => {
    delete process.env.EXPO_PUBLIC_PURCHASES_ENABLED;
    delete process.env.EXPO_PUBLIC_FREE_BETA_ACCESS;

    expect(hasPremiumFeatureAccess(false)).toBe(true);
  });

  it('does not grant beta access once real purchases are enabled', () => {
    process.env.EXPO_PUBLIC_PURCHASES_ENABLED = 'true';
    delete process.env.EXPO_PUBLIC_FREE_BETA_ACCESS;

    expect(hasPremiumFeatureAccess(false)).toBe(false);
  });

  it('allows beta access to be explicitly disabled', () => {
    delete process.env.EXPO_PUBLIC_PURCHASES_ENABLED;
    process.env.EXPO_PUBLIC_FREE_BETA_ACCESS = 'false';

    expect(hasPremiumFeatureAccess(false)).toBe(false);
  });

  it('keeps explicit local unlocks enabled', () => {
    process.env.EXPO_PUBLIC_PURCHASES_ENABLED = 'true';
    process.env.EXPO_PUBLIC_FREE_BETA_ACCESS = 'false';

    expect(hasPremiumFeatureAccess(true)).toBe(true);
  });

  it('uses the shared access helper from premium-gated screens', () => {
    const gatedScreens = [
      path.join(appRoot, '(game)', 'index.tsx'),
      path.join(appRoot, '(game)', 'draw.tsx'),
      path.join(appRoot, '(game)', 'custom-deck.tsx'),
      path.join(appRoot, '(settings)', 'export.tsx'),
    ];

    for (const screenPath of gatedScreens) {
      const source = fs.readFileSync(screenPath, 'utf8');

      expect(source).toContain('hasPremiumFeatureAccess');
    }
  });
});
