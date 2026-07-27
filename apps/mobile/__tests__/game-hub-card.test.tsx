import React from 'react';
import TestRenderer from 'react-test-renderer';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn() }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

import { GameHubCard } from '../components/game/GameHubCard';

describe('GameHubCard', () => {
  it('makes an available card actionable', () => {
    const onPress = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <GameHubCard
          title="Spice Deck"
          description="Draw a card"
          icon="layers"
          available
          statusLabel="Play now"
          onPress={onPress}
        />
      );
    });

    const card = tree!.root.findByProps({
      accessibilityLabel: 'Play Spice Deck',
    });
    expect(card.props.accessibilityRole).toBe('button');
    TestRenderer.act(() => card.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('makes an unavailable card non-actionable', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <GameHubCard
          title="Couple Dice"
          description="Quick prompts"
          icon="dices"
          available={false}
          statusLabel="Coming soon"
        />
      );
    });

    const card = tree!.root.findByProps({
      accessibilityLabel: 'Couple Dice: Coming soon',
    });
    expect(card.props.accessibilityState).toEqual({ disabled: true });
    expect(card.props.onPress).toBeUndefined();
  });
});
