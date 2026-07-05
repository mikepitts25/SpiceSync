import {
  computeActionBuckets,
  explainMatch,
  type ActionKink,
} from '../lib/match/actionBuckets';
import { getKinkGuidance } from '../lib/kinks/guidance';

const kinks: ActionKink[] = [
  {
    id: 'pair:massage',
    title: 'Massage',
    category: 'Touch',
    intensityScale: 2,
    tier: 'naughty',
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
    id: 'authored',
    title: 'Authored activity',
    category: 'Basics',
    intensityScale: 1,
    tier: 'soft',
    tags: [],
    riskLevel: 'low',
    prep: ['Authored prep step.'],
    safetyNotes: ['Authored safety note.'],
    aftercare: ['Authored aftercare step.'],
    consentPrompts: ['Authored consent prompt?'],
  },
];

function firstItem(mine: Record<string, any>, theirs: Record<string, any>) {
  const buckets = computeActionBuckets({ kinks, mine, theirs });
  return [
    ...buckets.readyNow,
    ...buckets.curiousTogether,
    ...buckets.needsConversation,
  ][0];
}

describe('explainMatch', () => {
  it('explains a mutual yes with role compatibility and checklists', () => {
    const item = firstItem(
      { 'pair:massage': { value: 'yes', pairPreference: 'give' } },
      { 'pair:massage': { value: 'yes', pairPreference: 'receive' } }
    );
    const explanation = explainMatch(item, kinks[0]);

    expect(explanation.headline).toBe(
      'You both said yes — ready when you are.'
    );
    expect(explanation.roleNote).toBe('You chose Give; partner chose Receive.');
    expect(explanation.intensityRiskNote).toContain('Intensity level 2 of 3');
    expect(explanation.conversationStarter.length).toBeGreaterThan(0);
    expect(explanation.prep.length).toBeGreaterThan(0);
    expect(explanation.aftercare.length).toBeGreaterThan(0);
  });

  it('explains a timing mismatch without pressure', () => {
    const item = firstItem(
      { 'pair:massage': { value: 'no', readiness: 'not_now' } },
      { 'pair:massage': 'yes' }
    );
    const explanation = explainMatch(item, kinks[0]);

    expect(explanation.headline).toContain('You said not right now');
    expect(explanation.headline).toContain('no-pressure');
  });

  it('flags high-risk matches with prep guidance', () => {
    const item = firstItem({ risky: 'yes' }, { risky: 'yes' });
    const explanation = explainMatch(item, kinks[1]);

    expect(item.reasons).toContain('risk_prep');
    expect(explanation.headline).toContain('prep and safety');
    expect(explanation.intensityRiskNote).toContain('Higher risk');
    expect(explanation.safetyNotes.some((note) => note.includes('risk'))).toBe(
      true
    );
  });

  it('prefers authored metadata over derived defaults', () => {
    const item = firstItem({ authored: 'yes' }, { authored: 'yes' });
    const explanation = explainMatch(item, kinks[2]);

    expect(explanation.prep).toEqual(['Authored prep step.']);
    expect(explanation.safetyNotes).toEqual(['Authored safety note.']);
    expect(explanation.aftercare).toEqual(['Authored aftercare step.']);
    expect(explanation.conversationStarter).toBe('Authored consent prompt?');
  });
});

describe('getKinkGuidance defaults', () => {
  it('derives risk from tags, tier, and intensity', () => {
    expect(
      getKinkGuidance({ id: 'a', title: 'A', tags: ['impact'] }).riskLevel
    ).toBe('high');
    expect(
      getKinkGuidance({ id: 'b', title: 'B', tier: 'xxx', tags: [] }).riskLevel
    ).toBe('high');
    expect(
      getKinkGuidance({
        id: 'c',
        title: 'C',
        tier: 'naughty',
        tags: [],
        intensityScale: 1,
      }).riskLevel
    ).toBe('medium');
    expect(
      getKinkGuidance({
        id: 'd',
        title: 'D',
        tier: 'soft',
        tags: ['intimacy'],
        intensityScale: 1,
      }).riskLevel
    ).toBe('low');
  });

  it('escalates trust and experience with risk', () => {
    const high = getKinkGuidance({ id: 'a', title: 'A', tags: ['breathplay'] });
    expect(high.trustLevel).toBe('deep');
    expect(high.experienceLevel).toBe('advanced');

    const low = getKinkGuidance({
      id: 'b',
      title: 'B',
      tier: 'soft',
      tags: [],
      intensityScale: 1,
    });
    expect(low.trustLevel).toBe('any');
    expect(low.experienceLevel).toBe('beginner');
  });

  it('always provides consent-forward defaults', () => {
    const guidance = getKinkGuidance({
      id: 'a',
      title: 'Anything',
      tags: [],
      intensityScale: 1,
      tier: 'soft',
    });
    expect(guidance.prep.length).toBeGreaterThan(0);
    expect(guidance.safetyNotes.length).toBeGreaterThan(0);
    expect(guidance.aftercare.length).toBeGreaterThan(0);
    expect(guidance.consentPrompts.length).toBeGreaterThan(0);
  });
});
