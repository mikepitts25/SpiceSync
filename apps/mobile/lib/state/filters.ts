// apps/mobile/lib/state/filters.ts
import { create } from 'zustand';

export type Tier = 'soft' | 'naughty' | 'xxx' | null;

export const TIER_FILTER_OPTIONS: { label: string; value: Tier }[] = [
  { label: 'ALL', value: null },
  { label: 'SOFT', value: 'soft' },
  { label: 'NAUGHTY', value: 'naughty' },
  { label: 'XXX', value: 'xxx' },
];

export const COMFORT_DECK_OPTIONS: {
  id: string;
  title: string;
  label: string;
  body: string;
  tier: Tier;
}[] = [
  {
    id: 'soft',
    title: 'Soft Start',
    label: 'SOFT',
    body: 'Gentler cards for an easier first pass through the deck.',
    tier: 'soft',
  },
  {
    id: 'naughty',
    title: 'Naughty',
    label: 'NAUGHTY',
    body: 'A bolder starting point without jumping straight to XXX.',
    tier: 'naughty',
  },
  {
    id: 'xxx',
    title: 'XXX',
    label: 'XXX',
    body: 'Start with the most explicit deck level.',
    tier: 'xxx',
  },
  {
    id: 'all',
    title: 'Full Deck',
    label: 'ALL',
    body: 'Show every intensity level from the beginning.',
    tier: null,
  },
];

export function filterKinksByTier<T extends { tier?: Tier }>(
  items: T[],
  tier: Tier
): T[] {
  return tier ? items.filter((item) => item.tier === tier) : items;
}

export function describeTierFilter(tier: Tier): string {
  if (!tier) return 'All intensity levels';
  if (tier === 'xxx') return 'XXX intensity';
  return `${tier[0].toUpperCase()}${tier.slice(1)} intensity`;
}

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
