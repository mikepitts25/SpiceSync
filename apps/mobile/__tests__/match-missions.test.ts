import {
  computeExclusionSets,
  drawMissionCandidate,
  expireStaleMissions,
  formatRemainingDuration,
  remainingMissionMs,
  resolveMission,
  selectMissionCandidates,
  startMission,
  toHistoryEntry,
  type Mission,
} from '../lib/matchMissions';
import { DEFAULT_MISSION_DURATION_MS } from '../data/matchMissions';
import type { MatchSourceKink } from '../lib/gameMatchDeck';

const kink = (id: string, title = `Kink ${id}`): MatchSourceKink => ({
  id,
  title,
});

describe('selectMissionCandidates', () => {
  const kinks = [kink('a'), kink('b'), kink('c')];

  it('excludes kinks with an active mission', () => {
    const result = selectMissionCandidates(kinks, new Set(), new Set(['a']));
    expect(result.map((k) => k.id)).toEqual(['b', 'c']);
  });

  it('excludes recently resolved kinks so they are not immediately reselected', () => {
    const result = selectMissionCandidates(kinks, new Set(['b']), new Set());
    expect(result.map((k) => k.id)).toEqual(['a', 'c']);
  });

  it('returns everything when nothing is excluded', () => {
    const result = selectMissionCandidates(kinks, new Set(), new Set());
    expect(result).toHaveLength(3);
  });
});

describe('drawMissionCandidate', () => {
  it('returns null with no candidates', () => {
    expect(drawMissionCandidate([])).toBeNull();
  });

  it('deterministically draws a candidate and generic consent-forward copy', () => {
    const candidate = drawMissionCandidate([kink('a', 'Blindfolds')], {
      random: () => 0,
    });
    expect(candidate).not.toBeNull();
    expect(candidate!.kinkId).toBe('a');
    expect(candidate!.copy).toContain('Blindfolds');
    // Copy must stay generic/consent-forward, never inventing explicit acts.
    expect(candidate!.copy.toLowerCase()).not.toContain('sex');
  });

  it('writes Spanish copy when asked', () => {
    const candidate = drawMissionCandidate([kink('a', 'Vendas')], {
      language: 'es',
      random: () => 0,
    });
    expect(candidate!.copy).toContain('Vendas');
  });

  it('picks different candidates for different random draws', () => {
    const candidates = [kink('a'), kink('b'), kink('c')];
    const first = drawMissionCandidate(candidates, { random: () => 0 });
    const second = drawMissionCandidate(candidates, { random: () => 0.99 });
    expect(first!.kinkId).not.toBe(second!.kinkId);
  });
});

describe('mission lifecycle', () => {
  const candidate = {
    kinkId: 'a',
    title: 'Blindfolds',
    copy: 'Talk about it.',
  };

  it('starts a mission with a 24h default duration', () => {
    const mission = startMission(candidate, { now: 1000, id: 'm1' });
    expect(mission).toMatchObject({
      id: 'm1',
      kinkId: 'a',
      status: 'active',
      createdAt: 1000,
      startedAt: 1000,
      expiresAt: 1000 + DEFAULT_MISSION_DURATION_MS,
    });
  });

  it('supports a custom duration', () => {
    const mission = startMission(candidate, { now: 0, durationMs: 5000 });
    expect(mission.expiresAt).toBe(5000);
  });

  it('resolves to completed or skipped with a resolvedAt timestamp', () => {
    const mission = startMission(candidate, { now: 0 });
    const completed = resolveMission(mission, 'completed', 500);
    expect(completed.status).toBe('completed');
    expect(completed.resolvedAt).toBe(500);

    const skipped = resolveMission(mission, 'skipped', 600);
    expect(skipped.status).toBe('skipped');
  });

  it('expires active missions once past their expiry timestamp, and leaves others untouched', () => {
    const active: Mission = startMission(candidate, {
      now: 0,
      durationMs: 1000,
    });
    const completed: Mission = resolveMission(
      startMission(candidate, { now: 0, durationMs: 1000 }),
      'completed',
      50
    );

    const result = expireStaleMissions([active, completed], 2000);
    expect(result[0].status).toBe('expired');
    expect(result[0].resolvedAt).toBe(2000);
    expect(result[1]).toEqual(completed);
  });

  it('does not expire a mission still within its window', () => {
    const active = startMission(candidate, { now: 0, durationMs: 1000 });
    const result = expireStaleMissions([active], 500);
    expect(result[0].status).toBe('active');
  });

  it('survives app relaunch: expiry only depends on stored timestamps, not session time', () => {
    // Simulate: mission started long ago, "now" jumps forward as if the app
    // was relaunched a day later with no session continuity in between.
    const active = startMission(candidate, { now: 0, durationMs: 1000 });
    const relaunchedNow = 10_000_000;
    const result = expireStaleMissions([active], relaunchedNow);
    expect(result[0].status).toBe('expired');
  });

  it('computes remaining time only for active missions', () => {
    const active = startMission(candidate, { now: 0, durationMs: 1000 });
    expect(remainingMissionMs(active, 400)).toBe(600);
    expect(remainingMissionMs(active, 2000)).toBe(0);

    const completed = resolveMission(active, 'completed', 400);
    expect(remainingMissionMs(completed, 500)).toBe(0);
  });

  it('formats remaining duration as hours and minutes', () => {
    expect(formatRemainingDuration(0)).toBe('0h 0m');
    expect(formatRemainingDuration(90 * 60 * 1000)).toBe('1h 30m');
  });

  it('converts resolved missions to history entries and skips active ones', () => {
    const active = startMission(candidate, { now: 0 });
    expect(toHistoryEntry(active)).toBeNull();

    const completed = resolveMission(active, 'completed', 999);
    expect(toHistoryEntry(completed)).toEqual({
      id: completed.id,
      kinkId: 'a',
      title: 'Blindfolds',
      status: 'completed',
      resolvedAt: 999,
    });
  });
});

describe('computeExclusionSets', () => {
  const candidate = { kinkId: 'a', title: 'A', copy: 'copy' };

  it('separates active kink ids from recently resolved ones', () => {
    const active = startMission(candidate, { now: 0 });
    const resolvedRecent = resolveMission(
      startMission({ ...candidate, kinkId: 'b' }, { now: 0 }),
      'skipped',
      100
    );
    const resolvedOld = resolveMission(
      startMission({ ...candidate, kinkId: 'c' }, { now: 0 }),
      'completed',
      100
    );

    const { activeKinkIds, recentlyResolvedKinkIds } = computeExclusionSets(
      [active, resolvedRecent, resolvedOld],
      {
        now: 100 + DEFAULT_MISSION_DURATION_MS - 1,
        cooldownMs: DEFAULT_MISSION_DURATION_MS,
      }
    );

    expect(activeKinkIds).toEqual(new Set(['a']));
    expect(recentlyResolvedKinkIds).toEqual(new Set(['b', 'c']));
  });

  it('drops resolved kinks from the cooldown set once the cooldown has elapsed', () => {
    const resolved = resolveMission(
      startMission(candidate, { now: 0 }),
      'completed',
      0
    );
    const { recentlyResolvedKinkIds } = computeExclusionSets([resolved], {
      now: DEFAULT_MISSION_DURATION_MS + 1,
      cooldownMs: DEFAULT_MISSION_DURATION_MS,
    });
    expect(recentlyResolvedKinkIds).toEqual(new Set());
  });
});
