import { useKinks } from '../lib/data';

describe('paired kink data', () => {
  it('collapses complete opt-in give/receive pairs into one selector card', () => {
    const { kinks, kinksById } = useKinks('en');

    expect(kinksById['0008']).toBeUndefined();
    expect(kinksById['0277']).toBeUndefined();
    expect(kinksById['pair:oral-pleasure']).toMatchObject({
      id: 'pair:oral-pleasure',
      slug: 'oral-pleasure',
      title: 'Oral Pleasure',
      pairMode: true,
      pairKey: 'oral-pleasure',
      sourceIds: ['0008', '0277'],
      availablePairRoles: ['give', 'receive', 'both'],
    });

    const roleTags = new Set(kinksById['pair:oral-pleasure'].tags);
    expect(roleTags.has('give')).toBe(false);
    expect(roleTags.has('giving')).toBe(false);
    expect(roleTags.has('receive')).toBe(false);
    expect(roleTags.has('receiving')).toBe(false);

    const pairedCards = kinks.filter((kink) => kink.id.startsWith('pair:'));
    expect(pairedCards).toHaveLength(28);
  });
});
