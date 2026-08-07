// Local-only Match Missions state, partitioned by active profile ID. Nothing
// here leaves the device — missions are derived from mutual-yes matches only
// (see lib/gameMatchDeck.ts / lib/matchMissions.ts) and stored per profile so
// switching profiles never leaks one person's mission history to another.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { mmkvStorage } from '../storage/mmkv';
import {
  computeExclusionSets,
  drawMissionCandidate,
  expireStaleMissions,
  resolveMission,
  selectMissionCandidates,
  startMission,
  toHistoryEntry,
  type Mission,
  type MissionCandidate,
  type MissionHistoryEntry,
} from '../matchMissions';
import type { MatchSourceKink } from '../gameMatchDeck';
import type { MissionLanguage } from '../../data/matchMissions';

type ProfileMissionState = {
  missions: Mission[];
};

type MatchMissionsState = {
  byProfileId: Record<string, ProfileMissionState>;
  draftByProfileId: Record<string, MissionCandidate | undefined>;

  getActiveMission: (profileId: string) => Mission | undefined;
  getDraft: (profileId: string) => MissionCandidate | undefined;
  getHistory: (profileId: string) => MissionHistoryEntry[];

  drawCandidate: (
    profileId: string,
    mutualYesKinks: readonly MatchSourceKink[],
    options?: { language?: MissionLanguage; random?: () => number }
  ) => MissionCandidate | null;
  discardDraft: (profileId: string) => void;
  startDraftedMission: (
    profileId: string,
    options?: { now?: number; durationMs?: number }
  ) => void;
  completeMission: (profileId: string, now?: number) => void;
  skipMission: (profileId: string, now?: number) => void;
  expireDueMissions: (profileId: string, now?: number) => void;
};

const emptyProfileState = (): ProfileMissionState => ({ missions: [] });

export const useMatchMissionsStore = create<MatchMissionsState>()(
  persist(
    (set, get) => ({
      byProfileId: {},
      draftByProfileId: {},

      getActiveMission: (profileId) => {
        const state = get().byProfileId[profileId];
        return state?.missions.find((mission) => mission.status === 'active');
      },

      getDraft: (profileId) => get().draftByProfileId[profileId],

      getHistory: (profileId) => {
        const state = get().byProfileId[profileId];
        if (!state) return [];
        return state.missions
          .map(toHistoryEntry)
          .filter((entry): entry is MissionHistoryEntry => entry !== null)
          .sort((a, b) => b.resolvedAt - a.resolvedAt);
      },

      drawCandidate: (profileId, mutualYesKinks, options) => {
        const profileState =
          get().byProfileId[profileId] ?? emptyProfileState();
        const { activeKinkIds, recentlyResolvedKinkIds } = computeExclusionSets(
          profileState.missions
        );
        const candidates = selectMissionCandidates(
          mutualYesKinks,
          recentlyResolvedKinkIds,
          activeKinkIds
        );
        const candidate = drawMissionCandidate(candidates, options);

        set((state) => ({
          draftByProfileId: {
            ...state.draftByProfileId,
            [profileId]: candidate ?? undefined,
          },
        }));

        return candidate;
      },

      discardDraft: (profileId) => {
        set((state) => {
          const draftByProfileId = { ...state.draftByProfileId };
          delete draftByProfileId[profileId];
          return { draftByProfileId };
        });
      },

      startDraftedMission: (profileId, options) => {
        const draft = get().draftByProfileId[profileId];
        if (!draft) return;

        const mission = startMission(draft, options);

        set((state) => {
          const profileState =
            state.byProfileId[profileId] ?? emptyProfileState();
          const draftByProfileId = { ...state.draftByProfileId };
          delete draftByProfileId[profileId];

          return {
            byProfileId: {
              ...state.byProfileId,
              [profileId]: {
                missions: [...profileState.missions, mission],
              },
            },
            draftByProfileId,
          };
        });
      },

      completeMission: (profileId, now = Date.now()) => {
        set((state) => {
          const profileState = state.byProfileId[profileId];
          if (!profileState) return state;

          const missions = profileState.missions.map((mission) =>
            mission.status === 'active'
              ? resolveMission(mission, 'completed', now)
              : mission
          );

          return {
            byProfileId: { ...state.byProfileId, [profileId]: { missions } },
          };
        });
      },

      skipMission: (profileId, now = Date.now()) => {
        set((state) => {
          const profileState = state.byProfileId[profileId];
          if (!profileState) return state;

          const missions = profileState.missions.map((mission) =>
            mission.status === 'active'
              ? resolveMission(mission, 'skipped', now)
              : mission
          );

          return {
            byProfileId: { ...state.byProfileId, [profileId]: { missions } },
          };
        });
      },

      expireDueMissions: (profileId, now = Date.now()) => {
        set((state) => {
          const profileState = state.byProfileId[profileId];
          if (!profileState) return state;

          const missions = expireStaleMissions(profileState.missions, now);
          const changed = missions.some(
            (mission, index) => mission !== profileState.missions[index]
          );
          if (!changed) return state;

          return {
            byProfileId: { ...state.byProfileId, [profileId]: { missions } },
          };
        });
      },
    }),
    {
      name: 'match-missions',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ byProfileId: state.byProfileId }),
    }
  )
);
