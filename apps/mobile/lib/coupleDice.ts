// Pure Couple Dice roll + prompt selection logic. No storage, no React.
// RNG is injectable so rolls are deterministic in tests.
import {
  DICE_ACTIONS,
  DICE_MOMENTS,
  DICE_MOODS,
  buildDicePrompt,
  type DiceAction,
  type DiceLanguage,
  type DiceMoment,
  type DiceMood,
} from '../data/coupleDice';

export type DiceIntensity = 1 | 2 | 3 | 4 | 5;

export const DEFAULT_INTENSITY_RANGE: DiceIntensity[] = [1, 2, 3];
export const ALL_INTENSITY_LEVELS: DiceIntensity[] = [1, 2, 3, 4, 5];

export type DiceRoll = {
  mood: DiceMood;
  action: DiceAction;
  moment: DiceMoment;
  intensity: DiceIntensity;
  prompt: string;
};

// Every action carries a base intensity weight; the actual intensity of a
// roll is that weight nudged by the moment (more immediate moments read
// slightly bolder). Both stay well inside 1-5 for every combination.
const ACTION_BASE_INTENSITY: Record<DiceAction, DiceIntensity> = {
  talk: 1,
  compliment: 2,
  choose: 3,
  explore: 4,
  plan: 2,
};

const MOMENT_INTENSITY_NUDGE: Record<DiceMoment, number> = {
  right_now: 1,
  this_evening: 0,
  this_week: 0,
  next_date_night: -1,
};

function clampIntensity(value: number): DiceIntensity {
  return Math.min(5, Math.max(1, Math.round(value))) as DiceIntensity;
}

function computeRollIntensity(
  action: DiceAction,
  moment: DiceMoment
): DiceIntensity {
  return clampIntensity(
    ACTION_BASE_INTENSITY[action] + MOMENT_INTENSITY_NUDGE[moment]
  );
}

function pick<T>(items: readonly T[], random: () => number): T {
  const index = Math.floor(random() * items.length) % items.length;
  return items[index];
}

/**
 * Rolls a mood/action/moment combination whose resulting intensity falls
 * within `allowedIntensities`, then assembles the natural-language prompt.
 * Falls back to the full action set if the filtered set would be empty
 * (keeps the dice always rollable rather than silently doing nothing).
 */
export function rollDice({
  allowedIntensities = DEFAULT_INTENSITY_RANGE,
  language = 'en',
  random = Math.random,
}: {
  allowedIntensities?: readonly DiceIntensity[];
  language?: DiceLanguage;
  random?: () => number;
} = {}): DiceRoll {
  const mood = pick(DICE_MOODS, random);
  const moment = pick(DICE_MOMENTS, random);

  const eligibleActions = DICE_ACTIONS.filter((action) =>
    allowedIntensities.includes(computeRollIntensity(action, moment))
  );
  const actionPool = eligibleActions.length ? eligibleActions : DICE_ACTIONS;
  const action = pick(actionPool, random);
  const intensity = computeRollIntensity(action, moment);
  const prompt = buildDicePrompt(mood, action, moment, language);

  return { mood, action, moment, intensity, prompt };
}

export function normalizeIntensityRange(
  levels: readonly number[] | undefined
): DiceIntensity[] {
  const filtered = (levels ?? [])
    .filter((level): level is DiceIntensity =>
      ALL_INTENSITY_LEVELS.includes(level as DiceIntensity)
    )
    .sort((a, b) => a - b);
  return filtered.length
    ? Array.from(new Set(filtered))
    : [...DEFAULT_INTENSITY_RANGE];
}
