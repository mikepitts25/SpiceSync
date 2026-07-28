// One-time retroactive achievement credit.
//
// Game and match progress was never recorded into the streak store, so
// players who used the app before that wiring existed show zero progress
// despite real history. The stores that DID persist that history are the
// source of truth we replay from.
//
// This is deliberately a one-shot: it stamps a version so a second run
// cannot double-credit, and it only ever moves counters forward.

import type { GameModeId } from './achievements';
import { useCoupleDiceStore } from './state/coupleDice';
import { useMatchMissionsStore } from './state/matchMissions';
import { useMatchPlansStore, selectCompleted } from './state/matchPlans';

export const BACKFILL_VERSION = 1;

export type BackfillSources = {
  /** Saved Couple Dice prompts across every profile. */
  savedDiceRolls: number;
  /** Resolved Match Missions with a `completed` outcome. */
  completedMissions: number;
  /** Activities marked completed in the match-plans store. */
  completedActivities: number;
  /** Mutual-yes matches already computed for the couple. */
  matchCount: number;
};

export type BackfillCounters = {
  gameModesPlayed: GameModeId[];
  diceRollCount: number;
  missionsCompleted: number;
  matchCount: number;
};

/**
 * Derives the counters implied by existing history. Counters only move
 * forward — whatever the store already holds wins if it is larger, so a
 * player who has since made real progress is never demoted.
 *
 * Know Me Better is intentionally absent: it keeps no persisted history,
 * so there is nothing to replay and its progress genuinely starts at zero.
 */
export function computeBackfill(
  sources: BackfillSources,
  current: BackfillCounters
): BackfillCounters {
  const modes = new Set<GameModeId>(current.gameModesPlayed ?? []);

  // A saved roll or a resolved mission is proof the mode was played.
  if (sources.savedDiceRolls > 0) modes.add('couple-dice');
  if (sources.completedMissions > 0) modes.add('match-missions');

  return {
    gameModesPlayed: [...modes],
    diceRollCount: Math.max(current.diceRollCount ?? 0, sources.savedDiceRolls),
    missionsCompleted: Math.max(
      current.missionsCompleted ?? 0,
      sources.completedMissions
    ),
    matchCount: Math.max(current.matchCount ?? 0, sources.matchCount),
  };
}

export function shouldRunBackfill(
  completedVersion: number | undefined
): boolean {
  return (completedVersion ?? 0) < BACKFILL_VERSION;
}

/**
 * Reads replayable history out of the persisted stores. Counts across all
 * profiles: achievements are device-level, not per-profile.
 *
 * Callers must ensure the source stores have rehydrated first — reading
 * mid-rehydration yields zeros, which would stamp an empty backfill.
 */
export function collectBackfillSources(): BackfillSources {
  const savedDiceRolls = Object.values(
    useCoupleDiceStore.getState().savedByProfileId ?? {}
  ).reduce((total, rolls) => total + (rolls?.length ?? 0), 0);

  const completedMissions = Object.values(
    useMatchMissionsStore.getState().byProfileId ?? {}
  ).reduce(
    (total, profile) =>
      total +
      (profile?.missions ?? []).filter(
        (mission) => mission.status === 'completed'
      ).length,
    0
  );

  const completedActivities = selectCompleted(
    useMatchPlansStore.getState().plansByKinkId ?? {}
  ).length;

  return {
    savedDiceRolls,
    completedMissions,
    completedActivities,
    // Completed activities are the only durable local proof a couple acted
    // on a match, so they stand in for historical match count.
    matchCount: completedActivities,
  };
}
