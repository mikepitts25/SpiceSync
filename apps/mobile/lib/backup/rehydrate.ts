import { useStreakStore } from '../achievements';
import { useViewedMatchesStore } from '../match/viewedMatches';
import { useConversationStore } from '../state/conversationStore';
import { useCoupleDiceStore } from '../state/coupleDice';
import { useFantasyJournalStore } from '../state/fantasyJournal';
import { useMatchMissionsStore } from '../state/matchMissions';
import { useMatchPlansStore } from '../state/matchPlans';
import { useProfilesStore } from '../state/profiles';
import { useShareCodes } from '../state/shareCodes';
import { useStarterPackStore } from '../state/starterPack';
import { useSettings } from '../state/useStore';
import { useAchievementsStore } from '../../src/stores/achievements';
import { useCustomGameCardsStore } from '../../src/stores/customGameCards';
import { useLevelingStore } from '../../src/stores/leveling';
import { useLoveLanguagesStore } from '../../src/stores/loveLanguages';
import { useNudgesStore } from '../../src/stores/nudges';
import { useScreenToursStore } from '../../src/stores/screenTours';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useVotesStore } from '../../src/stores/votes';

/**
 * `applyRestore` writes to AsyncStorage, but the running app serves state from
 * zustand's in-memory copy. Without an explicit rehydrate the user sees their
 * old data until the next cold start, which reads as "the restore silently
 * failed" and invites a second, redundant restore.
 *
 * Every store here is one the snapshot allowlist can write. Stores that
 * backups are not allowed to touch (entitlement, partner link, relay state)
 * are deliberately absent — rehydrating them would re-read values a restore
 * never changed, and is a no-op at best.
 */

/** Persisted stores, keyed by the storage key the snapshot layer writes. */
const PERSISTED_STORES = {
  'settings-v1': useSettings,
  'spicesync-settings-v3': useSettingsStore,
  'conversation-store': useConversationStore,
  'couple-dice': useCoupleDiceStore,
  'fantasy-journal': useFantasyJournalStore,
  'love-languages-storage': useLoveLanguagesStore,
  'match-missions': useMatchMissionsStore,
  'match-plans': useMatchPlansStore,
  'starter-pack': useStarterPackStore,
  'viewed-matches': useViewedMatchesStore,
  'share-codes': useShareCodes,
  'spicesync-custom-game-cards': useCustomGameCardsStore,
  'spicesync-screen-tours-v1': useScreenToursStore,
  votes: useVotesStore,
  'spicesync-achievements': useAchievementsStore,
  'spicesync-streak-storage': useStreakStore,
  'spicesync-leveling': useLevelingStore,
  'spicesync-nudges': useNudgesStore,
} as const;

export type RehydrateResult = {
  /** Storage keys whose store was successfully re-read. */
  rehydrated: string[];
  /** Keys whose store threw while re-reading, with the message. */
  failed: { key: string; error: string }[];
};

/**
 * Re-read restored keys into their live stores.
 *
 * Failures are collected rather than thrown: a single malformed store should
 * not abandon the rest of a restore half-applied. The caller decides whether a
 * partial result is worth surfacing.
 */
export async function rehydrateRestoredStores(
  restoredKeys: readonly string[]
): Promise<RehydrateResult> {
  const rehydrated: string[] = [];
  const failed: { key: string; error: string }[] = [];

  for (const key of restoredKeys) {
    if (key === 'profiles') {
      // Profiles predate zustand persist and hydrate manually. `hydrate()`
      // early-returns once hydrated, so the flag must be cleared first or the
      // restored profiles are never read.
      try {
        useProfilesStore.setState({ hydrated: false });
        await useProfilesStore.getState().hydrate();
        rehydrated.push(key);
      } catch (error) {
        failed.push({ key, error: describeError(error) });
      }
      continue;
    }

    const store = PERSISTED_STORES[key as keyof typeof PERSISTED_STORES];
    if (!store) continue;

    try {
      await store.persist.rehydrate();
      rehydrated.push(key);
    } catch (error) {
      failed.push({ key, error: describeError(error) });
    }
  }

  return { rehydrated, failed };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
