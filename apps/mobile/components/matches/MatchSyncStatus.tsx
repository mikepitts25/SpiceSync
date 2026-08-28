import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RefreshCcw } from 'lucide-react-native';

import { COLORS } from '../../constants/theme';
import { interpolate } from '../../lib/i18n';
import type { SyncResult } from '../../lib/sync/syncLoop';

export type MatchSyncLabels = {
  lastSynced: string;
  neverSynced: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  refreshMatches: string;
  refreshingMatches: string;
  syncStatusAccessibility: string;
  syncSummary: string;
  syncComplete: string;
  syncFailed: string;
  syncWaiting: string;
  syncRejected: string;
  syncPaused: string;
};

type MatchSyncStatusProps = {
  syncable: boolean;
  lastSyncedAt: number | null;
  pendingCount: number;
  partnerResponseCount: number;
  refreshing: boolean;
  result: SyncResult | null;
  error: boolean;
  onRefresh: () => void;
  labels: MatchSyncLabels;
};

export function formatMatchSyncTime(
  timestamp: number | null,
  labels: MatchSyncLabels,
  now: number = Date.now()
): string {
  if (!timestamp) return labels.neverSynced;
  const minutes = Math.floor(Math.max(0, now - timestamp) / 60_000);
  if (minutes < 1) return labels.justNow;
  if (minutes < 60) {
    return interpolate(labels.minutesAgo, { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return interpolate(labels.hoursAgo, { count: hours });
  }
  return interpolate(labels.daysAgo, { count: Math.floor(hours / 24) });
}

export function MatchSyncStatus({
  syncable,
  lastSyncedAt,
  pendingCount,
  partnerResponseCount,
  refreshing,
  result,
  error,
  onRefresh,
  labels,
}: MatchSyncStatusProps) {
  const disabled = !syncable || refreshing;
  const snapshotStatus = result?.snapshot?.status;
  const detail = !syncable
    ? labels.syncPaused
    : snapshotStatus === 'rejected'
      ? labels.syncRejected
      : error
        ? labels.syncFailed
        : snapshotStatus === 'waiting' && result?.snapshot?.published
          ? labels.syncWaiting
          : result
            ? interpolate(labels.syncComplete, {
                uploaded: result.snapshot?.published ? 1 : result.uploaded,
                applied: result.snapshot?.received ? 1 : result.applied,
              })
            : null;
  const detailIsError = error || snapshotStatus === 'rejected';

  return (
    <View
      style={styles.card}
      accessibilityLabel={labels.syncStatusAccessibility}
    >
      <View style={styles.header}>
        <Text style={styles.lastSynced}>
          {interpolate(labels.lastSynced, {
            time: formatMatchSyncTime(lastSyncedAt, labels),
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.refreshMatches}
          accessibilityState={{ disabled, busy: refreshing }}
          disabled={disabled}
          onPress={onRefresh}
          style={[styles.refreshButton, disabled && styles.buttonDisabled]}
        >
          <RefreshCcw size={16} color={COLORS.pink} />
          <Text style={styles.refreshText}>
            {refreshing ? labels.refreshingMatches : labels.refreshMatches}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.summary}>
        {interpolate(labels.syncSummary, {
          pending: pendingCount,
          received: partnerResponseCount,
        })}
      </Text>
      {detail ? (
        <Text style={[styles.detail, detailIsError && styles.error]}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: COLORS.cardAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lastSynced: {
    flex: 1,
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  refreshText: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '700',
  },
  summary: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  detail: {
    color: COLORS.yes,
    fontSize: 16,
  },
  error: {
    color: COLORS.no,
  },
});
