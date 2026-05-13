import {
  WELCOME_SCREEN_ORDER,
  WELCOME_VALUE_SCREENS,
} from '../app/welcome/content';

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
});
