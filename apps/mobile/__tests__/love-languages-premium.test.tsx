import React from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

import LoveLanguagesHubScreen from '../app/(conversation)/love-languages';
import PremiumLoveLanguagesQuizScreen from '../app/(settings)/love-languages';
import { useProfilesStore } from '../lib/state/profiles';
import { useLoveLanguagesStore } from '../src/stores/loveLanguages';
import { usePremiumStore } from '../src/stores/premium';
import { useSettingsStore } from '../src/stores/settingsStore';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../components/app-chrome', () => {
  const { View } = require('react-native');

  return {
    AppHeader: () => <View />,
    CardAccentTop: () => <View />,
  };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: { View },
    FadeInLeft: {},
    FadeInRight: {},
    FadeInUp: {},
  };
});

describe('Love Languages quiz premium access', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    process.env.EXPO_PUBLIC_PURCHASES_ENABLED = 'true';
    process.env.EXPO_PUBLIC_FREE_BETA_ACCESS = 'false';
    usePremiumStore.getState().clearStoreEntitlement();
    useLoveLanguagesStore.setState({ results: {}, isHydrated: true });
    useSettingsStore.setState({ language: 'en' });
    useProfilesStore.setState({
      profiles: [
        {
          id: 'profile-1',
          name: 'Pamela',
          displayName: 'Pamela',
          emoji: 'flame',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeProfileId: 'profile-1',
      currentUserId: 'profile-1',
      hydrated: true,
    });
  });

  it('redirects free users before rendering any quiz questions', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(<PremiumLoveLanguagesQuizScreen />);
    });

    expect(mockReplace).toHaveBeenCalledWith('/(unlock)');
    expect(
      tree!.root
        .findAllByType(Text)
        .some((node) => node.props.children === 'Which would you prefer?')
    ).toBe(false);
  });

  it('sends free users from the quiz CTA to the premium unlock screen', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(<LoveLanguagesHubScreen />);
    });

    TestRenderer.act(() => {
      tree!.root
        .findByProps({ accessibilityLabel: 'Take quiz' })
        .props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith('/(unlock)');
  });
});
