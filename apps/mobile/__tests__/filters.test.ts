import {
  COMFORT_DECK_OPTIONS,
  describeTierFilter,
  filterKinksByTier,
  type Tier,
} from '../lib/state/filters';

const items = [
  { id: '1', tier: 'soft' as Tier },
  { id: '2', tier: 'naughty' as Tier },
  { id: '3', tier: 'xxx' as Tier },
  { id: '4' },
];

describe('deck tier filters', () => {
  it('returns every card when no tier is selected', () => {
    expect(filterKinksByTier(items, null).map((item) => item.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ]);
  });

  it('returns only cards matching the selected tier', () => {
    expect(filterKinksByTier(items, 'soft').map((item) => item.id)).toEqual([
      '1',
    ]);
    expect(filterKinksByTier(items, 'naughty').map((item) => item.id)).toEqual([
      '2',
    ]);
  });

  it('describes the active intensity filter for the deck header', () => {
    expect(describeTierFilter(null)).toBe('All intensity levels');
    expect(describeTierFilter('soft')).toBe('Soft intensity');
    expect(describeTierFilter('xxx')).toBe('XXX intensity');
  });

  it('offers every starting deck intensity including XXX', () => {
    expect(COMFORT_DECK_OPTIONS.map((option) => option.label)).toEqual([
      'SOFT',
      'NAUGHTY',
      'XXX',
      'ALL',
    ]);

    expect(
      COMFORT_DECK_OPTIONS.find((option) => option.label === 'XXX')?.tier
    ).toBe('xxx');
  });
});
