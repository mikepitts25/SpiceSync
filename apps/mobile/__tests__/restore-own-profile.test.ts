import { useProfilesStore } from '../lib/state/profiles';
import { restoreOwnProfileFromCouple } from '../lib/sync/restoreOwnProfile';
import type { CoupleResponse } from '../lib/sync/relayTypes';

function couple(overrides: Partial<CoupleResponse> = {}): CoupleResponse {
  return {
    coupleId: 'couple-1',
    memberADeviceId: 'dev_me',
    memberBDeviceId: 'dev_partner',
    memberAPublicKey: 'my-enc',
    memberBPublicKey: 'partner-enc',
    memberASigningPublicKey: 'my-sign',
    memberBSigningPublicKey: 'partner-sign',
    memberAProfileName: 'Alex',
    memberBProfileName: 'Sam',
    memberAProfileAvatar: 'flame',
    memberBProfileAvatar: 'peach',
    createdAt: 1700,
    revokedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  useProfilesStore.setState({
    profiles: [],
    activeProfileId: null,
    currentUserId: null,
    hydrated: true,
  });
});

describe('restoring your own profile on account recovery', () => {
  it('restores the name and avatar so restore does not re-ask for them', async () => {
    const restored = await restoreOwnProfileFromCouple(couple(), 'dev_me');

    expect(restored).toBe(true);
    const profiles = useProfilesStore.getState().getProfiles();
    expect(profiles).toHaveLength(1);
    // Member A's identity, not the partner's.
    expect(profiles[0].name).toBe('Alex');
    expect(profiles[0].emoji).toBe('flame');
  });

  it('restores the correct half when this device is member B', async () => {
    const restored = await restoreOwnProfileFromCouple(couple(), 'dev_partner');

    expect(restored).toBe(true);
    const profile = useProfilesStore.getState().getProfiles()[0];
    expect(profile.name).toBe('Sam');
    expect(profile.emoji).toBe('peach');
  });

  it('makes the profile active so recovery routes past profile creation', async () => {
    await restoreOwnProfileFromCouple(couple(), 'dev_me');

    const state = useProfilesStore.getState();
    expect(state.getProfiles().length).toBeGreaterThan(0);
    expect(state.getActiveProfileId()).toBe(state.getProfiles()[0].id);
  });

  it('never carries a PIN, which is not uploaded and must be re-set', async () => {
    await restoreOwnProfileFromCouple(couple(), 'dev_me');

    expect(useProfilesStore.getState().getProfiles()[0].pin).toBeUndefined();
  });

  it('does not add a duplicate beside an existing local profile', async () => {
    useProfilesStore.setState({
      profiles: [
        {
          id: 'existing',
          name: 'Existing',
          displayName: 'Existing',
          emoji: 'flame',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeProfileId: 'existing',
      currentUserId: 'existing',
      hydrated: true,
    });

    const restored = await restoreOwnProfileFromCouple(couple(), 'dev_me');

    expect(restored).toBe(false);
    expect(useProfilesStore.getState().getProfiles()).toHaveLength(1);
  });

  it('falls back to profile creation when the couple carries no name', async () => {
    const restored = await restoreOwnProfileFromCouple(
      couple({ memberAProfileName: null }),
      'dev_me'
    );

    expect(restored).toBe(false);
    expect(useProfilesStore.getState().getProfiles()).toHaveLength(0);
  });

  it('normalizes an unrecognized avatar rather than failing the restore', async () => {
    const restored = await restoreOwnProfileFromCouple(
      couple({ memberAProfileAvatar: 'not-a-real-avatar' }),
      'dev_me'
    );

    // The name is the part worth keeping; an unknown avatar id from the relay
    // must not send the user back through creation.
    expect(restored).toBe(true);
    const profile = useProfilesStore.getState().getProfiles()[0];
    expect(profile.name).toBe('Alex');
    expect(profile.emoji).toBeTruthy();
  });

  it('ignores a couple this device is not a member of', async () => {
    const restored = await restoreOwnProfileFromCouple(couple(), 'dev_other');

    expect(restored).toBe(false);
    expect(useProfilesStore.getState().getProfiles()).toHaveLength(0);
  });
});
