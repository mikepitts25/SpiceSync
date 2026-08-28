import React from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

import { MatchSyncStatus } from '../components/matches/MatchSyncStatus';

const labels = {
  lastSynced: 'Last synced: {{time}}',
  neverSynced: 'Never',
  justNow: 'Just now',
  minutesAgo: '{{count}}m ago',
  hoursAgo: '{{count}}h ago',
  daysAgo: '{{count}}d ago',
  refreshMatches: 'Refresh matches',
  refreshingMatches: 'Refreshing…',
  syncStatusAccessibility: 'Partner vote sync status',
  syncSummary:
    '{{pending}} waiting to send • {{received}} partner responses synced',
  syncComplete: 'Refresh complete: {{uploaded}} sent • {{applied}} received',
  syncFailed: 'Could not reach partner sync. Try again.',
  syncPaused: 'Partner sync is paused. Open Partner Sync to resume.',
};

describe('MatchSyncStatus', () => {
  it('shows evidence of sent and received partner vote state and refreshes on demand', () => {
    const onRefresh = jest.fn();
    let tree: TestRenderer.ReactTestRenderer;

    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <MatchSyncStatus
          syncable
          lastSyncedAt={null}
          pendingCount={2}
          partnerResponseCount={7}
          refreshing={false}
          result={{ uploaded: 1, failed: 0, applied: 1 }}
          error={false}
          onRefresh={onRefresh}
          labels={labels}
        />
      );
    });

    const renderedText = tree!.root
      .findAllByType(Text)
      .map((node) => node.props.children);
    expect(renderedText).toContain('Last synced: Never');
    expect(renderedText).toContain(
      '2 waiting to send • 7 partner responses synced'
    );
    expect(renderedText).toContain('Refresh complete: 1 sent • 1 received');

    const refresh = tree!.root.findByProps({
      accessibilityLabel: 'Refresh matches',
    });
    TestRenderer.act(() => refresh.props.onPress());
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('disables refresh and explains when partner sync is paused', () => {
    let tree: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      tree = TestRenderer.create(
        <MatchSyncStatus
          syncable={false}
          lastSyncedAt={null}
          pendingCount={1}
          partnerResponseCount={0}
          refreshing={false}
          result={null}
          error={false}
          onRefresh={jest.fn()}
          labels={labels}
        />
      );
    });

    expect(
      tree!.root.findByProps({
        children: 'Partner sync is paused. Open Partner Sync to resume.',
      })
    ).toBeDefined();
    expect(
      tree!.root.findByProps({ accessibilityLabel: 'Refresh matches' }).props
        .disabled
    ).toBe(true);
  });
});
