// Pure Know Me Better selection, scoring, and reveal logic. No storage, no
// React — answers are intentionally never persisted (v1: structured options
// only, session resets when the user leaves).
import {
  KNOW_ME_BETTER_QUESTIONS,
  type KnowMeBetterQuestion,
} from '../data/knowMeBetter';

export type KnowMeBetterLanguage = 'en' | 'es';
export type RoundCount = 1 | 3 | 5 | 10;

export const ROUND_COUNT_OPTIONS: RoundCount[] = [1, 3, 5, 10];

export type RoundResult = {
  questionId: string;
  answererOption: string;
  guesserOption: string;
  isMatch: boolean;
};

export type SessionSummary = {
  roundsPlayed: number;
  matches: number;
};

/**
 * Builds a session's question queue: `count` questions drawn without
 * repeats. Returns fewer than `count` only if the bank itself is smaller.
 */
export function buildSessionQuestions(
  count: RoundCount,
  language: KnowMeBetterLanguage = 'en',
  random: () => number = Math.random
): KnowMeBetterQuestion[] {
  const bank =
    KNOW_ME_BETTER_QUESTIONS[language] ?? KNOW_ME_BETTER_QUESTIONS.en;
  const pool = [...bank];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}

export function isMatch(
  answererOption: string,
  guesserOption: string
): boolean {
  return answererOption === guesserOption;
}

export function recordRound(
  question: KnowMeBetterQuestion,
  answererOption: string,
  guesserOption: string
): RoundResult {
  return {
    questionId: question.id,
    answererOption,
    guesserOption,
    isMatch: isMatch(answererOption, guesserOption),
  };
}

export function summarizeSession(
  results: readonly RoundResult[]
): SessionSummary {
  return {
    roundsPlayed: results.length,
    matches: results.filter((result) => result.isMatch).length,
  };
}
