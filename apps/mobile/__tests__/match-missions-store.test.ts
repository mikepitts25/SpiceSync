import { useMatchMissionsStore } from '../lib/state/matchMissions';
import type { MatchSourceKink } from '../lib/gameMatchDeck';

const kinks: MatchSourceKink[] = [
  { id: 'a', title: 'Blindfolds' },
  { id: 'b', title: 'Roleplay' },
];

beforeEach(() => {
  useMatchMissionsStore.setState({ byProfileId: {}, draftByProfileId: {} });
});

describe('match missions store', () => {
  it('partitions state by profile id', () => {
    const store = useMatchMissionsStore.getState();
    store.drawCandidate('profile-1', kinks, { random: () => 0 });
    store.drawCandidate('profile-2', kinks, { random: () => 0.99 });

    expect(useMatchMissionsStore.getState().getDraft('profile-1')).not.toEqual(
      useMatchMissionsStore.getState().getDraft('profile-2')
    );
  });

  it('requires an explicit start before a drawn candidate becomes active', () => {
    const store = useMatchMissionsStore.getState();
    store.drawCandidate('profile-1', kinks, { random: () => 0 });

    expect(
      useMatchMissionsStore.getState().getActiveMission('profile-1')
    ).toBeUndefined();

    useMatchMissionsStore
      .getState()
      .startDraftedMission('profile-1', { now: 1000 });

    const active = useMatchMissionsStore
      .getState()
      .getActiveMission('profile-1');
    expect(active).toBeDefined();
    expect(active!.status).toBe('active');
    expect(
      useMatchMissionsStore.getState().getDraft('profile-1')
    ).toBeUndefined();
  });

  it('does not immediately reselect a skipped mission topic', () => {
    const store = useMatchMissionsStore.getState();
    store.drawCandidate('profile-1', [kinks[0]], { random: () => 0 });
    store.startDraftedMission('profile-1', { now: Date.now() });
    store.skipMission('profile-1', Date.now());

    const candidate = useMatchMissionsStore
      .getState()
      .drawCandidate('profile-1', [kinks[0]], { random: () => 0 });

    expect(candidate).toBeNull();
  });

  it('does not immediately reselect a completed mission topic', () => {
    const store = useMatchMissionsStore.getState();
    store.drawCandidate('profile-1', [kinks[0]], { random: () => 0 });
    store.startDraftedMission('profile-1', { now: Date.now() });
    store.completeMission('profile-1', Date.now());

    const candidate = useMatchMissionsStore
      .getState()
      .drawCandidate('profile-1', [kinks[0]], { random: () => 0 });

    expect(candidate).toBeNull();
  });

  it('excludes the kink backing an active mission from new draws', () => {
    const store = useMatchMissionsStore.getState();
    store.drawCandidate('profile-1', kinks, { random: () => 0 });
    store.startDraftedMission('profile-1', { now: 0 });

    const candidate = useMatchMissionsStore
      .getState()
      .drawCandidate('profile-1', kinks, { random: () => 0 });

    expect(candidate!.kinkId).toBe('b');
  });

  it('records completed and skipped missions in history, newest first', () => {
    const store = useMatchMissionsStore.getState();
    store.drawCandidate('profile-1', [kinks[0]], { random: () => 0 });
    store.startDraftedMission('profile-1', { now: 0 });
    store.completeMission('profile-1', 100);

    store.drawCandidate('profile-1', [kinks[1]], { random: () => 0 });
    store.startDraftedMission('profile-1', { now: 200 });
    store.skipMission('profile-1', 300);

    const history = useMatchMissionsStore.getState().getHistory('profile-1');
    expect(history.map((entry) => entry.status)).toEqual([
      'skipped',
      'completed',
    ]);
  });

  it('expires missions past their deadline, including after a simulated relaunch', () => {
    const store = useMatchMissionsStore.getState();
    store.drawCandidate('profile-1', [kinks[0]], { random: () => 0 });
    store.startDraftedMission('profile-1', { now: 0, durationMs: 1000 });

    store.expireDueMissions('profile-1', 10_000_000);

    const mission = useMatchMissionsStore
      .getState()
      .getActiveMission('profile-1');
    expect(mission).toBeUndefined();

    const history = useMatchMissionsStore.getState().getHistory('profile-1');
    expect(history[0].status).toBe('expired');
  });

  it('discards a draft without starting it', () => {
    const store = useMatchMissionsStore.getState();
    store.drawCandidate('profile-1', kinks, { random: () => 0 });
    store.discardDraft('profile-1');

    expect(
      useMatchMissionsStore.getState().getDraft('profile-1')
    ).toBeUndefined();
  });
});
