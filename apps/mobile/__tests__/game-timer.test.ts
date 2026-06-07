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

  it('does not assign countdowns to discussion or quick creative cards', () => {
    const cardsThatShouldNotShowTimers = MASTER_DECK.filter((card) => {
      const isDiscussionCard = ['truth', 'fantasy', 'roleplay'].includes(
        card.type
      );
      const isQuickCreativeAction =
        /\b(trace|write|draw|letter|letters|poem|note|vision board|goals|playlist)\b/i.test(
          card.content
        );

      return isDiscussionCard || isQuickCreativeAction;
    });

    expect(cardsThatShouldNotShowTimers.map((card) => card.id)).not.toEqual([]);
    expect(
      cardsThatShouldNotShowTimers.filter(
        (card) => parseGameCardTimerSeconds(card.estimatedTime) > 0
      )
    ).toEqual([]);
  });

  it('only assigns countdowns when the card text asks for seconds or minutes', () => {
    const timedCards = ALL_PLAYABLE_CARDS.filter(
      (card) => parseGameCardTimerSeconds(card.estimatedTime) > 0
    );

    expect(timedCards.map((card) => card.id)).not.toEqual([]);
    expect(
      timedCards.filter(
        (card) =>
          !/\b\d+\s*(?:sec|second|seconds|min|minute|minutes|segundo|segundos|minuto|minutos)\b/i.test(
            card.content
          )
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
