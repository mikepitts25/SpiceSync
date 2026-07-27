import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GameSurface } from './GameControls';
import { COLORS } from '../../constants/theme';
import type { MissionHistoryEntry } from '../../lib/matchMissions';

const OUTCOME_COLOR: Record<MissionHistoryEntry['status'], string> = {
  completed: COLORS.yes,
  skipped: COLORS.textMuted,
  expired: COLORS.maybe,
};

export function MatchMissionHistory({
  title,
  emptyLabel,
  entries,
  outcomeLabels,
}: {
  title: string;
  emptyLabel: string;
  entries: readonly MissionHistoryEntry[];
  outcomeLabels: Record<MissionHistoryEntry['status'], string>;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        entries.map((entry) => (
          <GameSurface key={entry.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {entry.title}
              </Text>
              <Text style={styles.rowDate}>
                {new Date(entry.resolvedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={[styles.outcome, { color: OUTCOME_COLOR[entry.status] }]}
            >
              {outcomeLabels[entry.status]}
            </Text>
          </GameSurface>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  empty: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  rowDate: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  outcome: {
    fontSize: 16,
    fontWeight: '800',
  },
});
