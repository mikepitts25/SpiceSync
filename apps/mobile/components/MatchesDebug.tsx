import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { VoteBuckets, VoteValue } from '../src/stores/votes';

type Props = {
  activeId: string | null;
  partnerId: string | null;
  aVotes: Record<string, VoteValue>;
  bVotes: Record<string, VoteValue>;
  buckets: VoteBuckets;
  gateOpen: boolean;
};

const MatchesDebug: React.FC<Props> = ({
  activeId,
  partnerId,
  aVotes,
  bVotes,
  buckets,
  gateOpen,
}) => {
  if (!__DEV__) {
    return null;
  }

  const countKeys = (map: Record<string, unknown>) =>
    Object.keys(map ?? {}).length;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.text}>
        A: {activeId ?? '—'} | B: {partnerId ?? '—'} | gateOpen:{' '}
        {String(gateOpen)}
      </Text>
      <Text style={styles.text}>
        aVotes: {countKeys(aVotes)} | bVotes: {countKeys(bVotes)}
      </Text>
      <Text style={styles.text}>
        MY:{buckets.mutualYes.length} MN:{buckets.mutualNo.length} MM:
        {buckets.mutualMaybe.length} PY:{buckets.partialYes.length}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(2,6,23,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    gap: 2,
  },
  text: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MatchesDebug;
