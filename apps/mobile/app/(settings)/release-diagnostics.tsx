import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react-native';

import { BackHeader } from '../../components/app-chrome';
import { COLORS, SHADOWS } from '../../constants/theme';
import {
  ReleaseDiagnosticCheck,
  ReleaseDiagnosticStatus,
  buildReleaseDiagnostics,
  summarizeReleaseDiagnostics,
} from '../../lib/diagnostics/releaseReadiness';
import { isPurchaseProviderConfigured } from '../../lib/purchases/purchaseService';
import { isSupabaseRelayConfigured } from '../../lib/sync/supabaseConfig';

const STATUS_COPY: Record<
  ReleaseDiagnosticStatus,
  { label: string; color: string; backgroundColor: string }
> = {
  pass: {
    label: 'Pass',
    color: COLORS.yes,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  warning: {
    label: 'Review',
    color: COLORS.maybe,
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  fail: {
    label: 'Fix',
    color: COLORS.no,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
};

export default function ReleaseDiagnosticsScreen() {
  const checks = useMemo(() => {
    const expoConfig = Constants.expoConfig;
    const easExtra = expoConfig?.extra as
      | { eas?: { projectId?: string } }
      | undefined;

    return buildReleaseDiagnostics({
      appName: expoConfig?.name,
      version: expoConfig?.version,
      iosBundleIdentifier: expoConfig?.ios?.bundleIdentifier,
      androidPackage: expoConfig?.android?.package,
      easProjectId: easExtra?.eas?.projectId,
      supabaseConfigured: isSupabaseRelayConfigured(),
      purchasesConfigured: isPurchaseProviderConfigured(),
      appOwnership: Constants.appOwnership,
      legalRoutesPresent: true,
    });
  }, []);
  const summary = useMemo(() => summarizeReleaseDiagnostics(checks), [checks]);
  const overall = STATUS_COPY[summary.overall];

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title="Release Diagnostics" subtitle="Pre-launch checks" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: overall.backgroundColor },
            ]}
          >
            <StatusIcon status={summary.overall} size={28} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.kicker}>CURRENT BUILD</Text>
            <Text style={styles.summaryTitle}>{overall.label}</Text>
            <Text style={styles.summaryText}>
              {summary.pass} passing, {summary.warning} to review,{' '}
              {summary.fail} blocking.
            </Text>
          </View>
        </View>

        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>CHECKS</Text>
          <View style={styles.sectionCard}>
            {checks.map((check, index) => (
              <DiagnosticRow
                key={check.id}
                check={check}
                last={index === checks.length - 1}
              />
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          These checks only show release posture and never display Supabase
          keys, receipts, or other secrets.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DiagnosticRow({
  check,
  last,
}: {
  check: ReleaseDiagnosticCheck;
  last: boolean;
}) {
  const status = STATUS_COPY[check.status];

  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <View
        style={[styles.rowIcon, { backgroundColor: status.backgroundColor }]}
      >
        <StatusIcon status={check.status} size={20} />
      </View>
      <View style={styles.rowCopy}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowLabel}>{check.label}</Text>
          <View style={[styles.statusPill, { borderColor: status.color }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
        <Text style={styles.rowValue}>{check.value}</Text>
        <Text style={styles.rowDetail}>{check.detail}</Text>
      </View>
    </View>
  );
}

function StatusIcon({
  status,
  size,
}: {
  status: ReleaseDiagnosticStatus;
  size: number;
}) {
  if (status === 'pass') {
    return <CheckCircle2 size={size} color={COLORS.yes} strokeWidth={2.4} />;
  }

  if (status === 'warning') {
    return <CircleDashed size={size} color={COLORS.maybe} strokeWidth={2.4} />;
  }

  return <AlertTriangle size={size} color={COLORS.no} strokeWidth={2.4} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16,
    ...SHADOWS.card,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: COLORS.pink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  summaryTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryText: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  sectionGroup: {
    gap: 8,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    paddingHorizontal: 2,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.19)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rowValue: {
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: '700',
  },
  rowDetail: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
