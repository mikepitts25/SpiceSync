import React from 'react';
import { StyleSheet, Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

import LoveLanguagesQuizScreen from '../app/(settings)/love-languages';
import { useProfilesStore } from '../lib/state/profiles';
import { useLoveLanguagesStore } from '../src/stores/loveLanguages';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
  }),
}));

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

describe('Love Languages quiz readability', () => {
  beforeEach(() => {
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
    useLoveLanguagesStore.setState({ results: {} });
  });

  it('renders both answer labels at a comfortably readable size', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(<LoveLanguagesQuizScreen />);
    });

    const answerLabels = tree!.root
      .findAllByType(Text)
      .filter(
        (node) =>
          String(node.props.children).startsWith('I like to receive') ||
          String(node.props.children).startsWith('I like to be hugged')
      );

    expect(answerLabels).toHaveLength(2);
    for (const label of answerLabels) {
      expect(StyleSheet.flatten(label.props.style)).toMatchObject({
        fontSize: 18,
        lineHeight: 26,
      });
    }
  });
});
