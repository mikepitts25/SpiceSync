import { useProfilesStore } from '../lib/state/profiles';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useEventQueueStore } from '../lib/sync/eventQueue';
import { _resetCacheForTests, setIdentityDeps } from '../lib/sync/identity';
import { usePartnerVotesStore } from '../lib/sync/partnerVotes';
import { useRevealConsentStore } from '../lib/sync/revealConsent';
import { useVoteSyncStore } from '../lib/sync/voteSync';
import {
  clearActiveProfileVotes,
  deleteProfileAndData,
  disconnectRemotePartnerLocal,
  resetAppOnDevice,
} from '../lib/safety/localDataControls';
import { useSettings } from '../lib/state/useStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useVotesStore } from '../src/stores/votes';
import { useLoveLanguagesStore } from '../src/stores/loveLanguages';
import { useCoupleDiceStore } from '../lib/state/coupleDice';
import { useFantasyJournalStore } from '../lib/state/fantasyJournal';
import { useStarterPackStore } from '../lib/state/starterPack';
import { useCustomGameCardsStore } from '../src/stores/customGameCards';
import { useLevelingStore } from '../src/stores/leveling';
import { useNudgesStore } from '../src/stores/nudges';
import { PREMIUM_STORAGE_KEY, usePremiumStore } from '../src/stores/premium';

function memoryIdentityDeps() {
  const secure = new Map<string, string>();
  const async = new Map<string, string>();
  return {
    secureStore: {
      getItemAsync: async (key: string) => secure.get(key) ?? null,
      setItemAsync: async (key: string, value: string) => {
        secure.set(key, value);
      },
      deleteItemAsync: async (key: string) => {
        secure.delete(key);
      },
    },
    asyncStorage: {
      getItem: async (key: string) => async.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        async.set(key, value);
      },
      removeItem: async (key: string) => {
        async.delete(key);
      },
    },
  };
}

beforeEach(() => {
  useProfilesStore.setState({
    profiles: [],
    activeProfileId: null,
    currentUserId: null,
    hydrated: true,
  });
  useVotesStore.setState({ votesByProfile: {} });
  useCoupleLinkStore.setState({ link: null });
  usePartnerVotesStore.setState({ byCardId: {}, answeredCount: 0 });
  useRevealConsentStore.setState({ local: {}, partner: {} });
  useEventQueueStore.setState({ pending: [], nextClientSequence: 1 });
  useVoteSyncStore.setState({ localProfileId: null });
  useSettingsStore.setState({
    language: 'en',
  });
  useSettings.setState({ ageConfirmed: true });
  useLoveLanguagesStore.setState({ results: {} });
  useCoupleDiceStore.setState({ savedByProfileId: {} });
  useFantasyJournalStore.setState({ entries: {} });
  useStarterPackStore.setState({ dismissedByProfile: {} });
  useCustomGameCardsStore.setState({ cards: [] });
  useLevelingStore.setState({
    xp: 0,
    totalXP: 0,
    level: 1,
    showLevelUp: false,
  });
  useNudgesStore.setState({ nudges: [], unreadCount: 0 });
  usePremiumStore.getState().clearStoreEntitlement();
  setIdentityDeps(memoryIdentityDeps());
  _resetCacheForTests();
});

describe('local safety data controls', () => {
  it('clears votes for the active profile only', () => {
    useProfilesStore.setState({
      profiles: [
        {
          id: 'profile-a',
          name: 'A',
          displayName: 'A',
          emoji: '🌶️',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeProfileId: 'profile-a',
      currentUserId: 'profile-a',
      hydrated: true,
    });
    useVotesStore.setState({
      votesByProfile: {
        'profile-a': { 'card-1': 'yes' },
        'profile-b': { 'card-2': 'maybe' },
      },
    });

    expect(clearActiveProfileVotes()).toBe(true);
    expect(useVotesStore.getState().votesByProfile).toEqual({
      'profile-b': { 'card-2': 'maybe' },
    });
  });

  it('disconnects the remote partner local state', () => {
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-1',
        myDeviceId: 'dev-a',
        partnerDeviceId: 'dev-b',
        partnerSigningPublicKey: 'sign',
        partnerEncryptionPublicKey: 'enc',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        status: 'active',
      },
    });
    usePartnerVotesStore.setState({
      byCardId: {
        'card-1': {
          cardId: 'card-1',
          vote: 'yes',
          updatedAt: 2,
          receivedAt: 3,
        },
      },
      answeredCount: 1,
    });
    useRevealConsentStore.setState({
      local: { mutualMaybe: 1 },
      partner: { mutualMaybe: 2 },
    });
    useEventQueueStore.setState({
      pending: [
        {
          eventId: 'evt-1',
          clientSequence: 1,
          payload: {
            schemaVersion: 1,
            eventType: 'couple.unlink',
            eventId: 'evt-1',
            authorDeviceId: 'dev-a',
            updatedAt: 1,
          },
          createdAt: 1,
          attempts: 0,
          nextAttemptAt: 1,
        },
      ],
      nextClientSequence: 2,
    });

    disconnectRemotePartnerLocal();

    expect(useCoupleLinkStore.getState().link).toBeNull();
    expect(usePartnerVotesStore.getState()).toMatchObject({
      byCardId: {},
      answeredCount: 0,
    });
    expect(useRevealConsentStore.getState()).toMatchObject({
      local: {},
      partner: {},
    });
    expect(useEventQueueStore.getState()).toMatchObject({
      pending: [],
      nextClientSequence: 1,
    });
  });

  it('deletes the selected profile and its private profile-scoped data only', () => {
    const profiles = [
      {
        id: 'profile-a',
        name: 'A',
        displayName: 'A',
        emoji: 'fire',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'profile-b',
        name: 'B',
        displayName: 'B',
        emoji: 'heart',
        createdAt: 2,
        updatedAt: 2,
      },
    ];
    useProfilesStore.setState({
      profiles,
      activeProfileId: 'profile-a',
      currentUserId: 'profile-a',
      hydrated: true,
    });
    useVotesStore.setState({
      votesByProfile: {
        'profile-a': { 'card-a': 'yes' },
        'profile-b': { 'card-b': 'maybe' },
      },
    });
    useLoveLanguagesStore.setState({
      results: {
        'profile-a': {
          profileId: 'profile-a',
          result: {} as never,
          completedAt: 1,
        },
        'profile-b': {
          profileId: 'profile-b',
          result: {} as never,
          completedAt: 2,
        },
      },
    });
    useCoupleDiceStore.setState({
      savedByProfileId: {
        'profile-a': [{ id: 'a', savedAt: 1 } as never],
        'profile-b': [{ id: 'b', savedAt: 2 } as never],
      },
    });
    useFantasyJournalStore.setState({
      entries: {
        a: { id: 'a', profileId: 'profile-a' } as never,
        b: { id: 'b', profileId: 'profile-b' } as never,
      },
    });
    useStarterPackStore.setState({
      dismissedByProfile: { 'profile-a': true, 'profile-b': true },
    });

    deleteProfileAndData('profile-a');

    expect(
      useProfilesStore.getState().profiles.map((profile) => profile.id)
    ).toEqual(['profile-b']);
    expect(useVotesStore.getState().votesByProfile).toEqual({
      'profile-b': { 'card-b': 'maybe' },
    });
    expect(Object.keys(useLoveLanguagesStore.getState().results)).toEqual([
      'profile-b',
    ]);
    expect(Object.keys(useCoupleDiceStore.getState().savedByProfileId)).toEqual(
      ['profile-b']
    );
    expect(Object.keys(useFantasyJournalStore.getState().entries)).toEqual([
      'b',
    ]);
    expect(useStarterPackStore.getState().dismissedByProfile).toEqual({
      'profile-b': true,
    });
  });

  it('resets app data on this device', async () => {
    useProfilesStore.setState({
      profiles: [
        {
          id: 'profile-a',
          name: 'A',
          displayName: 'A',
          emoji: '🌶️',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeProfileId: 'profile-a',
      currentUserId: 'profile-a',
      hydrated: true,
    });
    useVotesStore.setState({
      votesByProfile: { 'profile-a': { 'card-1': 'yes' } },
    });
    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-1',
        myDeviceId: 'dev-a',
        partnerDeviceId: 'dev-b',
        partnerSigningPublicKey: 'sign',
        partnerEncryptionPublicKey: 'enc',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        status: 'active',
      },
    });
    useVoteSyncStore.setState({ localProfileId: 'profile-a' });
    useSettingsStore.setState({
      language: 'es',
      biometricLockEnabled: true,
      hapticsEnabled: false,
      discreteModeEnabled: false,
      drinkingMode: true,
    });
    useSettings.setState({ ageConfirmed: true });
    useCustomGameCardsStore.setState({
      cards: [{ id: 'custom-1', content: 'private card' } as never],
    });
    useLevelingStore.setState({ xp: 42, totalXP: 99, level: 3 });
    useNudgesStore.setState({
      nudges: [{ id: 'nudge-1' } as never],
      unreadCount: 1,
    });
    usePremiumStore
      .getState()
      .setLifetimeEntitlement('signed-store-token', 1720000000000);
    await AsyncStorage.setItem('temporary-private-data', 'remove me');

    await resetAppOnDevice();

    expect(useProfilesStore.getState()).toMatchObject({
      profiles: [],
      activeProfileId: null,
      currentUserId: null,
      hydrated: true,
    });
    expect(useVotesStore.getState().votesByProfile).toEqual({});
    expect(useCoupleLinkStore.getState().link).toBeNull();
    expect(useVoteSyncStore.getState().localProfileId).toBeNull();
    expect(useSettingsStore.getState()).toMatchObject({
      language: 'en',
      biometricLockEnabled: false,
      hapticsEnabled: true,
      discreteModeEnabled: true,
      drinkingMode: false,
    });
    expect(useSettings.getState().ageConfirmed).toBe(false);
    expect(useCustomGameCardsStore.getState().cards).toEqual([]);
    expect(useLevelingStore.getState()).toMatchObject({
      xp: 0,
      totalXP: 0,
      level: 1,
    });
    expect(useNudgesStore.getState()).toMatchObject({
      nudges: [],
      unreadCount: 0,
    });
    expect(usePremiumStore.getState().isPremium()).toBe(true);
    expect(await AsyncStorage.getItem(PREMIUM_STORAGE_KEY)).not.toBeNull();
    expect(await AsyncStorage.getItem('temporary-private-data')).toBeNull();
  });
});
import AsyncStorage from '@react-native-async-storage/async-storage';
