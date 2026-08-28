import {
  buildMyVotesView,
  type MyVoteListItem,
} from '../lib/votes/myVotesView';

const ITEMS: MyVoteListItem[] = [
  {
    kink: { id: 'not-now', title: 'Candlelight', intensityScale: 2 },
    vote: 'no',
    readiness: 'not_now',
  },
  {
    kink: { id: 'yes', title: 'Aftercare', intensityScale: 3 },
    vote: 'yes',
    readiness: 'yes',
  },
  {
    kink: { id: 'curious', title: 'Blindfold', intensityScale: 1 },
    vote: 'maybe',
  },
  {
    kink: { id: 'hard-no', title: 'Denial', intensityScale: 3 },
    vote: 'no',
    readiness: 'hard_no',
  },
  {
    kink: { id: 'legacy-no', title: 'Legacy decline', intensityScale: 2 },
    vote: 'no',
  },
  {
    kink: { id: 'unknown-intensity', title: 'Unrated intensity' },
    vote: 'maybe',
    readiness: 'curious',
  },
];

const ids = (items: MyVoteListItem[]) => items.map(({ kink }) => kink.id);

describe('buildMyVotesView', () => {
  it.each([
    [
      'all',
      [
        'not-now',
        'yes',
        'curious',
        'hard-no',
        'legacy-no',
        'unknown-intensity',
      ],
    ],
    ['yes', ['yes']],
    ['curious', ['curious', 'unknown-intensity']],
    ['not_now', ['not-now']],
    ['hard_no', ['hard-no']],
    ['legacy_no', ['legacy-no']],
  ] as const)(
    'keeps only %s votes when that filter is active',
    (filter, expected) => {
      const result = buildMyVotesView(ITEMS, filter, 'default');

      expect(ids(result.items)).toEqual(expected);
    }
  );

  it('counts each readiness without grouping not-now into hard-no', () => {
    const result = buildMyVotesView(ITEMS, 'all', 'default');

    expect(result.counts).toEqual({
      all: 6,
      yes: 1,
      curious: 2,
      not_now: 1,
      hard_no: 1,
      legacy_no: 1,
    });
  });

  it('sorts titles alphabetically without changing the source array', () => {
    const sourceOrder = ids(ITEMS);

    const result = buildMyVotesView(ITEMS, 'all', 'title');

    expect(ids(result.items)).toEqual([
      'yes',
      'curious',
      'not-now',
      'hard-no',
      'legacy-no',
      'unknown-intensity',
    ]);
    expect(ids(ITEMS)).toEqual(sourceOrder);
  });

  it('sorts intensity low to high and leaves missing intensity last', () => {
    const result = buildMyVotesView(ITEMS, 'all', 'intensity_asc');

    expect(ids(result.items)).toEqual([
      'curious',
      'not-now',
      'legacy-no',
      'yes',
      'hard-no',
      'unknown-intensity',
    ]);
  });
});
