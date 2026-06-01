import { type GameCard } from '../data/gameCards';

export type GameIntensityLevel = GameCard['intensity'];

const GAME_INTENSITY_LEVELS: readonly GameIntensityLevel[] = [1, 2, 3, 4, 5];
const DEFAULT_GAME_INTENSITY_LEVELS: readonly GameIntensityLevel[] = [3];

function isGameIntensityLevel(value: number): value is GameIntensityLevel {
  return GAME_INTENSITY_LEVELS.includes(value as GameIntensityLevel);
}

export function normalizeGameIntensityLevels(
  input: readonly number[] | string | number | null | undefined
): GameIntensityLevel[] {
  const rawValues =
    typeof input === 'string'
      ? input.split(',')
      : Array.isArray(input)
        ? input
        : input === null || input === undefined
          ? []
          : [input];

  const levels = rawValues
    .map((value) => Number(value))
    .filter(isGameIntensityLevel);

  const uniqueLevels = Array.from(new Set(levels)).sort((a, b) => a - b);
  return uniqueLevels.length
    ? uniqueLevels
    : [...DEFAULT_GAME_INTENSITY_LEVELS];
}

export function filterCardsBySelectedLevels(
  cards: readonly GameCard[],
  levels: readonly number[] | string | number | null | undefined
): GameCard[] {
  const selectedLevels = normalizeGameIntensityLevels(levels);
  return cards.filter((card) => selectedLevels.includes(card.intensity));
}
