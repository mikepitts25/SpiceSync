import {
  MAIN_SCREEN_TOURS,
  MAIN_TOUR_SCREEN_IDS,
} from '../lib/main-screen-tours';

describe('main screen tour content', () => {
  it('defines tours for the five main screens in tab order', () => {
    expect(MAIN_TOUR_SCREEN_IDS).toEqual([
      'profiles',
      'deck',
      'matches',
      'conversation',
      'game',
    ]);
  });

  it('gives every main screen a concise multi-step tour', () => {
    MAIN_TOUR_SCREEN_IDS.forEach((screenId) => {
      const steps = MAIN_SCREEN_TOURS[screenId];

      expect(steps.length).toBeGreaterThanOrEqual(2);
      steps.forEach((step) => {
        expect(step.title.trim()).toBe(step.title);
        expect(step.body.trim()).toBe(step.body);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.body.length).toBeGreaterThan(0);
        expect(step.body.length).toBeLessThanOrEqual(140);
      });
    });
  });

  it('keeps skip behavior scoped by screen id through the content map', () => {
    expect(Object.keys(MAIN_SCREEN_TOURS).sort()).toEqual(
      [...MAIN_TOUR_SCREEN_IDS].sort()
    );
  });
});
