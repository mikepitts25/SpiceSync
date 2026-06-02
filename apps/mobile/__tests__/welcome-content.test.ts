import {
  WELCOME_SCREEN_ORDER,
  WELCOME_VALUE_SCREENS,
} from '../lib/welcome/content';
import { WELCOME_READINESS_REQUIREMENTS } from '../lib/welcome/readiness';
import { en } from '../lib/i18n/en';
import { es } from '../lib/i18n/es';

describe('welcome onboarding content', () => {
  it('uses a five-screen flow without a redundant privacy slide', () => {
    expect(WELCOME_SCREEN_ORDER).toEqual([
      'brand',
      'explore',
      'answer',
      'overlap',
      'agegate',
    ]);
  });

  it('keeps unsupported encryption claims out of onboarding copy', () => {
    const valueCopy = WELCOME_VALUE_SCREENS.map(
      (screen) => `${screen.title} ${screen.description}`
    ).join(' ');

    expect(valueCopy).not.toMatch(/encrypt/i);
    expect(valueCopy).not.toMatch(/end-to-end/i);
  });

  it('has localized readiness checklist copy for every requirement', () => {
    for (const requirement of WELCOME_READINESS_REQUIREMENTS) {
      expect(en.welcome.readiness[requirement.id]).toEqual(expect.any(String));
      expect(es.welcome.readiness[requirement.id]).toEqual(expect.any(String));
    }
    expect(en.welcome.privacyPolicy).toBe('Privacy Policy');
    expect(en.welcome.termsOfService).toBe('Terms of Service');
  });
});
