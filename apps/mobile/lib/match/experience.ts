import type { Tier } from '../data';
import type { PairPreference, VoteValue } from '../votes/rolePreferences';

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

const roleLabel = (role: PairPreference): string =>
  role === 'give' ? 'Give' : role === 'receive' ? 'Receive' : 'Both';

export function describeRoleCompatibility(item: MatchExperienceItem): string {
  if (!item.pairMode) return 'Shared interest.';

  const mine = item.myPairPreference ?? 'both';
  const partner = item.partnerPairPreference ?? 'both';

  if (mine === 'both' && partner === 'both') {
    return 'You both chose Both.';
  }

  return `You chose ${roleLabel(mine)}; partner chose ${roleLabel(partner)}.`;
}

export function createMatchPlan(item: MatchExperienceItem): MatchPlanStep[] {
  const intensity = item.intensityScale
    ? `level ${item.intensityScale}`
    : 'your agreed level';

  return [
    {
      id: 'boundaries',
      title: 'Set boundaries',
      body: 'Name hard limits, soft limits, safewords, and what either of you can pause or skip.',
    },
    {
      id: 'prepare',
      title: 'Prepare the space',
      body: 'Gather anything needed, remove distractions, and agree on privacy before starting.',
    },
    {
      id: 'start',
      title: 'Start the match',
      body: `Try ${item.title} at ${intensity}. Start slower than you think you need and build only with clear consent.`,
    },
    {
      id: 'check-in',
      title: 'Check in',
      body: 'Pause after a few minutes and ask what feels good, what should change, and whether to continue.',
    },
    {
      id: 'aftercare',
      title: 'Aftercare',
      body: 'End with water, closeness, reassurance, cleanup, or quiet time based on what you both need.',
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
