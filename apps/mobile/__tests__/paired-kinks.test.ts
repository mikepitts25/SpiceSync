import { useKinks } from '../lib/data';
import { CROSS_CARD_MATCHES } from '../lib/match/counterpartMatches';

describe('paired kink data', () => {
  it('loads one-row role selector topics without legacy source rows', () => {
    const { kinks, kinksById } = useKinks('en');

    expect(kinksById['0008']).toMatchObject({
      id: '0008',
      slug: 'oral-pleasure',
      title: 'Oral Pleasure',
      pairMode: true,
      pairRole: undefined,
      availablePairRoles: ['give', 'receive', 'both'],
    });
    expect(kinksById['0277']).toBeUndefined();

    const roleTags = new Set(kinksById['0008'].tags);
    expect(roleTags.has('give')).toBe(false);
    expect(roleTags.has('giving')).toBe(false);
    expect(roleTags.has('receive')).toBe(false);
    expect(roleTags.has('receiving')).toBe(false);

    const selectorCards = kinks.filter((kink) => kink.pairMode);
    expect(selectorCards).toHaveLength(kinks.length);
    expect(kinks.some((kink) => kink.id.startsWith('pair:'))).toBe(false);
  });

  it('keeps cross-card counterpart matches valid and reciprocal', () => {
    const { kinksById } = useKinks('en');

    for (const [id, counterpartIds] of Object.entries(CROSS_CARD_MATCHES)) {
      expect(kinksById[id]).toBeDefined();

      for (const counterpartId of counterpartIds) {
        expect(kinksById[counterpartId]).toBeDefined();
        expect(CROSS_CARD_MATCHES[counterpartId]).toContain(id);
      }
    }
  });
});
