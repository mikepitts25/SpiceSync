import React from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

import LanguageScreen from '../app/(settings)/language';
import { useSettingsStore } from '../src/stores/settingsStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: React.PropsWithChildren) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('language settings', () => {
  let tree: TestRenderer.ReactTestRenderer | undefined;

  beforeEach(() => {
    useSettingsStore.setState({ language: 'en' });
  });

  afterEach(() => {
    if (tree) {
      TestRenderer.act(() => tree?.unmount());
      tree = undefined;
    }
  });

  it('renders each language as a single text-only choice', () => {
    TestRenderer.act(() => {
      tree = TestRenderer.create(<LanguageScreen />);
    });

    const visibleCopy = tree!.root
      .findAllByType(Text)
      .flatMap((node) => node.props.children)
      .filter((child): child is string => typeof child === 'string');

    expect(visibleCopy).toEqual(['Language', 'English', 'Español']);
  });
});
