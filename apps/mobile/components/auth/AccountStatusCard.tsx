import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, SHADOWS } from '../../constants/theme';
import type { AccountSnapshot } from '../../lib/auth/types';
import { useTranslation } from '../../lib/i18n';

type AccountStatusCardProps = {
  snapshot: AccountSnapshot | null;
  deviceLastSeenAt: number | null;
};

function accountProtectionLabel(
  snapshot: AccountSnapshot | null,
  labels: ReturnType<typeof useTranslation>['t']['settings']
): string {
  if (!snapshot || snapshot.status === 'error')
    return labels.accountUnavailable;
  if (snapshot.status === 'permanent') return labels.accountProtected;
  if (snapshot.status === 'anonymous') return labels.accountTemporary;
  return labels.accountLocalOnly;
}

function formatLastSeen(
  value: number | null,
  language: 'en' | 'es',
  labels: ReturnType<typeof useTranslation>['t']['settings']
): string {
  if (!value) return labels.lastSeenUnavailable;
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AccountStatusCard({
  snapshot,
  deviceLastSeenAt,
}: AccountStatusCardProps) {
  const { t, language } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t.settings.accountProtection}</Text>
      <Text style={styles.status}>
        {accountProtectionLabel(snapshot, t.settings)}
      </Text>
      <View style={styles.divider} />
      <View style={styles.deviceRow}>
        <View style={styles.deviceCopy}>
          <Text style={styles.deviceTitle}>{t.settings.activeDevice}</Text>
          <Text style={styles.deviceName}>{t.settings.thisDevice}</Text>
        </View>
        <View style={styles.lastSeenCopy}>
          <Text style={styles.lastSeenLabel}>{t.settings.lastSeen}</Text>
          <Text style={styles.lastSeenValue}>
            {formatLastSeen(deviceLastSeenAt, language, t.settings)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16,
    ...SHADOWS.card,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  status: {
    color: COLORS.yes,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  deviceCopy: {
    flex: 1,
    gap: 2,
  },
  deviceTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  deviceName: {
    color: COLORS.textSub,
    fontSize: 16,
  },
  lastSeenCopy: {
    alignItems: 'flex-end',
    flexShrink: 1,
    gap: 2,
  },
  lastSeenLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  lastSeenValue: {
    color: COLORS.textSub,
    fontSize: 16,
    textAlign: 'right',
  },
});
