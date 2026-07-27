// Pure Match Missions selection + lifecycle logic. No storage, no React —
// kept testable and reused by both the store and the screen.
import {
  DEFAULT_MISSION_DURATION_MS,
  buildMissionCopy,
  missionTemplateCount,
  type MissionLanguage,
} from '../data/matchMissions';
import type { MatchSourceKink } from './gameMatchDeck';

export type MissionStatus = 'active' | 'completed' | 'skipped' | 'expired';

export type MissionCandidate = {
  kinkId: string;
  title: string;
  copy: string;
};

export type Mission = {
  id: string;
  kinkId: string;
  title: string;
  copy: string;
  status: MissionStatus;
  createdAt: number;
  startedAt?: number;
  expiresAt?: number;
  resolvedAt?: number;
};

export type MissionHistoryEntry = {
  id: string;
  kinkId: string;
  title: string;
  status: 'completed' | 'skipped' | 'expired';
  resolvedAt: number;
};

/**
 * Candidates a couple can draw a mission from. Excludes kinks with a
 * recently skipped/completed mission so the same one isn't immediately
 * reselected, and excludes anything already backing an active mission.
 */
export function selectMissionCandidates(
  mutualYesKinks: readonly MatchSourceKink[],
  recentlyResolvedKinkIds: ReadonlySet<string>,
  activeKinkIds: ReadonlySet<string>
): MatchSourceKink[] {
  return mutualYesKinks.filter(
    (kink) =>
      !recentlyResolvedKinkIds.has(kink.id) && !activeKinkIds.has(kink.id)
  );
}

/**
 * Draws one candidate deterministically via an injectable random source.
 * Returns null when there is nothing eligible to draw.
 */
export function drawMissionCandidate(
  candidates: readonly MatchSourceKink[],
  {
    language = 'en',
    random = Math.random,
  }: { language?: MissionLanguage; random?: () => number } = {}
): MissionCandidate | null {
  if (!candidates.length) return null;

  const index = Math.floor(random() * candidates.length) % candidates.length;
  const kink = candidates[index];
  const templateIndex = Math.floor(random() * missionTemplateCount(language));

  return {
    kinkId: kink.id,
    title: kink.title,
    copy: buildMissionCopy(kink.title, templateIndex, language),
  };
}

export function createMissionId(): string {
  return `mission-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Starts a candidate as an active mission with a default 24h duration.
 * The caller supplies `now` and an id generator so tests stay deterministic.
 */
export function startMission(
  candidate: MissionCandidate,
  {
    now = Date.now(),
    durationMs = DEFAULT_MISSION_DURATION_MS,
    id = createMissionId(),
  }: { now?: number; durationMs?: number; id?: string } = {}
): Mission {
  return {
    id,
    kinkId: candidate.kinkId,
    title: candidate.title,
    copy: candidate.copy,
    status: 'active',
    createdAt: now,
    startedAt: now,
    expiresAt: now + durationMs,
  };
}

export function resolveMission(
  mission: Mission,
  outcome: 'completed' | 'skipped',
  now: number = Date.now()
): Mission {
  return { ...mission, status: outcome, resolvedAt: now };
}

/**
 * Expires any active mission whose expiry timestamp has passed. Safe to call
 * repeatedly (including right after an app relaunch) since it is a pure
 * function of the mission's own timestamps, not elapsed session time.
 */
export function expireStaleMissions(
  missions: readonly Mission[],
  now: number = Date.now()
): Mission[] {
  return missions.map((mission) => {
    if (mission.status !== 'active') return mission;
    if (mission.expiresAt !== undefined && mission.expiresAt <= now) {
      return { ...mission, status: 'expired', resolvedAt: now };
    }
    return mission;
  });
}

export function remainingMissionMs(
  mission: Mission,
  now: number = Date.now()
): number {
  if (mission.status !== 'active' || mission.expiresAt === undefined) {
    return 0;
  }
  return Math.max(0, mission.expiresAt - now);
}

export function formatRemainingDuration(ms: number): string {
  if (ms <= 0) return '0h 0m';
  const totalMinutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function toHistoryEntry(mission: Mission): MissionHistoryEntry | null {
  if (mission.status === 'active') return null;
  if (mission.resolvedAt === undefined) return null;
  return {
    id: mission.id,
    kinkId: mission.kinkId,
    title: mission.title,
    status: mission.status,
    resolvedAt: mission.resolvedAt,
  };
}

/**
 * Kink ids that should be excluded from the next draw: currently active,
 * plus anything resolved within the cooldown window (default: same as the
 * mission duration, so a skipped/completed topic doesn't reappear same-day).
 */
export function computeExclusionSets(
  missions: readonly Mission[],
  {
    now = Date.now(),
    cooldownMs = DEFAULT_MISSION_DURATION_MS,
  }: { now?: number; cooldownMs?: number } = {}
): { activeKinkIds: Set<string>; recentlyResolvedKinkIds: Set<string> } {
  const activeKinkIds = new Set<string>();
  const recentlyResolvedKinkIds = new Set<string>();

  for (const mission of missions) {
    if (mission.status === 'active') {
      activeKinkIds.add(mission.kinkId);
      continue;
    }
    if (
      mission.resolvedAt !== undefined &&
      now - mission.resolvedAt < cooldownMs
    ) {
      recentlyResolvedKinkIds.add(mission.kinkId);
    }
  }

  return { activeKinkIds, recentlyResolvedKinkIds };
}
