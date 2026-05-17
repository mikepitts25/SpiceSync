import { computeRevealBuckets } from '../lib/match/reveal';

const kinks = [
  {
    id: 'same-yes',
    slug: 'same-yes',
    title: 'Same yes',
    category: 'Basics',
  },
  {
    id: 'partial',
    slug: 'partial',
    title: 'Partial',
    category: 'Basics',
  },
  {
    id: 'same-maybe',
    slug: 'same-maybe',
    title: 'Same maybe',
    category: 'Basics',
  },
  {
    id: 'yes-no',
    slug: 'yes-no',
    title: 'Yes no',
    category: 'Hidden',
  },
  {
    id: 'no-no',
    slug: 'no-no',
    title: 'No no',
    category: 'Hidden',
  },
  {
    id: 'massage-give',
    slug: 'massage-give',
    title: 'Give massage',
    category: 'Touch',
  },
  {
    id: 'massage-receive',
    slug: 'massage-receive',
    title: 'Receive massage',
    category: 'Touch',
  },
];

describe('computeRevealBuckets', () => {
  it('reveals yes/yes by default and gates yes/maybe and maybe/maybe', () => {
    const buckets = computeRevealBuckets({
      kinks,
      mine: {
        'same-yes': 'yes',
        partial: 'yes',
        'same-maybe': 'maybe',
      },
      theirs: {
        'same-yes': 'yes',
        partial: 'maybe',
        'same-maybe': 'maybe',
      },
    });

    expect(buckets.mutualYes.map((item) => item.id)).toEqual(['same-yes']);
    expect(buckets.partialYesMaybe.map((item) => item.id)).toEqual(['partial']);
    expect(buckets.mutualMaybe.map((item) => item.id)).toEqual(['same-maybe']);
  });

  it('never returns yes/no or no/no combinations', () => {
    const buckets = computeRevealBuckets({
      kinks,
      mine: {
        'yes-no': 'yes',
        'no-no': 'no',
      },
      theirs: {
        'yes-no': 'no',
        'no-no': 'no',
      },
    });

    expect(buckets.mutualYes).toEqual([]);
    expect(buckets.partialYesMaybe).toEqual([]);
    expect(buckets.mutualMaybe).toEqual([]);
  });

  it('matches complementary give and receive slugs without duplicating rows', () => {
    const buckets = computeRevealBuckets({
      kinks,
      mine: {
        'massage-give': 'yes',
      },
      theirs: {
        'massage-receive': 'yes',
      },
    });

    expect(buckets.mutualYes.map((item) => item.id)).toEqual(['massage-give']);
  });
});
