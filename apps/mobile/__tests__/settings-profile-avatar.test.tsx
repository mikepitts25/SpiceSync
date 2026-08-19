import React from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

import SettingsScreen from '../app/(settings)';
import ProfileAvatarIcon from '../components/ProfileAvatarIcon';
import { useProfilesStore } from '../lib/state/profiles';
import { useSettingsStore } from '../src/stores/settingsStore';

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
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
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../lib/lock', () => ({
  authenticateWithBiometrics: jest.fn(),
  getBiometricSupport: jest.fn(),
}));

describe('settings profile avatar', () => {
  let tree: TestRenderer.ReactTestRenderer | undefined;

  afterEach(() => {
    if (tree) {
      TestRenderer.act(() => tree?.unmount());
      tree = undefined;
    }
  });

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
    TestRenderer.act(() => {
      tree = TestRenderer.create(<SettingsScreen />);
    });

    const profileAvatars = tree!.root.findAllByType(ProfileAvatarIcon);

    expect(profileAvatars).toHaveLength(1);
    expect(profileAvatars[0].props.avatar).toBe('chastity-cage');
  });

  it('renders every settings row in Spanish when Spanish is active', () => {
    TestRenderer.act(() => {
      useSettingsStore.setState({ language: 'es' });
    });

    TestRenderer.act(() => {
      tree = TestRenderer.create(<SettingsScreen />);
    });

    const visibleCopy = tree!.root
      .findAllByType(Text)
      .flatMap((node) => node.props.children)
      .filter((child): child is string => typeof child === 'string');

    for (const expected of [
      'Comentarios hápticos',
      'Desactivadas',
      'Modo discreto',
      'Privacidad y seguridad',
      'Controles de datos',
      'Configurar PIN',
      'Versión de la app',
    ]) {
      expect(visibleCopy).toContain(expected);
    }
    expect(visibleCopy).not.toEqual(
      expect.arrayContaining([
        'Haptic Feedback',
        'Discrete Mode',
        'Privacy & Safety',
        'Set PIN',
        'App Version',
      ])
    );
  });
});
