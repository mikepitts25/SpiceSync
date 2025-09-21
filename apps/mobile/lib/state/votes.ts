// apps/mobile/lib/state/votes.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../storage/mmkv';

export type VoteValue = 'yes'|'no'|'maybe';
export type Vote = { userId: string; kinkId: string; value: VoteValue; updatedAt: number };

type VotesState = {
  // Nested map: userId -> kinkId -> Vote
  byUser: Record<string, Record<string, Vote>>;
  setVote: (userId: string, kinkId: string, value: VoteValue) => void;
  getVote: (userId: string, kinkId: string) => VoteValue | null;
  clearUser: (userId: string) => void;
};

export const useVotes = create<VotesState>()(
  persist(
    (set, get) => ({
      byUser: {},
      setVote: (userId, kinkId, value) => {
        const updatedAt = Date.now();
        set(s => {
          const user = s.byUser[userId] ? { ...s.byUser[userId] } : {};
          user[kinkId] = { userId, kinkId, value, updatedAt };
          return { byUser: { ...s.byUser, [userId]: user } };
        });
      },
      getVote: (userId, kinkId) => {
        const u = get().byUser[userId];
        return u?.[kinkId]?.value ?? null;
      },
      clearUser: (userId) => set(s => {
        const copy = { ...s.byUser };
        delete copy[userId];
        return { byUser: copy };
      }),
    }),
    {
      name: 'votes-v1',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

/**
 * Compute matches between two local users.
 * Rules:
 *  - Mutual YES: both 'yes'
 *  - Mutual NO:  both 'no'
 *  - One-Sided: at least one is interested (yes/maybe) and the pair isn't mutual-yes
 *      * Includes yes/maybe combos, and solo yes/maybe when the other is unset or 'no'
 *  - Solo NO (one 'no' and the other is unset): ignored (doesn't create a one-sided item)
 */
export function computeMatches(
  aId: string | null,
  bId: string | null,
  allKinks: { id: string; title: string; tier?: string }[]
) {
  const out = {
    mutualYes: [] as string[],
    oneSided: [] as { kinkId: string; a?: VoteValue; b?: VoteValue }[],
    mutualNo: [] as string[],
  };
  if (!aId || !bId) return out;

  const byA = useVotes.getState().byUser[aId] || {};
  const byB = useVotes.getState().byUser[bId] || {};

  const has = (v: any) => v === 'yes' || v === 'no' || v === 'maybe';
  const isPos = (v: VoteValue | null) => v === 'yes' || v === 'maybe';

  for (const k of allKinks) {
    const va = (byA[k.id]?.value ?? null) as VoteValue | null;
    const vb = (byB[k.id]?.value ?? null) as VoteValue | null;

    if (!has(va) && !has(vb)) continue;

    // Mutuals first
    if (va === 'yes' && vb === 'yes') {
      out.mutualYes.push(k.id);
      continue;
    }
    if (va === 'no' && vb === 'no') {
      out.mutualNo.push(k.id);
      continue;
    }

    // Ignore solo NO (one 'no' while the other hasn't voted)
    if ((va === 'no' && !has(vb)) || (vb === 'no' && !has(va))) {
      continue;
    }

    // One-sided = any positive interest situation that isn't mutual-yes
    // (yes/maybe + (unset|no|maybe), or mixed yes/maybe)
    const posA = isPos(va);
    const posB = isPos(vb);
    if (posA || posB) {
      out.oneSided.push({ kinkId: k.id, a: va ?? undefined, b: vb ?? undefined });
      continue;
    }

    // Remaining cases (e.g., 'no' vs 'maybe' handled above, 'no' vs unset ignored)
  }
  return out;
}
