import React from 'react';
import TestRenderer from 'react-test-renderer';

import { MyVotesControls } from '../components/votes/MyVotesControls';

const counts = {
  all: 6,
  yes: 1,
  curious: 2,
  not_now: 1,
  hard_no: 1,
  legacy_no: 1,
};

describe('MyVotesControls', () => {
  it('starts collapsed and reveals vote filters and sorting on demand', () => {
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <MyVotesControls
          filter="all"
          sort="default"
          counts={counts}
          resultCount={6}
          onFilterChange={jest.fn()}
          onSortChange={jest.fn()}
        />
      );
    });

    const disclosure = tree!.root.findByProps({
      accessibilityLabel: 'Filter and sort votes',
    });
    expect(disclosure.props.accessibilityState).toEqual({ expanded: false });
    expect(
      tree!.root.findAllByProps({ accessibilityLabel: 'Filter votes: Not Now' })
    ).toHaveLength(0);

    TestRenderer.act(() => disclosure.props.onPress());

    expect(
      tree!.root.findByProps({ accessibilityLabel: 'Filter and sort votes' })
        .props.accessibilityState
    ).toEqual({ expanded: true });
    expect(
      tree!.root.findByProps({ accessibilityLabel: 'Filter votes: Not Now' })
    ).toBeDefined();
    expect(
      tree!.root.findByProps({
        accessibilityLabel: 'Sort votes: Intensity high to low',
      })
    ).toBeDefined();
  });

  it('reports filter and sort selections to the screen', () => {
    const onFilterChange = jest.fn();
    const onSortChange = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <MyVotesControls
          filter="all"
          sort="default"
          counts={counts}
          resultCount={6}
          onFilterChange={onFilterChange}
          onSortChange={onSortChange}
        />
      );
    });
    TestRenderer.act(() =>
      tree!.root
        .findByProps({ accessibilityLabel: 'Filter and sort votes' })
        .props.onPress()
    );

    TestRenderer.act(() =>
      tree!.root
        .findByProps({ accessibilityLabel: 'Filter votes: Not Now' })
        .props.onPress()
    );
    TestRenderer.act(() =>
      tree!.root
        .findByProps({ accessibilityLabel: 'Sort votes: A to Z' })
        .props.onPress()
    );

    expect(onFilterChange).toHaveBeenCalledWith('not_now');
    expect(onSortChange).toHaveBeenCalledWith('title');
  });
});
