import {
  computeActionBuckets,
  type ActionKink,
} from '../lib/match/actionBuckets';

const kinks: ActionKink[] = [
  {
    id: 'gentle',
    title: 'Gentle activity',
    category: 'Basics',
    intensityScale: 1,
    tier: 'soft',
    tags: ['intimacy'],
  },
  {
    id: 'curious-card',
    title: 'Curious card',
    category: 'Basics',
    intensityScale: 1,
    tier: 'soft',
    tags: [],
  },
  {
    id: 'timing-card',
    title: 'Timing card',
    category: 'Basics',
    intensityScale: 1,
    tier: 'soft',
    tags: [],
  },
  {
    id: 'blocked-card',
    title: 'Blocked card',
    category: 'Basics',
    intensityScale: 1,
    tier: 'soft',
    tags: [],
  },
  {
    id: 'pair:massage',
    title: 'Massage',
    category: 'Touch',
    intensityScale: 1,
    tier: 'soft',
    tags: ['touch'],
    pairMode: true,
  },
  {
    id: 'risky',
    title: 'Risky activity',
    category: 'Edge',
    intensityScale: 3,
    tier: 'xxx',
    tags: ['impact'],
  },
  {
    id: 'explicit-risk',
    title: 'Explicitly risky',
    category: 'Edge',
    intensityScale: 1,
    tier: 'soft',
    tags: [],
    riskLevel: 'high',
  },
  {
    id: 'service-submission',
    title: 'Service Submission',
    category: 'Power Exchange',
    intensityScale: 1,
    tier: 'soft',
    tags: [],
    pairMode: true,
    matchesWith: ['service-topping'],
  },
  {
    id: 'service-topping',
    title: 'Service Topping',
    category: 'Power Exchange',
    intensityScale: 1,
    tier: 'soft',
    tags: [],
    pairMode: true,
    matchesWith: ['service-submission'],
  },
];

describe('computeActionBuckets', () => {
  it('puts mutual clear yes with compatible roles in readyNow', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: { gentle: 'yes' },
      theirs: { gentle: 'yes' },
    });

    expect(buckets.readyNow.map((item) => item.id)).toEqual(['gentle']);
    expect(buckets.readyNow[0].reasons).toEqual(['mutual_yes']);
    expect(buckets.curiousTogether).toEqual([]);
    expect(buckets.needsConversation).toEqual([]);
    expect(buckets.hiddenCount).toBe(0);
  });

  it('groups curious+curious and yes+curious in curiousTogether', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: {
        gentle: 'yes',
        'curious-card': { value: 'maybe', readiness: 'curious' },
      },
      theirs: {
        gentle: 'maybe',
        'curious-card': 'maybe',
      },
    });

    expect(buckets.curiousTogether.map((item) => item.id).sort()).toEqual([
      'curious-card',
      'gentle',
    ]);
    for (const item of buckets.curiousTogether) {
      expect(item.reasons).toEqual(['mutual_curiosity']);
    }
  });

  it('routes not_now into needsConversation with a timing reason', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: { 'timing-card': { value: 'no', readiness: 'not_now' } },
      theirs: { 'timing-card': 'yes' },
    });

    expect(buckets.needsConversation.map((item) => item.id)).toEqual([
      'timing-card',
    ]);
    expect(buckets.needsConversation[0].reasons).toContain('timing');
    expect(buckets.hiddenCount).toBe(0);
  });

  it('routes role clashes on paired cards into needsConversation', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: { 'pair:massage': { value: 'yes', pairPreference: 'give' } },
      theirs: { 'pair:massage': { value: 'yes', pairPreference: 'give' } },
    });

    expect(buckets.readyNow).toEqual([]);
    expect(buckets.needsConversation.map((item) => item.id)).toEqual([
      'pair:massage',
    ]);
    expect(buckets.needsConversation[0].reasons).toContain('roles');
    expect(buckets.needsConversation[0].rolesCompatible).toBe(false);
  });

  it('keeps compatible paired roles in readyNow', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: { 'pair:massage': { value: 'yes', pairPreference: 'give' } },
      theirs: { 'pair:massage': { value: 'yes', pairPreference: 'receive' } },
    });

    expect(buckets.readyNow.map((item) => item.id)).toEqual(['pair:massage']);
  });

  it('routes high-risk mutual yes into needsConversation for prep', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: { risky: 'yes', 'explicit-risk': 'yes' },
      theirs: { risky: 'yes', 'explicit-risk': 'yes' },
    });

    expect(buckets.readyNow).toEqual([]);
    expect(buckets.needsConversation.map((item) => item.id).sort()).toEqual([
      'explicit-risk',
      'risky',
    ]);
    for (const item of buckets.needsConversation) {
      expect(item.reasons).toContain('risk_prep');
      expect(item.riskLevel).toBe('high');
    }
  });

  it('matches counterpart cards with compatible roles', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: {
        'service-submission': { value: 'yes', pairPreference: 'receive' },
      },
      theirs: {
        'service-topping': { value: 'yes', pairPreference: 'give' },
      },
    });

    expect(buckets.readyNow).toHaveLength(1);
    expect(buckets.readyNow[0]).toMatchObject({
      id: 'service-submission',
      matchedWithId: 'service-topping',
      matchedWithTitle: 'Service Topping',
    });
  });
});

describe('hard-no privacy', () => {
  it('never reveals items involving a hard no or legacy plain no', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: {
        'blocked-card': 'yes',
        'timing-card': { value: 'no', readiness: 'hard_no' },
      },
      theirs: {
        'blocked-card': 'no',
        'timing-card': 'yes',
      },
    });

    expect(buckets.readyNow).toEqual([]);
    expect(buckets.curiousTogether).toEqual([]);
    expect(buckets.needsConversation).toEqual([]);
    expect(buckets.hidden).toEqual([]);
    expect(buckets.hiddenCount).toBe(2);
  });

  it('a legacy plain no is never surfaced as not_now', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: { 'blocked-card': 'no' },
      theirs: { 'blocked-card': 'yes' },
    });

    expect(buckets.needsConversation).toEqual([]);
    expect(buckets.hiddenCount).toBe(1);
  });

  it('lists hidden items only with the explicit revealHidden opt-in', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: { 'blocked-card': { value: 'no', readiness: 'hard_no' } },
      theirs: { 'blocked-card': 'yes' },
      revealHidden: true,
    });

    expect(buckets.hidden.map((item) => item.id)).toEqual(['blocked-card']);
    expect(buckets.hidden[0].reasons).toEqual(['hard_no']);
    expect(buckets.hiddenCount).toBe(1);
  });

  it('never surfaces ghost items for votes on removed catalog entries', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: { 'removed-card': 'yes' },
      theirs: { 'removed-card': 'yes' },
    });

    expect(buckets.readyNow).toEqual([]);
    expect(buckets.curiousTogether).toEqual([]);
    expect(buckets.needsConversation).toEqual([]);
    expect(buckets.hiddenCount).toBe(0);
  });

  it('ignores kinks where only one side voted', () => {
    const buckets = computeActionBuckets({
      kinks,
      mine: { gentle: 'yes' },
      theirs: {},
    });

    expect(buckets.readyNow).toEqual([]);
    expect(buckets.hiddenCount).toBe(0);
  });
});
