import { parseGameCardTimerSeconds } from '../lib/gameTimer';
import { MASTER_DECK } from '../data/gameCards';
import { ALL_CARDS_ES } from '../data/gameCards.es';

const ALL_PLAYABLE_CARDS = [...MASTER_DECK, ...ALL_CARDS_ES];

describe('game card timer parsing', () => {
  it('does not create countdowns for cards without timed gameplay', () => {
    expect(parseGameCardTimerSeconds('N/A')).toBe(0);
    expect(parseGameCardTimerSeconds('')).toBe(0);
    expect(parseGameCardTimerSeconds('quick')).toBe(0);
  });

  it('parses explicit countdown estimates', () => {
    expect(parseGameCardTimerSeconds('30 sec')).toBe(30);
    expect(parseGameCardTimerSeconds('1 min')).toBe(60);
    expect(parseGameCardTimerSeconds('5 min')).toBe(60);
    expect(parseGameCardTimerSeconds('ongoing')).toBe(0);
  });

  it('never returns countdowns longer than one minute', () => {
    expect(parseGameCardTimerSeconds('90 sec')).toBe(60);
    expect(parseGameCardTimerSeconds('2 minutes')).toBe(60);
    expect(
      ALL_PLAYABLE_CARDS.filter(
        (card) => parseGameCardTimerSeconds(card.estimatedTime) > 60
      )
    ).toEqual([]);
  });

  it('gives every playable card a quick 30- or 60-second countdown', () => {
    // Every card is a quick game prompt now: estimatedTime is always
    // '30 sec' or '1 min', so every draw gets a short countdown.
    expect(ALL_PLAYABLE_CARDS.length).toBeGreaterThan(0);
    expect(
      ALL_PLAYABLE_CARDS.filter(
        (card) => !['30 sec', '1 min'].includes(card.estimatedTime)
      )
    ).toEqual([]);
    expect(
      ALL_PLAYABLE_CARDS.filter(
        (card) =>
          ![30, 60].includes(parseGameCardTimerSeconds(card.estimatedTime))
      )
    ).toEqual([]);
  });

  it('uses turn counts instead of long wall-clock durations for playable tasks', () => {
    const longWallClockTaskPattern =
      /\b(?:24-hour|24 hour|weekend-long|multi-hour|seven days|one week|for days|rest of the night|esta noche|for the next (?:hour|day)|next hour|next day|1 hour|2\+ hours|slave for a day|semana de negación|cada día|próxima hora)\b/i;

    expect(
      ALL_PLAYABLE_CARDS.filter((card) => {
        const isTaskCard = ['dare', 'challenge'].includes(card.type);
        return isTaskCard && longWallClockTaskPattern.test(card.content);
      })
    ).toEqual([]);
  });
});
