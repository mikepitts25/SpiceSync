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
import { interpolate } from '../i18n';
import { en } from '../i18n/en';
import { es } from '../i18n/es';
import { getCounterpartIds } from './counterpartMatches';
import {
  getKinkGuidance,
  type GuidanceLanguage,
  type GuidanceSource,
} from '../kinks/guidance';
import { describeRoleCompatibility } from './experience';

const TABLE = { en, es };

function copyFor(language: GuidanceLanguage) {
  return TABLE[language].matchExplanation;
}

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

function readinessLabel(
  readiness: Readiness,
  t: ReturnType<typeof copyFor>
): string {
  switch (readiness) {
    case 'yes':
      return t.readinessYes;
    case 'curious':
      return t.readinessCurious;
    case 'not_now':
      return t.readinessNotNow;
    case 'hard_no':
      return t.readinessHardNo;
  }
}

function headlineFor(
  item: ActionMatchItem,
  language: GuidanceLanguage
): string {
  const t = copyFor(language);
  if (item.reasons.includes('hard_no')) {
    return t.headlineHardNo;
  }
  if (item.reasons.includes('timing')) {
    return item.myReadiness === 'not_now'
      ? t.headlineNotNowMe
      : t.headlineNotNowPartner;
  }
  if (item.reasons.includes('roles')) {
    return t.headlineRoles;
  }
  if (item.reasons.includes('risk_prep')) {
    return t.headlineRiskPrep;
  }
  if (item.myReadiness === 'yes' && item.partnerReadiness === 'yes') {
    return t.headlineMutualYes;
  }
  if (item.myReadiness === 'curious' && item.partnerReadiness === 'curious') {
    return t.headlineMutualCurious;
  }
  return interpolate(t.headlineTalkAbout, {
    mine: readinessLabel(item.myReadiness, t),
    partner: readinessLabel(item.partnerReadiness, t),
  });
}

function intensityRiskNote(
  item: ActionMatchItem,
  language: GuidanceLanguage
): string {
  const t = copyFor(language);
  const intensity = item.intensityScale
    ? interpolate(t.intensityLevel, { level: item.intensityScale })
    : t.intensityNotSet;
  if (item.riskLevel === 'high') {
    return interpolate(t.riskHigh, { intensity });
  }
  if (item.riskLevel === 'medium') {
    return interpolate(t.riskMedium, { intensity });
  }
  return interpolate(t.riskLow, { intensity });
}

export function explainMatch(
  item: ActionMatchItem,
  kink?: ActionKink,
  language: GuidanceLanguage = 'en'
): MatchExplanation {
  const t = copyFor(language);
  const guidance = getKinkGuidance(
    kink ?? {
      id: item.id,
      title: item.title,
      category: item.category,
      tags: item.tags,
      intensityScale: item.intensityScale,
      tier: item.tier,
      riskLevel: item.riskLevel,
    },
    language
  );

  return {
    headline: headlineFor(item, language),
    roleNote: describeRoleCompatibility(item, language),
    intensityRiskNote: intensityRiskNote(item, language),
    conversationStarter:
      guidance.consentPrompts[0] ??
      interpolate(t.conversationStarterFallback, { title: item.title }),
    prep: guidance.prep,
    safetyNotes: guidance.safetyNotes,
    aftercare: guidance.aftercare,
    consentPrompts: guidance.consentPrompts,
  };
}
