import React from 'react';
import TestRenderer from 'react-test-renderer';

import ProfilesHubScreen from '../app/(tabs)/profiles';
import ProfileAvatarIcon from '../components/ProfileAvatarIcon';
import { useProfilesStore } from '../lib/state/profiles';
import { useCoupleLinkStore } from '../lib/sync/coupleLink';
import { useVotesStore } from '../src/stores/votes';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    navigate: jest.fn(),
  }),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('Profiles hub avatar sizing', () => {
  beforeEach(() => {
    useProfilesStore.setState({
      profiles: [
        {
          id: 'profile-1',
          name: 'Mike',
          displayName: 'Mike',
          emoji: 'flame',
          createdAt: 1,
          updatedAt: 1,
          color: '#FF2D92',
        },
        {
          id: 'profile-2',
          name: 'Sam',
          displayName: 'Sam',
          emoji: 'cherries',
          createdAt: 2,
          updatedAt: 2,
          color: '#8B5CF6',
        },
      ],
      activeProfileId: 'profile-1',
      currentUserId: 'profile-1',
      hydrated: true,
    });

    useVotesStore.setState({
      votesByProfile: {
        'profile-1': {
          kinkA: 'yes',
          kinkB: 'maybe',
        },
      },
    });

    useCoupleLinkStore.setState({
      link: {
        coupleId: 'couple-1',
        myDeviceId: 'device-a',
        partnerDeviceId: 'device-b',
        partnerSigningPublicKey: 'signing-key',
        partnerEncryptionPublicKey: 'encryption-key',
        partnerProfileName: 'Remote partner',
        partnerProfileAvatar: 'rose',
        linkedAt: 1,
        lastPulledServerSequence: 0,
        lastSyncedAt: null,
        status: 'active',
      },
    });
  });

  it('renders playful, prominent profile icons on the Profiles screen', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<ProfilesHubScreen />);
    });

    const avatarSizes = tree!.root
      .findAllByType(ProfileAvatarIcon)
      .map((avatar) => avatar.props.size);

    expect(avatarSizes).toEqual([76, 68, 58, 52, 52]);
  });
});
