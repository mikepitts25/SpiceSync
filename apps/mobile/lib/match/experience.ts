import type { Tier } from '../data';
import type { PairPreference, VoteValue } from '../votes/rolePreferences';
import { interpolate } from '../i18n';
import { en } from '../i18n/en';
import { es } from '../i18n/es';
import type { GuidanceLanguage } from '../kinks/guidance';

const TABLE = { en, es };

function copyFor(language: GuidanceLanguage) {
  return TABLE[language].matchExplanation;
}

export type MatchRoleFilter = 'all' | 'paired' | 'give' | 'receive' | 'both';
export type MatchVisibilityFilter = 'all' | 'unseen';

export type MatchExperienceItem = {
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
  myVote?: VoteValue;
  partnerVote?: VoteValue;
  myPairPreference?: PairPreference;
  partnerPairPreference?: PairPreference;
};

export type MatchPlanStep = {
  id: string;
  title: string;
  body: string;
};

export type MatchFilterState = {
  visibility?: MatchVisibilityFilter;
  category?: string;
  intensity?: number;
  role?: MatchRoleFilter;
  viewedIds?: Set<string>;
};

const roleLabel = (
  role: PairPreference,
  t: ReturnType<typeof copyFor>
): string =>
  role === 'give'
    ? t.roleGive
    : role === 'receive'
      ? t.roleReceive
      : t.roleBoth;

export function describeRoleCompatibility(
  item: MatchExperienceItem,
  language: GuidanceLanguage = 'en'
): string {
  const t = copyFor(language);
  if (!item.pairMode) return t.roleSharedInterest;

  const mine = item.myPairPreference ?? 'both';
  const partner = item.partnerPairPreference ?? 'both';
  const counterpart = item.matchedWithTitle
    ? interpolate(t.roleMatchedWith, { title: item.matchedWithTitle })
    : '';

  if (mine === 'both' && partner === 'both') {
    return interpolate(t.roleBothChoseBoth, { counterpart });
  }

  return interpolate(t.roleChoseEach, {
    mine: roleLabel(mine, t),
    partner: roleLabel(partner, t),
    counterpart,
  });
}

export function createMatchPlan(
  item: MatchExperienceItem,
  language: GuidanceLanguage = 'en'
): MatchPlanStep[] {
  const t = copyFor(language);
  const intensity = item.intensityScale
    ? interpolate(t.planStartIntensityLevel, { level: item.intensityScale })
    : t.planStartIntensityDefault;

  return [
    {
      id: 'boundaries',
      title: t.planBoundariesTitle,
      body: t.planBoundariesBody,
    },
    {
      id: 'prepare',
      title: t.planPrepareTitle,
      body: t.planPrepareBody,
    },
    {
      id: 'start',
      title: t.planStartTitle,
      body: interpolate(t.planStartBody, { title: item.title, intensity }),
    },
    {
      id: 'check-in',
      title: t.planCheckInTitle,
      body: t.planCheckInBody,
    },
    {
      id: 'aftercare',
      title: t.planAftercareTitle,
      body: t.planAftercareBody,
    },
  ];
}

function roleMatches(
  item: MatchExperienceItem,
  role: MatchRoleFilter
): boolean {
  if (role === 'all') return true;
  if (role === 'paired') return Boolean(item.pairMode);
  if (!item.pairMode) return false;

  const mine = item.myPairPreference ?? 'both';
  if (role === 'both') return mine === 'both';
  return mine === role || mine === 'both';
}

export function filterMatchItems<T extends MatchExperienceItem>(
  items: T[],
  filters: MatchFilterState = {}
): T[] {
  const visibility = filters.visibility ?? 'all';
  const role = filters.role ?? 'all';

  return items.filter((item) => {
    if (visibility === 'unseen' && filters.viewedIds?.has(item.id)) {
      return false;
    }

    if (filters.category && item.category !== filters.category) {
      return false;
    }

    if (filters.intensity && item.intensityScale !== filters.intensity) {
      return false;
    }

    return roleMatches(item, role);
  });
}
