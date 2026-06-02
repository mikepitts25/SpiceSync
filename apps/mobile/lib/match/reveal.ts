import {
  KinkVote,
  normalizeVoteRecord,
  type PairPreference,
  preferencesCompatible,
  type VoteValue,
} from '../votes/rolePreferences';
import type { Tier } from '../data';

export type RevealVoteValue = 'yes' | 'maybe' | 'no';

export type RevealKink = {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  category?: string;
  intensityScale?: number;
  tier?: Tier;
  tags?: string[];
  pairMode?: boolean;
};

export type RevealMatchItem = {
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

export type RevealBuckets = {
  mutualYes: RevealMatchItem[];
  partialYesMaybe: RevealMatchItem[];
  mutualMaybe: RevealMatchItem[];
};

type ComputeRevealBucketsInput = {
  kinks: RevealKink[];
  mine: Record<string, KinkVote | undefined>;
  theirs: Record<string, KinkVote | undefined>;
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

  const mutualYes: RevealMatchItem[] = [];
  const partialYesMaybe: RevealMatchItem[] = [];
  const mutualMaybe: RevealMatchItem[] = [];
  const comparedPairs = new Set<string>();

  const addMatchedPair = (mineKinkId: string, theirKinkId: string) => {
    const pairKey = `${mineKinkId}::${theirKinkId}`;
    if (comparedPairs.has(pairKey)) return;
    comparedPairs.add(pairKey);

    const myVoteRecord = normalizeVoteRecord(mine[mineKinkId]);
    const theirVoteRecord = normalizeVoteRecord(theirs[theirKinkId]);
    const myVote = myVoteRecord?.value;
    const theirVote = theirVoteRecord?.value;
    if (!myVote || !theirVote) return;
    if (myVote === 'no' || theirVote === 'no') return;

    const myKink = kinksById[mineKinkId];
    const theirKink = kinksById[theirKinkId];
    if (
      (myKink?.pairMode || theirKink?.pairMode) &&
      !preferencesCompatible(
        myVoteRecord?.pairPreference,
        theirVoteRecord?.pairPreference
      )
    ) {
      return;
    }

    const item = {
      id: mineKinkId,
      title: myKink?.title ?? theirKink?.title ?? mineKinkId,
      description: myKink?.description ?? theirKink?.description,
      category: myKink?.category ?? theirKink?.category ?? 'Activity',
      intensityScale: myKink?.intensityScale ?? theirKink?.intensityScale,
      tier: myKink?.tier ?? theirKink?.tier,
      tags: myKink?.tags ?? theirKink?.tags ?? [],
      pairMode: Boolean(myKink?.pairMode || theirKink?.pairMode),
      myVote,
      partnerVote: theirVote,
      myPairPreference: myVoteRecord?.pairPreference,
      partnerPairPreference: theirVoteRecord?.pairPreference,
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

  return {
    mutualYes: sortRows(mutualYes),
    partialYesMaybe: sortRows(partialYesMaybe),
    mutualMaybe: sortRows(mutualMaybe),
  };
}
