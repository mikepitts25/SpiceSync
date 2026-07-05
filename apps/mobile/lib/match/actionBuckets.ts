// Actionable match buckets built on the readiness vote model.
//
// Buckets:
//   readyNow          — both clearly yes, compatible roles, no risk flags
//   curiousTogether   — mutual curiosity, or one yes + one curious
//   needsConversation — someone said "not now", roles clash, or the activity
//                       is higher-risk and deserves prep talk first
//   hidden            — anything involving a hard no (or a legacy plain "no").
//                       Never itemised unless the caller explicitly opts in;
//                       by default only a count is exposed.
//
// Legacy votes without a readiness refinement map conservatively:
// yes → yes, maybe → curious, no → private (hidden), so nothing a partner
// declined under the old model is ever surfaced as discussable.
import {
  effectiveReadiness,
  normalizeVoteRecord,
  preferencesCompatible,
  type KinkVote,
  type PairPreference,
  type Readiness,
  type VoteValue,
} from '../votes/rolePreferences';
import type { RiskLevel, Tier } from '../data';
import { getCounterpartIds } from './counterpartMatches';
import { getKinkGuidance, type GuidanceSource } from '../kinks/guidance';
import { describeRoleCompatibility } from './experience';

export type ActionKink = GuidanceSource & {
  slug?: string;
  description?: string;
  pairMode?: boolean;
  matchesWith?: string[];
};

export type MatchReasonCode =
  | 'mutual_yes'
  | 'mutual_curiosity'
  | 'timing'
  | 'roles'
  | 'risk_prep'
  | 'hard_no';

export type ActionMatchItem = {
  id: string;
  title: string;
  description?: string;
  category: string;
  intensityScale?: number;
  tier?: Tier;
  tags: string[];
  pairMode?: boolean;
  matchedWithId?: string;
  matchedWithTitle?: string;
  myVote: VoteValue;
  partnerVote: VoteValue;
  myPairPreference?: PairPreference;
  partnerPairPreference?: PairPreference;
  myReadiness: Readiness;
  partnerReadiness: Readiness;
  rolesCompatible: boolean;
  riskLevel: RiskLevel;
  reasons: MatchReasonCode[];
};

export type ActionBuckets = {
  readyNow: ActionMatchItem[];
  curiousTogether: ActionMatchItem[];
  needsConversation: ActionMatchItem[];
  // Count of comparisons suppressed because one side holds a hard no (or a
  // legacy plain "no"). Items are only listed when revealHidden is passed,
  // which the UI must gate behind an explicit user opt-in.
  hiddenCount: number;
  hidden: ActionMatchItem[];
};

type ComputeActionBucketsInput = {
  kinks: ActionKink[];
  mine: Record<string, KinkVote | undefined>;
  theirs: Record<string, KinkVote | undefined>;
  revealHidden?: boolean;
};

const POSITIVE: ReadonlySet<Readiness> = new Set(['yes', 'curious']);

const sortRows = (rows: ActionMatchItem[]): ActionMatchItem[] =>
  rows.sort((a, b) =>
    a.category === b.category
      ? a.title.localeCompare(b.title)
      : a.category.localeCompare(b.category)
  );

export function computeActionBuckets({
  kinks,
  mine,
  theirs,
  revealHidden = false,
}: ComputeActionBucketsInput): ActionBuckets {
  const kinksById = Object.fromEntries(kinks.map((kink) => [kink.id, kink]));

  const readyNow: ActionMatchItem[] = [];
  const curiousTogether: ActionMatchItem[] = [];
  const needsConversation: ActionMatchItem[] = [];
  const hidden: ActionMatchItem[] = [];
  let hiddenCount = 0;
  const comparedPairs = new Set<string>();

  const compare = (mineKinkId: string, theirKinkId: string) => {
    const pairKey = `${mineKinkId}::${theirKinkId}`;
    if (comparedPairs.has(pairKey)) return;
    comparedPairs.add(pairKey);

    const myRecord = normalizeVoteRecord(mine[mineKinkId]);
    const theirRecord = normalizeVoteRecord(theirs[theirKinkId]);
    if (!myRecord || !theirRecord) return;

    const myReadiness = effectiveReadiness(myRecord);
    const theirReadiness = effectiveReadiness(theirRecord);

    const myKink = kinksById[mineKinkId];
    const theirKink = kinksById[theirKinkId];
    // Votes can outlive catalog entries (e.g. an activity was removed in an
    // update). Never surface a ghost item whose title would be a raw id.
    if (!myKink && !theirKink) return;
    const source: ActionKink = myKink ?? theirKink!;

    // A hard no — or a legacy plain "no", which is treated as private — makes
    // the whole comparison hidden. It must never leak into other buckets.
    const myHidden = !myReadiness || myReadiness === 'hard_no';
    const theirHidden = !theirReadiness || theirReadiness === 'hard_no';
    if (myHidden || theirHidden) {
      hiddenCount += 1;
      if (revealHidden) {
        hidden.push(
          buildItem(source, theirKink, {
            mineKinkId,
            theirKinkId,
            myRecord,
            theirRecord,
            myReadiness: myReadiness ?? 'hard_no',
            theirReadiness: theirReadiness ?? 'hard_no',
            reasons: ['hard_no'],
            rolesCompatible: true,
          })
        );
      }
      return;
    }

    const rolesCompatible =
      !(myKink?.pairMode || theirKink?.pairMode) ||
      preferencesCompatible(
        myRecord.pairPreference,
        theirRecord.pairPreference
      );

    const reasons: MatchReasonCode[] = [];
    const guidance = getKinkGuidance(source);

    if (myReadiness === 'not_now' || theirReadiness === 'not_now') {
      reasons.push('timing');
    }
    if (!rolesCompatible) {
      reasons.push('roles');
    }
    if (
      POSITIVE.has(myReadiness) &&
      POSITIVE.has(theirReadiness) &&
      guidance.riskLevel === 'high'
    ) {
      reasons.push('risk_prep');
    }

    const item = buildItem(source, theirKink, {
      mineKinkId,
      theirKinkId,
      myRecord,
      theirRecord,
      myReadiness,
      theirReadiness,
      reasons,
      rolesCompatible,
      riskLevel: guidance.riskLevel,
    });

    if (reasons.length) {
      needsConversation.push(item);
      return;
    }

    if (myReadiness === 'yes' && theirReadiness === 'yes') {
      item.reasons = ['mutual_yes'];
      readyNow.push(item);
      return;
    }

    item.reasons = ['mutual_curiosity'];
    curiousTogether.push(item);
  };

  Object.keys(mine).forEach((id) => {
    if (theirs[id] !== undefined) {
      compare(id, id);
    }

    const kink = kinksById[id];
    for (const counterpartId of getCounterpartIds(id, kink?.matchesWith)) {
      if (theirs[counterpartId] !== undefined) {
        compare(id, counterpartId);
      }
    }
  });

  return {
    readyNow: sortRows(readyNow),
    curiousTogether: sortRows(curiousTogether),
    needsConversation: sortRows(needsConversation),
    hiddenCount,
    hidden: sortRows(hidden),
  };
}

function buildItem(
  source: ActionKink,
  theirKink: ActionKink | undefined,
  input: {
    mineKinkId: string;
    theirKinkId: string;
    myRecord: NonNullable<ReturnType<typeof normalizeVoteRecord>>;
    theirRecord: NonNullable<ReturnType<typeof normalizeVoteRecord>>;
    myReadiness: Readiness;
    theirReadiness: Readiness;
    reasons: MatchReasonCode[];
    rolesCompatible: boolean;
    riskLevel?: RiskLevel;
  }
): ActionMatchItem {
  const differentCards = input.mineKinkId !== input.theirKinkId;
  return {
    id: input.mineKinkId,
    title: source.title,
    description: source.description ?? theirKink?.description,
    category: source.category ?? theirKink?.category ?? 'Activity',
    intensityScale: source.intensityScale ?? theirKink?.intensityScale,
    tier: source.tier ?? theirKink?.tier,
    tags: source.tags ?? theirKink?.tags ?? [],
    pairMode: Boolean(source.pairMode || theirKink?.pairMode),
    matchedWithId: differentCards ? input.theirKinkId : undefined,
    matchedWithTitle: differentCards ? theirKink?.title : undefined,
    myVote: input.myRecord.value,
    partnerVote: input.theirRecord.value,
    myPairPreference: input.myRecord.pairPreference,
    partnerPairPreference: input.theirRecord.pairPreference,
    myReadiness: input.myReadiness,
    partnerReadiness: input.theirReadiness,
    rolesCompatible: input.rolesCompatible,
    riskLevel: input.riskLevel ?? getKinkGuidance(source).riskLevel,
    reasons: input.reasons,
  };
}

export type MatchExplanation = {
  headline: string;
  roleNote: string;
  intensityRiskNote: string;
  conversationStarter: string;
  prep: string[];
  safetyNotes: string[];
  aftercare: string[];
  consentPrompts: string[];
};

const READINESS_LABEL: Record<Readiness, string> = {
  yes: 'yes',
  curious: 'curious',
  not_now: 'not right now',
  hard_no: 'a hard no',
};

function headlineFor(item: ActionMatchItem): string {
  if (item.reasons.includes('hard_no')) {
    return 'This stays private unless you both choose otherwise.';
  }
  if (item.reasons.includes('timing')) {
    const who =
      item.myReadiness === 'not_now'
        ? 'You said not right now'
        : 'Your partner said not right now';
    return `${who} — a gentle, no-pressure conversation topic for later.`;
  }
  if (item.reasons.includes('roles')) {
    return 'You are both interested, but your role preferences need a conversation.';
  }
  if (item.reasons.includes('risk_prep')) {
    return 'You are both interested — review the prep and safety notes together before trying it.';
  }
  if (item.myReadiness === 'yes' && item.partnerReadiness === 'yes') {
    return 'You both said yes — ready when you are.';
  }
  if (item.myReadiness === 'curious' && item.partnerReadiness === 'curious') {
    return 'You are both curious — explore it together at your own pace.';
  }
  return `You said ${READINESS_LABEL[item.myReadiness]} and your partner said ${READINESS_LABEL[item.partnerReadiness]} — a good one to talk about.`;
}

function intensityRiskNote(item: ActionMatchItem): string {
  const intensity = item.intensityScale
    ? `Intensity level ${item.intensityScale} of 3.`
    : 'Intensity level not set.';
  if (item.riskLevel === 'high') {
    return `${intensity} Higher risk — plan prep, safety, and aftercare before starting.`;
  }
  if (item.riskLevel === 'medium') {
    return `${intensity} Moderate risk — agree on limits and a stop signal first.`;
  }
  return `${intensity} Lower risk — still check in with each other as you go.`;
}

export function explainMatch(
  item: ActionMatchItem,
  kink?: ActionKink
): MatchExplanation {
  const guidance = getKinkGuidance(
    kink ?? {
      id: item.id,
      title: item.title,
      category: item.category,
      tags: item.tags,
      intensityScale: item.intensityScale,
      tier: item.tier,
      riskLevel: item.riskLevel,
    }
  );

  return {
    headline: headlineFor(item),
    roleNote: describeRoleCompatibility(item),
    intensityRiskNote: intensityRiskNote(item),
    conversationStarter:
      guidance.consentPrompts[0] ??
      `What does a good version of "${item.title}" look like for each of you?`,
    prep: guidance.prep,
    safetyNotes: guidance.safetyNotes,
    aftercare: guidance.aftercare,
    consentPrompts: guidance.consentPrompts,
  };
}
