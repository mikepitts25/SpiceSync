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
    id: 'pair:massage',
    slug: 'massage',
    title: 'Massage',
    category: 'Touch',
    pairMode: true,
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

  it('matches compatible paired role preferences', () => {
    const buckets = computeRevealBuckets({
      kinks,
      mine: {
        'pair:massage': { value: 'yes', pairPreference: 'give' },
      },
      theirs: {
        'pair:massage': { value: 'yes', pairPreference: 'receive' },
      },
    });

    expect(buckets.mutualYes.map((item) => item.id)).toEqual(['pair:massage']);
  });

  it('matches both with both on paired role preferences', () => {
    const buckets = computeRevealBuckets({
      kinks,
      mine: {
        'pair:massage': { value: 'yes', pairPreference: 'both' },
      },
      theirs: {
        'pair:massage': { value: 'yes', pairPreference: 'both' },
      },
    });

    expect(buckets.mutualYes.map((item) => item.id)).toEqual(['pair:massage']);
  });

  it('does not match same one-sided paired role preferences', () => {
    const buckets = computeRevealBuckets({
      kinks,
      mine: {
        'pair:massage': { value: 'yes', pairPreference: 'give' },
      },
      theirs: {
        'pair:massage': { value: 'yes', pairPreference: 'give' },
      },
    });

    expect(buckets.mutualYes).toEqual([]);
  });
});
