import {
  computeRevealBuckets,
  type RevealKink,
} from '../lib/match/reveal';

const kinks: RevealKink[] = [
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
    description: 'Trade a slow massage.',
    category: 'Touch',
    intensityScale: 2,
    tier: 'naughty',
    tags: ['sensual'],
    pairMode: true,
  },
  {
    id: 'service-submission',
    slug: 'service-submission',
    title: 'Service Submission',
    description: 'Providing attentive service.',
    category: 'Power Exchange',
    intensityScale: 2,
    tier: 'naughty',
    tags: ['service'],
    pairMode: true,
    matchesWith: ['service-topping'],
  },
  {
    id: 'service-topping',
    slug: 'service-topping',
    title: 'Service Topping',
    description: 'Guiding attentive service.',
    category: 'Power Exchange',
    intensityScale: 2,
    tier: 'naughty',
    tags: ['service'],
    pairMode: true,
    matchesWith: ['service-submission'],
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

  it('includes match detail metadata and paired role selections', () => {
    const buckets = computeRevealBuckets({
      kinks,
      mine: {
        'pair:massage': { value: 'yes', pairPreference: 'give' },
      },
      theirs: {
        'pair:massage': { value: 'yes', pairPreference: 'receive' },
      },
    });

    expect(buckets.mutualYes[0]).toMatchObject({
      id: 'pair:massage',
      title: 'Massage',
      description: 'Trade a slow massage.',
      category: 'Touch',
      intensityScale: 2,
      tier: 'naughty',
      tags: ['sensual'],
      pairMode: true,
      myVote: 'yes',
      partnerVote: 'yes',
      myPairPreference: 'give',
      partnerPairPreference: 'receive',
    });
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

  it('matches explicit counterpart cards with compatible role preferences', () => {
    const buckets = computeRevealBuckets({
      kinks,
      mine: {
        'service-submission': { value: 'yes', pairPreference: 'receive' },
      },
      theirs: {
        'service-topping': { value: 'yes', pairPreference: 'give' },
      },
    });

    expect(buckets.mutualYes).toHaveLength(1);
    expect(buckets.mutualYes[0]).toMatchObject({
      id: 'service-submission',
      title: 'Service Submission',
      matchedWithId: 'service-topping',
      matchedWithTitle: 'Service Topping',
      myVote: 'yes',
      partnerVote: 'yes',
      myPairPreference: 'receive',
      partnerPairPreference: 'give',
    });
  });

  it('does not match explicit counterpart cards with incompatible role preferences', () => {
    const buckets = computeRevealBuckets({
      kinks,
      mine: {
        'service-submission': { value: 'yes', pairPreference: 'give' },
      },
      theirs: {
        'service-topping': { value: 'yes', pairPreference: 'give' },
      },
    });

    expect(buckets.mutualYes).toEqual([]);
  });
});
