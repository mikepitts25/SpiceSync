import {
  createMatchPlan,
  describeRoleCompatibility,
  filterMatchItems,
  type MatchExperienceItem,
} from '../lib/match/experience';

const baseMatch: MatchExperienceItem = {
  id: 'pair:massage',
  title: 'Massage',
  description: 'Take turns giving slow, intentional massage.',
  category: 'Touch',
  intensityScale: 2,
  tier: 'naughty',
  tags: ['sensual', 'aftercare'],
  pairMode: true,
  myVote: 'yes',
  partnerVote: 'yes',
  myPairPreference: 'give',
  partnerPairPreference: 'receive',
};

describe('match experience helpers', () => {
  it('explains paired role compatibility in partner-friendly copy', () => {
    expect(describeRoleCompatibility(baseMatch)).toBe(
      'You chose Give; partner chose Receive.'
    );
    expect(
      describeRoleCompatibility({
        ...baseMatch,
        myPairPreference: 'both',
        partnerPairPreference: 'both',
      })
    ).toBe('You both chose Both.');
    expect(
      describeRoleCompatibility({
        ...baseMatch,
        pairMode: false,
        myPairPreference: undefined,
        partnerPairPreference: undefined,
      })
    ).toBe('Shared interest.');
  });

  it('explains when a partner matched through a counterpart card', () => {
    expect(
      describeRoleCompatibility({
        ...baseMatch,
        title: 'Service Submission',
        matchedWithId: 'service-topping',
        matchedWithTitle: 'Service Topping',
        myPairPreference: 'receive',
        partnerPairPreference: 'give',
      })
    ).toBe(
      'You chose Receive; partner chose Give. Partner matched with Service Topping.'
    );
  });

  it('creates a compact try-tonight plan for a match', () => {
    const plan = createMatchPlan(baseMatch);

    expect(plan.map((step) => step.title)).toEqual([
      'Set boundaries',
      'Prepare the space',
      'Start the match',
      'Check in',
      'Aftercare',
    ]);
    expect(plan[2].body).toContain('Massage');
    expect(plan[2].body).toContain('level 2');
  });

  it('filters matches by unseen state, category, intensity, and paired role', () => {
    const items: MatchExperienceItem[] = [
      baseMatch,
      {
        ...baseMatch,
        id: 'blindfolds',
        title: 'Blindfolds',
        category: 'Sensory',
        intensityScale: 1,
        pairMode: false,
        myPairPreference: undefined,
        partnerPairPreference: undefined,
      },
      {
        ...baseMatch,
        id: 'pair:oral',
        title: 'Oral Play',
        category: 'Oral',
        intensityScale: 3,
        myPairPreference: 'both',
        partnerPairPreference: 'both',
      },
    ];

    expect(
      filterMatchItems(items, {
        visibility: 'unseen',
        viewedIds: new Set(['blindfolds']),
      }).map((item) => item.id)
    ).toEqual(['pair:massage', 'pair:oral']);

    expect(
      filterMatchItems(items, { category: 'Sensory' }).map((item) => item.id)
    ).toEqual(['blindfolds']);

    expect(
      filterMatchItems(items, { intensity: 3 }).map((item) => item.id)
    ).toEqual(['pair:oral']);

    expect(
      filterMatchItems(items, { role: 'give' }).map((item) => item.id)
    ).toEqual(['pair:massage', 'pair:oral']);

    expect(
      filterMatchItems(items, { role: 'paired' }).map((item) => item.id)
    ).toEqual(['pair:massage', 'pair:oral']);
  });
});
