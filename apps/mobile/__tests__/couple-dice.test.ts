import {
  ALL_INTENSITY_LEVELS,
  DEFAULT_INTENSITY_RANGE,
  normalizeIntensityRange,
  rollDice,
} from '../lib/coupleDice';
import {
  DICE_ACTIONS,
  DICE_MOMENTS,
  DICE_MOODS,
  buildDicePrompt,
} from '../data/coupleDice';

describe('buildDicePrompt', () => {
  it('produces a non-empty, grammatical sentence for every mood x action x moment combination in English', () => {
    for (const mood of DICE_MOODS) {
      for (const action of DICE_ACTIONS) {
        for (const moment of DICE_MOMENTS) {
          const prompt = buildDicePrompt(mood, action, moment, 'en');
          expect(typeof prompt).toBe('string');
          expect(prompt.length).toBeGreaterThan(10);
          expect(prompt.trim().endsWith('.')).toBe(true);
          // No leftover template placeholders or double spaces.
          expect(prompt).not.toMatch(/\{\{|\}\}/);
          expect(prompt).not.toMatch(/  /);
        }
      }
    }
  });

  it('produces a sentence for every combination in Spanish', () => {
    for (const mood of DICE_MOODS) {
      for (const action of DICE_ACTIONS) {
        for (const moment of DICE_MOMENTS) {
          const prompt = buildDicePrompt(mood, action, moment, 'es');
          expect(prompt.length).toBeGreaterThan(10);
          expect(prompt).not.toMatch(/\{\{|\}\}/);
        }
      }
    }
  });

  it('always frames choices as mutual, never as an obligation on one partner', () => {
    for (const mood of DICE_MOODS) {
      const prompt = buildDicePrompt(mood, 'choose', 'this_evening', 'en');
      expect(prompt.toLowerCase()).toContain('both of you');
    }
  });
});

describe('rollDice', () => {
  it('is deterministic for a fixed random source', () => {
    const random = () => 0.25;
    const first = rollDice({ random });
    const second = rollDice({ random });
    expect(first).toEqual(second);
  });

  it('produces different rolls for different random sequences', () => {
    const first = rollDice({ random: () => 0.1 });
    const second = rollDice({ random: () => 0.9 });
    expect(first.prompt).not.toEqual(second.prompt);
  });

  it('only returns actions whose computed intensity is in the allowed range when the moment allows it', () => {
    // moment=this_evening always has an eligible action at intensity 1
    // ("talk"), so the filter — not the fallback — determines the result.
    for (let i = 0; i < 50; i += 1) {
      const random = (() => {
        let seed = i / 50;
        let call = 0;
        return () => {
          seed = (seed + 0.37) % 1;
          call += 1;
          // Force moment=this_evening (2nd pick) while letting mood/action vary.
          return call === 2 ? 0.3 : seed;
        };
      })();
      const roll = rollDice({ allowedIntensities: [1], random });
      expect(roll.intensity).toBe(1);
    }
  });

  it('falls back to the full action set for a moment with no intensity-1 action, rather than throwing', () => {
    // moment=right_now has no action whose nudged intensity is 1.
    const random = (() => {
      let call = 0;
      return () => {
        call += 1;
        return call === 2 ? 0 : 0.5; // 2nd pick selects the moment
      };
    })();
    const roll = rollDice({ allowedIntensities: [1], random });
    expect(roll.moment).toBe('right_now');
    expect(ALL_INTENSITY_LEVELS).toContain(roll.intensity);
  });

  it('falls back to the full action set when no action fits the requested range, rather than failing', () => {
    // No action/moment combination can ever be low enough for an empty
    // range other than an explicitly impossible one; force that edge case.
    const roll = rollDice({ allowedIntensities: [], random: () => 0.5 });
    expect(ALL_INTENSITY_LEVELS).toContain(roll.intensity);
    expect(typeof roll.prompt).toBe('string');
  });

  it('defaults to intensity levels 1-3', () => {
    expect(DEFAULT_INTENSITY_RANGE).toEqual([1, 2, 3]);
  });

  it('respects the requested language', () => {
    const roll = rollDice({ random: () => 0.4, language: 'es' });
    expect(typeof roll.prompt).toBe('string');
  });
});

describe('normalizeIntensityRange', () => {
  it('deduplicates, sorts, and drops out-of-range values', () => {
    expect(normalizeIntensityRange([3, 1, 3, 7, -1, 2])).toEqual([1, 2, 3]);
  });

  it('falls back to the default range when given nothing usable', () => {
    expect(normalizeIntensityRange([])).toEqual(DEFAULT_INTENSITY_RANGE);
    expect(normalizeIntensityRange(undefined)).toEqual(DEFAULT_INTENSITY_RANGE);
  });
});
