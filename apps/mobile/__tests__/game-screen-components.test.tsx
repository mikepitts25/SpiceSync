import React from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import TestRenderer from 'react-test-renderer';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

const {
  GAME_CONTROL_MIN_SIZE,
  GameButton,
  GameSegmentedControl,
} = require('../components/game/GameControls');

function flattenedPressableStyle(node: TestRenderer.ReactTestInstance) {
  const value =
    typeof node.props.style === 'function'
      ? node.props.style({ pressed: false })
      : node.props.style;
  return StyleSheet.flatten(value);
}

describe('game-screen presentation components', () => {
  it('keeps buttons and segmented options at least 44 points tall', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <>
          <GameButton label="Start Game" onPress={jest.fn()} />
          <GameSegmentedControl
            accessibilityLabel="Card language"
            value="en"
            options={[
              { value: 'en', label: 'EN' },
              { value: 'es', label: 'ES' },
            ]}
            onChange={jest.fn()}
          />
        </>
      );
    });

    const controls = tree!.root.findAllByType(Pressable);
    expect(GAME_CONTROL_MIN_SIZE).toBe(44);
    controls.forEach((control) => {
      expect(flattenedPressableStyle(control).minHeight).toBeGreaterThanOrEqual(
        GAME_CONTROL_MIN_SIZE
      );
    });
  });

  it('reports selected state and forwards segmented changes', () => {
    const onChange = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <GameSegmentedControl
          accessibilityLabel="Card language"
          value="en"
          options={[
            { value: 'en', label: 'EN' },
            { value: 'es', label: 'ES' },
          ]}
          onChange={onChange}
        />
      );
    });

    const spanish = tree!.root.find(
      (node) => node.props.accessibilityLabel === 'Card language: ES'
    );
    expect(spanish.props.accessibilityState).toEqual({ selected: false });
    TestRenderer.act(() => spanish.props.onPress());
    expect(onChange).toHaveBeenCalledWith('es');
  });
});
