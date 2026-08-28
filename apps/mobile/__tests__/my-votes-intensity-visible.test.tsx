import React from 'react';
import TestRenderer from 'react-test-renderer';

import MyVotesScreen from '../app/(settings)/my-votes';
import { useProfilesStore } from '../lib/state/profiles';
import { useVotesStore } from '../src/stores/votes';
import { getKinks } from '../lib/data';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: React.PropsWithChildren) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('../components/app-chrome', () => ({
  BackHeader: () => null,
}));

/**
 * Sorting by intensity reorders the list, but the rows used to show only
 * category, title, and vote — so a correctly sorted list looked identical to
 * an unsorted one and read as a broken filter. These assert the level is
 * actually on screen.
 */
describe('my votes rows expose intensity', () => {
  beforeEach(() => {
    const { kinks } = getKinks('en');
    const sample = kinks.slice(0, 12);

    useProfilesStore.setState({
      profiles: [
        {
          id: 'p1',
          name: 'Tester',
          displayName: 'Tester',
          emoji: 'flame',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      activeProfileId: 'p1',
      currentUserId: 'p1',
      hydrated: true,
    });
    useVotesStore.setState({
      votesByProfile: {
        p1: Object.fromEntries(sample.map((k) => [k.id, 'yes' as const])),
      },
    });
  });

  it('renders the intensity level on each vote row', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<MyVotesScreen />);
    });

    const levelNodes = tree!.root
      .findAllByType(require('react-native').Text)
      .filter((node) => {
        const children = node.props.children;
        return Array.isArray(children) && children[0] === 'LVL';
      });

    expect(levelNodes.length).toBeGreaterThan(0);
  });

  it('names the level in the row accessibility label', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<MyVotesScreen />);
    });

    const labelled = tree!.root
      .findAll(
        (node) =>
          typeof node.props?.accessibilityLabel === 'string' &&
          node.props.accessibilityLabel.includes('level')
      )
      .map((node) => node.props.accessibilityLabel as string);

    expect(labelled.length).toBeGreaterThan(0);
    expect(labelled[0]).toMatch(/level \d/);
  });
});
