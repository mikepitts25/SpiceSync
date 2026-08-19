import type { Readiness, VoteValue } from './rolePreferences';
import { voteToReadiness } from './rolePreferences';

export type MyVotesFilter =
  | 'all'
  | 'yes'
  | 'curious'
  | 'not_now'
  | 'hard_no'
  | 'legacy_no';

export type MyVotesSort =
  | 'default'
  | 'title'
  | 'intensity_asc'
  | 'intensity_desc';

export type MyVoteListItem = {
  kink: {
    id: string;
    title: string;
    intensityScale?: number;
  };
  vote: VoteValue;
  readiness?: Readiness;
};

export type MyVotesFilterCounts = Record<MyVotesFilter, number>;

function itemFilter(item: MyVoteListItem): Exclude<MyVotesFilter, 'all'> {
  const readiness = item.readiness ?? voteToReadiness(item.vote);
  return readiness ?? 'legacy_no';
}

function compareTitles(a: MyVoteListItem, b: MyVoteListItem): number {
  return a.kink.title.localeCompare(b.kink.title);
}

function compareIntensity(
  a: MyVoteListItem,
  b: MyVoteListItem,
  direction: 1 | -1
): number {
  const aIntensity = a.kink.intensityScale;
  const bIntensity = b.kink.intensityScale;
  if (aIntensity === undefined)
    return bIntensity === undefined ? compareTitles(a, b) : 1;
  if (bIntensity === undefined) return -1;
  return (aIntensity - bIntensity) * direction || compareTitles(a, b);
}

export function buildMyVotesView<T extends MyVoteListItem>(
  items: readonly T[],
  filter: MyVotesFilter,
  sort: MyVotesSort
): { items: T[]; counts: MyVotesFilterCounts } {
  const counts: MyVotesFilterCounts = {
    all: items.length,
    yes: 0,
    curious: 0,
    not_now: 0,
    hard_no: 0,
    legacy_no: 0,
  };

  for (const item of items) {
    counts[itemFilter(item)] += 1;
  }

  const visible =
    filter === 'all'
      ? [...items]
      : items.filter((item) => itemFilter(item) === filter);

  if (sort === 'title') {
    visible.sort(compareTitles);
  } else if (sort === 'intensity_asc') {
    visible.sort((a, b) => compareIntensity(a, b, 1));
  } else if (sort === 'intensity_desc') {
    visible.sort((a, b) => compareIntensity(a, b, -1));
  }

  return {
    items: visible,
    counts,
  };
}
