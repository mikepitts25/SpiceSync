// Local-only "match to plan" state: favorites, next-session picks, completed
// history, and private notes per activity. Nothing here ever leaves the
// device unless the user explicitly shares proposal text.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorage } from '../storage/mmkv';

export type MatchPlan = {
  kinkId: string;
  favorite: boolean;
  nextSession: boolean;
  completedAt: number[];
  note?: string;
  updatedAt: number;
};

type MatchPlansState = {
  plansByKinkId: Record<string, MatchPlan>;
  toggleFavorite: (kinkId: string) => void;
  toggleNextSession: (kinkId: string) => void;
  markCompleted: (kinkId: string, completedAt?: number) => void;
  setNote: (kinkId: string, note: string) => void;
  clearPlan: (kinkId: string) => void;
  getPlan: (kinkId: string) => MatchPlan | undefined;
};

const normalizeId = (id: string): string | null => {
  const normalized = String(id || '').trim();
  return normalized.length ? normalized : null;
};

const emptyPlan = (kinkId: string): MatchPlan => ({
  kinkId,
  favorite: false,
  nextSession: false,
  completedAt: [],
  updatedAt: Date.now(),
});

const isEmptyPlan = (plan: MatchPlan): boolean =>
  !plan.favorite &&
  !plan.nextSession &&
  plan.completedAt.length === 0 &&
  !plan.note;

export const useMatchPlansStore = create<MatchPlansState>()(
  persist(
    (set, get) => {
      const update = (
        kinkId: string,
        mutate: (plan: MatchPlan) => MatchPlan
      ) => {
        const normalized = normalizeId(kinkId);
        if (!normalized) return;

        set((state) => {
          const current =
            state.plansByKinkId[normalized] ?? emptyPlan(normalized);
          const next = { ...mutate({ ...current }), updatedAt: Date.now() };
          const plansByKinkId = { ...state.plansByKinkId };
          if (isEmptyPlan(next)) {
            delete plansByKinkId[normalized];
          } else {
            plansByKinkId[normalized] = next;
          }
          return { plansByKinkId };
        });
      };

      return {
        plansByKinkId: {},

        toggleFavorite: (kinkId) =>
          update(kinkId, (plan) => ({ ...plan, favorite: !plan.favorite })),

        toggleNextSession: (kinkId) =>
          update(kinkId, (plan) => ({
            ...plan,
            nextSession: !plan.nextSession,
          })),

        markCompleted: (kinkId, completedAt = Date.now()) =>
          update(kinkId, (plan) => ({
            ...plan,
            // Completing an activity clears it from the next-session queue.
            nextSession: false,
            completedAt: [...plan.completedAt, completedAt],
          })),

        setNote: (kinkId, note) =>
          update(kinkId, (plan) => ({
            ...plan,
            note: note.trim() ? note : undefined,
          })),

        clearPlan: (kinkId) => {
          const normalized = normalizeId(kinkId);
          if (!normalized) return;
          set((state) => {
            if (!(normalized in state.plansByKinkId)) return state;
            const plansByKinkId = { ...state.plansByKinkId };
            delete plansByKinkId[normalized];
            return { plansByKinkId };
          });
        },

        getPlan: (kinkId) => {
          const normalized = normalizeId(kinkId);
          if (!normalized) return undefined;
          return get().plansByKinkId[normalized];
        },
      };
    },
    {
      name: 'match-plans',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ plansByKinkId: state.plansByKinkId }),
    }
  )
);

export function selectFavorites(plans: Record<string, MatchPlan>): MatchPlan[] {
  return Object.values(plans).filter((plan) => plan.favorite);
}

export function selectNextSession(
  plans: Record<string, MatchPlan>
): MatchPlan[] {
  return Object.values(plans).filter((plan) => plan.nextSession);
}

export function selectCompleted(plans: Record<string, MatchPlan>): MatchPlan[] {
  return Object.values(plans).filter((plan) => plan.completedAt.length > 0);
}

// Neutral, consent-forward text the user can copy or share with their
// partner. Deliberately does not include votes, notes, or anything private.
export function buildProposalText(title: string): string {
  return `I'd like to plan "${title}" together sometime. Interested? We can talk through what we'd both want first.`;
}
