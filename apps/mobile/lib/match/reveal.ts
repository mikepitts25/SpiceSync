export type RevealVoteValue = 'yes' | 'maybe' | 'no';

export type RevealKink = {
  id: string;
  slug?: string;
  title: string;
  category?: string;
};

export type RevealMatchItem = {
  id: string;
  title: string;
  category: string;
};

export type RevealBuckets = {
  mutualYes: RevealMatchItem[];
  partialYesMaybe: RevealMatchItem[];
  mutualMaybe: RevealMatchItem[];
};

type ComputeRevealBucketsInput = {
  kinks: RevealKink[];
  mine: Record<string, RevealVoteValue | undefined>;
  theirs: Record<string, RevealVoteValue | undefined>;
};

const getComplementarySlug = (slug?: string): string | null => {
  if (!slug) return null;
  if (slug.endsWith('-give')) {
    return `${slug.slice(0, -5)}-receive`;
  }
  if (slug.endsWith('-receive')) {
    return `${slug.slice(0, -8)}-give`;
  }
  return null;
};

const sortRows = <T extends RevealMatchItem>(rows: T[]): T[] =>
  rows.sort((a, b) =>
    a.category === b.category
      ? a.title.localeCompare(b.title)
      : a.category.localeCompare(b.category)
  );

export function computeRevealBuckets({
  kinks,
  mine,
  theirs,
}: ComputeRevealBucketsInput): RevealBuckets {
  const kinksById = Object.fromEntries(kinks.map((kink) => [kink.id, kink]));
  const kinksBySlug = Object.fromEntries(
    kinks
      .filter((kink) => typeof kink.slug === 'string' && kink.slug.length > 0)
      .map((kink) => [kink.slug as string, kink])
  );

  const mutualYes: RevealMatchItem[] = [];
  const partialYesMaybe: RevealMatchItem[] = [];
  const mutualMaybe: RevealMatchItem[] = [];
  const comparedPairs = new Set<string>();

  const addMatchedPair = (mineKinkId: string, theirKinkId: string) => {
    const pairKey = `${mineKinkId}::${theirKinkId}`;
    if (comparedPairs.has(pairKey)) return;
    comparedPairs.add(pairKey);

    const myVote = mine[mineKinkId];
    const theirVote = theirs[theirKinkId];
    if (!myVote || !theirVote) return;
    if (myVote === 'no' || theirVote === 'no') return;

    const myKink = kinksById[mineKinkId];
    const theirKink = kinksById[theirKinkId];
    const item = {
      id: mineKinkId,
      title: myKink?.title ?? theirKink?.title ?? mineKinkId,
      category: myKink?.category ?? theirKink?.category ?? 'Activity',
    };

    if (myVote === 'yes' && theirVote === 'yes') {
      mutualYes.push(item);
      return;
    }

    if (myVote === 'maybe' && theirVote === 'maybe') {
      mutualMaybe.push(item);
      return;
    }

    partialYesMaybe.push(item);
  };

  Object.keys(mine).forEach((id) => {
    if (theirs[id] !== undefined) {
      addMatchedPair(id, id);
    }
  });

  Object.keys(mine).forEach((mineKinkId) => {
    const myKink = kinksById[mineKinkId];
    const complementarySlug = getComplementarySlug(myKink?.slug);
    if (!complementarySlug) return;

    const theirKink = kinksBySlug[complementarySlug];
    if (!theirKink || theirs[theirKink.id] === undefined) return;

    addMatchedPair(mineKinkId, theirKink.id);
  });

  return {
    mutualYes: sortRows(mutualYes),
    partialYesMaybe: sortRows(partialYesMaybe),
    mutualMaybe: sortRows(mutualMaybe),
  };
}
