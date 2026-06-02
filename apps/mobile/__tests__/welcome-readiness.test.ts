import {
  WELCOME_READINESS_REQUIREMENTS,
  hasCompletedReadiness,
} from '../lib/welcome/readiness';

describe('welcome readiness requirements', () => {
  it('keeps explicit adult, consent, and privacy requirement ids', () => {
    expect(WELCOME_READINESS_REQUIREMENTS.map((item) => item.id)).toEqual([
      'adult',
      'consent',
      'privacy',
    ]);
  });

  it('requires every readiness item before continuing', () => {
    expect(hasCompletedReadiness({})).toBe(false);
    expect(hasCompletedReadiness({ adult: true, consent: true })).toBe(false);
    expect(
      hasCompletedReadiness({
        adult: true,
        consent: true,
        privacy: true,
      })
    ).toBe(true);
  });
});
