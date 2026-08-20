import AsyncStorage from '@react-native-async-storage/async-storage';

import { useStreakStore } from '../achievements';
import { useViewedMatchesStore } from '../match/viewedMatches';
import { resetAllLocalNotifications } from '../notifications';
import { useConversationStore } from '../state/conversationStore';
import { useCoupleDiceStore } from '../state/coupleDice';
import { useFantasyJournalStore } from '../state/fantasyJournal';
import { useMatchMissionsStore } from '../state/matchMissions';
import { useMatchPlansStore } from '../state/matchPlans';
import { useProfilesStore } from '../state/profiles';
import { useShareCodes } from '../state/shareCodes';
import { useStarterPackStore } from '../state/starterPack';
import { useSettings } from '../state/useStore';
import { useCoupleLinkStore } from '../sync/coupleLink';
import { useEventQueueStore } from '../sync/eventQueue';
import { clearIdentity } from '../sync/identity';
import { usePartnerVotesStore } from '../sync/partnerVotes';
import { useRevealConsentStore } from '../sync/revealConsent';
import { useVoteSyncStore } from '../sync/voteSync';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useAchievementsStore } from '../../src/stores/achievements';
import { useCustomGameCardsStore } from '../../src/stores/customGameCards';
import { useLevelingStore } from '../../src/stores/leveling';
import { useLoveLanguagesStore } from '../../src/stores/loveLanguages';
import { useNudgesStore } from '../../src/stores/nudges';
import { PREMIUM_STORAGE_KEY } from '../../src/stores/premium';
import { useScreenToursStore } from '../../src/stores/screenTours';
import { useVotesStore } from '../../src/stores/votes';

export function clearActiveProfileVotes(): boolean {
  const activeProfileId = useProfilesStore.getState().getActiveProfileId();
  if (!activeProfileId) return false;
  useVotesStore.getState().clearProfile(activeProfileId);
  return true;
}

export function disconnectRemotePartnerLocal(): void {
  useCoupleLinkStore.getState().clear();
  usePartnerVotesStore.getState().reset();
  useRevealConsentStore.getState().reset();
  useEventQueueStore.getState().reset();
}

/**
 * Forgetting a device intentionally removes only remote identity and sync
 * state. Local profiles, votes, and settings remain available on this device.
 */
export function clearForgottenDeviceState(): void {
  disconnectRemotePartnerLocal();
  useVoteSyncStore.getState().reset();
}

function withoutKey<T>(
  record: Record<string, T>,
  key: string
): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

export function deleteProfileAndData(profileId: string): void {
  if (!profileId) return;

  useVotesStore.getState().clearProfile(profileId);
  useLoveLanguagesStore.getState().clearResult(profileId);
  useCoupleDiceStore.setState((state) => ({
    savedByProfileId: withoutKey(state.savedByProfileId, profileId),
  }));
  useFantasyJournalStore.setState((state) => ({
    entries: Object.fromEntries(
      Object.entries(state.entries).filter(
        ([, entry]) => entry.profileId !== profileId
      )
    ),
  }));
  useMatchMissionsStore.setState((state) => ({
    byProfileId: withoutKey(state.byProfileId, profileId),
    draftByProfileId: withoutKey(state.draftByProfileId, profileId),
  }));
  useStarterPackStore.setState((state) => ({
    dismissedByProfile: withoutKey(state.dismissedByProfile, profileId),
  }));
  useShareCodes.setState((state) => ({
    myCodes: state.myCodes.filter((code) => code.profileId !== profileId),
    scannedCodes: state.scannedCodes.filter(
      (match) => match.profileId !== profileId
    ),
  }));
  useProfilesStore.getState().deleteProfile(profileId);
}

export async function resetAppOnDevice(): Promise<void> {
  useProfilesStore.setState({
    profiles: [],
    activeProfileId: null,
    currentUserId: null,
    hydrated: true,
  });
  useVotesStore.setState({ votesByProfile: {} });
  disconnectRemotePartnerLocal();
  useVoteSyncStore.getState().reset();
  useSettingsStore.setState({
    language: 'en',
    biometricLockEnabled: false,
    hapticsEnabled: true,
    discreteModeEnabled: true,
    drinkingMode: false,
  });
  useSettings.setState({ ageConfirmed: false, language: 'en' });
  useLoveLanguagesStore.setState({ results: {}, isHydrated: true });
  useCustomGameCardsStore.setState({ cards: [] });
  useLevelingStore.setState({
    xp: 0,
    totalXP: 0,
    level: 1,
    showLevelUp: false,
  });
  useNudgesStore.setState({ nudges: [], unreadCount: 0 });
  useScreenToursStore.setState({ dismissedTourScreens: {} });
  useCoupleDiceStore.setState({ savedByProfileId: {} });
  useFantasyJournalStore.setState({ entries: {} });
  useMatchMissionsStore.setState({ byProfileId: {}, draftByProfileId: {} });
  useMatchPlansStore.setState({ plansByKinkId: {} });
  useStarterPackStore.setState({ dismissedByProfile: {} });
  useShareCodes.setState({ myCodes: [], scannedCodes: [] });
  useViewedMatchesStore.setState({ viewedIds: {} });
  useConversationStore.setState({
    favorites: [],
    history: [],
    dateNightSettings: {
      timerEnabled: true,
      timerMinutes: 5,
      includeSpicy: true,
      backgroundTheme: 'romantic',
    },
    dailyNotificationsEnabled: false,
    lastDailyPromptDate: null,
    stats: {
      totalViewed: 0,
      totalFavorites: 0,
      categoriesExplored: [],
      streakDays: 0,
      lastUsedDate: null,
    },
  });
  useStreakStore.setState({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    daysActive: [],
    activitiesCompleted: [],
    categoriesCompleted: {},
    matchCount: 0,
    gameModesPlayed: [],
    diceRollCount: 0,
    missionsCompleted: 0,
    knowMeBetterMatches: 0,
    unlockedAchievements: [],
    backfillVersion: 0,
  });
  useAchievementsStore.setState({ achievements: [], totalUnlocked: 0 });
  await clearIdentity();
  await resetAllLocalNotifications();
  const storedKeys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(
    storedKeys.filter((key) => key !== PREMIUM_STORAGE_KEY)
  );
}
