
// apps/mobile/lib/match/compute.ts
export type VoteValue = 'yes' | 'no' | 'maybe' | undefined;

export type Kink = {
  id: string;
  title: string;
  description?: string;
  tier?: string;
  intensityScale?: number;
};

export type Buckets = {
  mutualYes: Kink[];
  partial: Kink[];       // any (yes + maybe) in either direction
  mutualMaybe: Kink[];   // maybe + maybe
};

export function computeMatchBuckets(
  userA: string,
  userB: string,
  kinks: Kink[],
  getVotesFor: (userId: string) => Record<string, VoteValue>
): Buckets {
  const aVotes = getVotesFor(userA) || {};
  const bVotes = getVotesFor(userB) || {};
  const byId = Object.fromEntries(kinks.map(k => [k.id, k]));

  const mutualYes: Kink[] = [];
  const partial: Kink[] = [];
  const mutualMaybe: Kink[] = [];

  for (const k of kinks) {
    const va = aVotes[k.id];
    const vb = bVotes[k.id];

    if (va === 'yes' && vb === 'yes') {
      mutualYes.push(byId[k.id]);
    } else if ((va === 'yes' && vb === 'maybe') || (va === 'maybe' && vb === 'yes')) {
      partial.push(byId[k.id]);
    } else if (va === 'maybe' && vb === 'maybe') {
      mutualMaybe.push(byId[k.id]);
    }
  }

  const byTitle = (a: Kink, b: Kink) => a.title.localeCompare(b.title);
  mutualYes.sort(byTitle);
  partial.sort(byTitle);
  mutualMaybe.sort(byTitle);

  return { mutualYes, partial, mutualMaybe };
}
