// Private fantasy journal. Entries live only on this device and are never
// part of matching, share codes, or partner sync unless the user explicitly
// shares an eligible entry via shareEntryToMatching(). Entries marked
// fantasy_only can never be shared into matching.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorage } from '../storage/mmkv';
import { useVotesStore } from '../../src/stores/votes';
import type { Readiness } from '../votes/rolePreferences';

export type FantasyStatus = 'fantasy_only' | 'curious' | 'want_to_try';

export type FantasyEntry = {
  id: string;
  profileId: string;
  title: string;
  note?: string;
  status: FantasyStatus;
  // Optional link to a catalog kink; required for sharing into matching.
  linkedKinkId?: string;
  createdAt: number;
  updatedAt: number;
  // Set only after the user explicitly shared this entry into matching.
  sharedToMatchingAt?: number;
};

type FantasyJournalState = {
  entries: Record<string, FantasyEntry>;
  addEntry: (input: {
    profileId: string;
    title: string;
    note?: string;
    status: FantasyStatus;
    linkedKinkId?: string;
  }) => FantasyEntry | null;
  updateEntry: (
    id: string,
    patch: Partial<
      Pick<FantasyEntry, 'title' | 'note' | 'status' | 'linkedKinkId'>
    >
  ) => void;
  removeEntry: (id: string) => void;
  getEntriesForProfile: (profileId: string) => FantasyEntry[];
  // Explicit user action: pushes the entry's readiness into the votes store
  // so it participates in matching. Returns false when the entry is not
  // eligible (fantasy_only, missing, or not linked to a kink).
  shareEntryToMatching: (id: string) => boolean;
};

export function isShareableStatus(status: FantasyStatus): boolean {
  return status === 'curious' || status === 'want_to_try';
}

export function statusToReadiness(status: FantasyStatus): Readiness | null {
  if (status === 'want_to_try') return 'yes';
  if (status === 'curious') return 'curious';
  return null;
}

let entryCounter = 0;
const makeEntryId = (): string =>
  `fantasy-${Date.now().toString(36)}-${(entryCounter++).toString(36)}`;

export const useFantasyJournalStore = create<FantasyJournalState>()(
  persist(
    (set, get) => ({
      entries: {},

      addEntry: ({ profileId, title, note, status, linkedKinkId }) => {
        const trimmedTitle = title.trim();
        const normalizedProfile = String(profileId || '').trim();
        if (!trimmedTitle || !normalizedProfile) return null;

        const now = Date.now();
        const entry: FantasyEntry = {
          id: makeEntryId(),
          profileId: normalizedProfile,
          title: trimmedTitle,
          note: note?.trim() ? note : undefined,
          status,
          linkedKinkId,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          entries: { ...state.entries, [entry.id]: entry },
        }));
        return entry;
      },

      updateEntry: (id, patch) => {
        set((state) => {
          const current = state.entries[id];
          if (!current) return state;

          const next: FantasyEntry = {
            ...current,
            ...patch,
            title: patch.title?.trim() ? patch.title : current.title,
            updatedAt: Date.now(),
          };

          // Downgrading to fantasy_only withdraws any previous share intent
          // marker; the vote itself stays under the user's control in My Votes.
          if (next.status === 'fantasy_only') {
            next.sharedToMatchingAt = undefined;
          }

          return { entries: { ...state.entries, [id]: next } };
        });
      },

      removeEntry: (id) => {
        set((state) => {
          if (!(id in state.entries)) return state;
          const entries = { ...state.entries };
          delete entries[id];
          return { entries };
        });
      },

      getEntriesForProfile: (profileId) => {
        const normalized = String(profileId || '').trim();
        if (!normalized) return [];
        return Object.values(get().entries)
          .filter((entry) => entry.profileId === normalized)
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },

      shareEntryToMatching: (id) => {
        const entry = get().entries[id];
        if (!entry || !entry.linkedKinkId) return false;

        const readiness = statusToReadiness(entry.status);
        if (!readiness) return false;

        useVotesStore
          .getState()
          .setReadiness(entry.profileId, entry.linkedKinkId, readiness);

        set((state) => ({
          entries: {
            ...state.entries,
            [id]: { ...entry, sharedToMatchingAt: Date.now() },
          },
        }));
        return true;
      },
    }),
    {
      name: 'fantasy-journal',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
