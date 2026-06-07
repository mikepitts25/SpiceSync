import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import TestRenderer from 'react-test-renderer';
import { Check } from 'lucide-react-native';

import { COLORS } from '../constants/theme';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

const {
  MatchFilters,
  MatchScreenContent,
  MatchSection,
} = require('../app/(matches)/MatchesScreen');

const defaultProps = {
  visibility: 'all' as const,
  onVisibilityChange: jest.fn(),
  category: 'all',
  categories: ['all', 'Touch'],
  onCategoryChange: jest.fn(),
  intensity: 'all' as const,
  onIntensityChange: jest.fn(),
  role: 'all' as const,
  onRoleChange: jest.fn(),
};

describe('MatchFilters collapse behavior', () => {
  it('uses a clear show/hide control and displays categories without horizontal scrolling', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(<MatchFilters {...defaultProps} />);
    });

    expect(tree!.root.findAllByType(ScrollView)).toHaveLength(0);
    expect(
      tree!.root
        .findAllByType(Text)
        .filter((node) => node.props.children === 'Show filters')
    ).toHaveLength(1);

    const toggle = tree!.root.find(
      (node) => node.props.accessibilityLabel === 'Filter matches'
    );

    expect(toggle).toBeDefined();

    TestRenderer.act(() => {
      toggle!.props.onPress();
    });

    expect(
      tree!.root
        .findAllByType(Text)
        .filter((node) => node.props.children === 'Hide filters')
    ).toHaveLength(1);
    expect(tree!.root.findAllByType(ScrollView)).toHaveLength(3);
    expect(
      tree!.root.findAll(
        (node) =>
          node.type === View &&
          node.props.accessibilityLabel === 'Category filters'
      )
    ).toHaveLength(1);
  });

  it('makes filter section titles distinct from the smaller filter options', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(<MatchFilters {...defaultProps} />);
    });

    const toggle = tree!.root.find(
      (node) => node.props.accessibilityLabel === 'Filter matches'
    );

    TestRenderer.act(() => {
      toggle!.props.onPress();
    });

    const groupLabelStyle = StyleSheet.flatten(
      tree!.root.findByProps({ children: 'Result' }).props.style
    );
    const chipStyle = StyleSheet.flatten(
      tree!.root.findByProps({ children: 'Unseen' }).props.style
    );
    const toggleTextStyle = StyleSheet.flatten(
      tree!.root.findByProps({ children: 'Hide filters' }).props.style
    );

    expect(groupLabelStyle).toMatchObject({
      color: COLORS.pink,
      fontSize: 15,
    });
    expect(chipStyle).toMatchObject({
      color: COLORS.textSub,
      fontSize: 15,
    });
    expect(toggleTextStyle).toMatchObject({
      fontSize: 15,
    });
  });
});

describe('MatchSection compact match rows', () => {
  it('renders scannable badge rows instead of metadata-heavy text rows', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <MatchSection
          tone="yes"
          icon={Check}
          title="MUTUAL YES"
          rows={[
            {
              id: 'restraints',
              title: 'Silk restraints',
              category: 'Touch',
              intensityScale: 2,
              tags: [],
              pairMode: true,
              myVote: 'yes',
              partnerVote: 'yes',
              myPairPreference: 'give',
              partnerPairPreference: 'receive',
            },
          ]}
          emptyTitle="No matches"
          emptySubtitle="Keep swiping"
          onSelect={jest.fn()}
        />
      );
    });

    expect(tree!.root.findByProps({ children: 'L2' })).toBeDefined();
    expect(tree!.root.findByProps({ children: 'Touch' })).toBeDefined();
    expect(tree!.root.findByProps({ children: 'You: Yes' })).toBeDefined();
    expect(tree!.root.findByProps({ children: 'Partner: Yes' })).toBeDefined();

    const rowStyle = StyleSheet.flatten(
      tree!.root.find(
        (node) =>
          node.type === View &&
          node.props.accessibilityLabel === 'Compact match summary'
      ).props.style
    );

    expect(rowStyle).toMatchObject({
      alignItems: 'stretch',
      minHeight: 44,
    });
  });
});

describe('MatchScreenContent selection mode', () => {
  it('shows only match details while a match is selected', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <MatchScreenContent
          selectedDetail={<Text>Selected match details</Text>}
        >
          <Text>Filter matches</Text>
          <Text>Other matches</Text>
          <Text>Share results</Text>
        </MatchScreenContent>
      );
    });

    const renderedText = tree!.root
      .findAllByType(Text)
      .map((node) => node.props.children);

    expect(renderedText).toContain('Selected match details');
    expect(renderedText).not.toContain('Filter matches');
    expect(renderedText).not.toContain('Other matches');
    expect(renderedText).not.toContain('Share results');
  });
});
