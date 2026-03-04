// apps/mobile/lib/state/filters.ts
import { create } from 'zustand';

export type Tier = 'soft' | 'naughty' | 'xxx' | null;

type State = {
  selectedTier: Tier;
  setTier: (t: Tier) => void;
  clearTier: () => void;
};

export const useFilters = create<State>((set) => ({
  selectedTier: null,
  setTier: (t) => set({ selectedTier: t }),
  clearTier: () => set({ selectedTier: null }),
}));
