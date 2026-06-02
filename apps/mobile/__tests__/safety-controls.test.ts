import { useProfilesStore } from '../lib/state/profiles';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useEventQueueStore } from '../lib/sync/eventQueue';
import { _resetCacheForTests, setIdentityDeps } from '../lib/sync/identity';
import { usePartnerVotesStore } from '../lib/sync/partnerVotes';
import { useRevealConsentStore } from '../lib/sync/revealConsent';
import { useVoteSyncStore } from '../lib/sync/voteSync';
import {
  clearActiveProfileVotes,
  disconnectRemotePartnerLocal,
  resetAppOnDevice,
} from '../lib/safety/localDataControls';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useVotesStore } from '../src/stores/votes';

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
    activeProfileId: null,
    profiles: [],
    ageVerified: true,
  });
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
      activeProfileId: 'legacy-profile',
      profiles: [
        {
          id: 'legacy-profile',
          name: 'Legacy',
          emoji: '🔥',
          createdAt: 1,
        },
      ],
      ageVerified: true,
    });

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
      activeProfileId: null,
      profiles: [],
      ageVerified: false,
    });
  });
});
