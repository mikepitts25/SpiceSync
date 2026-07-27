import {
  ROUND_COUNT_OPTIONS,
  buildSessionQuestions,
  isMatch,
  recordRound,
  summarizeSession,
} from '../lib/knowMeBetter';
import { KNOW_ME_BETTER_QUESTIONS } from '../data/knowMeBetter';

describe('know me better question bank', () => {
  it('has 24-36 curated prompts per language with 3-4 structured options', () => {
    for (const language of ['en', 'es'] as const) {
      const bank = KNOW_ME_BETTER_QUESTIONS[language];
      expect(bank.length).toBeGreaterThanOrEqual(24);
      expect(bank.length).toBeLessThanOrEqual(36);
      for (const question of bank) {
        expect(question.options.length).toBeGreaterThanOrEqual(3);
        expect(question.options.length).toBeLessThanOrEqual(4);
        expect(new Set(question.options).size).toBe(question.options.length);
      }
    }
  });

  it('covers all four low-pressure categories in both languages', () => {
    for (const language of ['en', 'es'] as const) {
      const categories = new Set(
        KNOW_ME_BETTER_QUESTIONS[language].map((q) => q.category)
      );
      expect(categories).toEqual(
        new Set(['playful', 'preferences', 'connection', 'date_night'])
      );
    }
  });

  it('has unique ids within each language', () => {
    for (const language of ['en', 'es'] as const) {
      const ids = KNOW_ME_BETTER_QUESTIONS[language].map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('buildSessionQuestions', () => {
  it('returns exactly the requested round count without repeats', () => {
    const questions = buildSessionQuestions(10, 'en', () => 0.42);
    expect(questions).toHaveLength(10);
    expect(new Set(questions.map((q) => q.id)).size).toBe(10);
  });

  it('supports 1, 3, 5, and 10 round sessions', () => {
    for (const count of ROUND_COUNT_OPTIONS) {
      const questions = buildSessionQuestions(count, 'en', () => 0.1);
      expect(questions).toHaveLength(count);
    }
  });

  it('falls back to English for an unknown language key', () => {
    // @ts-expect-error deliberately invalid language for a defensive check
    const questions = buildSessionQuestions(3, 'fr', () => 0.5);
    expect(questions).toHaveLength(3);
  });

  it('shuffles deterministically for a fixed random source', () => {
    const first = buildSessionQuestions(5, 'en', () => 0.3);
    const second = buildSessionQuestions(5, 'en', () => 0.3);
    expect(first.map((q) => q.id)).toEqual(second.map((q) => q.id));
  });
});

describe('scoring and reveal', () => {
  const question = KNOW_ME_BETTER_QUESTIONS.en[0];

  it('detects a match when options are identical', () => {
    expect(isMatch('Sunshine', 'Sunshine')).toBe(true);
    expect(isMatch('Sunshine', 'Trouble')).toBe(false);
  });

  it('records a round result with match status', () => {
    const hit = recordRound(question, question.options[0], question.options[0]);
    expect(hit.isMatch).toBe(true);

    const miss = recordRound(
      question,
      question.options[0],
      question.options[1]
    );
    expect(miss.isMatch).toBe(false);
  });

  it('summarizes a session by rounds played and matches, never a failure count', () => {
    const results = [
      recordRound(question, 'a', 'a'),
      recordRound(question, 'a', 'b'),
      recordRound(question, 'a', 'a'),
    ];
    const summary = summarizeSession(results);
    expect(summary).toEqual({ roundsPlayed: 3, matches: 2 });
    expect(summary).not.toHaveProperty('misses');
    expect(summary).not.toHaveProperty('failures');
  });

  it('summarizes an empty session', () => {
    expect(summarizeSession([])).toEqual({ roundsPlayed: 0, matches: 0 });
  });
});
