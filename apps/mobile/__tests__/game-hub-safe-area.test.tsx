import React from 'react';
import { StyleSheet, View } from 'react-native';
import TestRenderer from 'react-test-renderer';

import GameHub from '../app/(game)';
import { COLORS } from '../constants/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({
    children,
    ...props
  }: React.ComponentProps<typeof View>) => {
    const { View: NativeView } = require('react-native');
    return <NativeView {...props}>{children}</NativeView>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, right: 0, bottom: 34, left: 0 }),
}));

describe('Game hub safe area', () => {
  it('keeps the bottom navigation above the device safe area', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(<GameHub />);
    });

    const screen = tree!.root.findAllByType(View).find((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.flex === 1 && style?.backgroundColor === COLORS.bg;
    });

    expect(screen).toBeDefined();
    expect(StyleSheet.flatten(screen!.props.style)).toMatchObject({
      paddingBottom: 34,
    });
  });
});
