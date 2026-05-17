import React from 'react';
import TestRenderer from 'react-test-renderer';

import SettingsScreen from '../app/(settings)';
import ProfileAvatarIcon from '../components/ProfileAvatarIcon';
import { useProfilesStore } from '../lib/state/profiles';
import { useSettingsStore } from '../src/stores/settingsStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
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
}));

jest.mock('../lib/lock', () => ({
  authenticateWithBiometrics: jest.fn(),
  getBiometricSupport: jest.fn(),
}));

describe('settings profile avatar', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      language: 'en',
      biometricLockEnabled: false,
    });

    useProfilesStore.setState({
      profiles: [
        {
          id: 'profile-1',
          name: 'Mike',
          displayName: 'Mike',
          emoji: 'chastity-cage',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeProfileId: 'profile-1',
      currentUserId: 'profile-1',
      hydrated: true,
    });
  });

  it('renders the active profile avatar as an image-backed profile icon', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<SettingsScreen />);
    });

    const profileAvatars = tree!.root.findAllByType(ProfileAvatarIcon);

    expect(profileAvatars).toHaveLength(1);
    expect(profileAvatars[0].props.avatar).toBe('chastity-cage');
  });
});
