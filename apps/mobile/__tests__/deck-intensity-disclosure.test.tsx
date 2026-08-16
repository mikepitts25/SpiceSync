import React from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

import { IntensityFilterDisclosure } from '../components/deck/IntensityFilterDisclosure';

describe('IntensityFilterDisclosure', () => {
  it('starts collapsed and reveals its options when pressed', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <IntensityFilterDisclosure title="INTENSITY" selectedLabel="All">
          <Text>Soft Kinks</Text>
        </IntensityFilterDisclosure>
      );
    });

    const disclosure = tree!.root.findByProps({
      accessibilityLabel: 'INTENSITY: All',
    });
    expect(disclosure.props.accessibilityState).toEqual({ expanded: false });
    expect(tree!.root.findAllByProps({ children: 'Soft Kinks' })).toHaveLength(
      0
    );

    TestRenderer.act(() => disclosure.props.onPress());

    expect(
      tree!.root.findByProps({ accessibilityLabel: 'INTENSITY: All' }).props
        .accessibilityState
    ).toEqual({ expanded: true });
    expect(tree!.root.findByProps({ children: 'Soft Kinks' })).toBeDefined();
  });
});
