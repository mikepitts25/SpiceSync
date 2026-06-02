import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  FileText,
  HeartHandshake,
  Link2Off,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';

import { BackHeader, SectionRow } from '../../components/app-chrome';
import {
  clearActiveProfileVotes,
  disconnectRemotePartnerLocal,
  resetAppOnDevice,
} from '../../lib/safety/localDataControls';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function PrivacySafetyScreen() {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  const confirmClearVotes = useCallback(() => {
    Alert.alert(
      'Clear your votes?',
      'This removes selections for the active profile on this device. Partner data and profiles stay in place.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear votes',
          style: 'destructive',
          onPress: () => {
            const cleared = clearActiveProfileVotes();
            Alert.alert(
              cleared ? 'Votes cleared' : 'No active profile',
              cleared
                ? 'Your active profile selections were removed.'
                : 'Choose or create a profile before clearing votes.'
            );
          },
        },
      ]
    );
  }, []);

  const confirmDisconnect = useCallback(() => {
    Alert.alert(
      'Disconnect remote partner?',
      'This clears the remote partner link, partner votes, reveal consent, and pending sync events from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnectRemotePartnerLocal();
            Alert.alert(
              'Partner disconnected',
              'Remote sync data was cleared.'
            );
          },
        },
      ]
    );
  }, []);

  const confirmResetApp = useCallback(() => {
    if (resetting) return;
    Alert.alert(
      'Reset app on this device?',
      'This removes profiles, votes, partner sync state, pending sync events, and age verification from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset device',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetAppOnDevice();
              router.replace('/welcome');
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Could not reset this device.';
              Alert.alert('Reset failed', message);
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  }, [resetting, router]);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title="Privacy & Safety" subtitle="Local data controls" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <ShieldCheck size={26} color={COLORS.pink} strokeWidth={2.4} />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>Adults only. Consent first.</Text>
            <Text style={styles.summaryText}>
              SpiceSync is for adults exploring privately with mutual respect.
              Your local profiles and votes stay on this device unless you link
              a remote partner.
            </Text>
          </View>
        </View>

        <SettingsSection title="POLICIES">
          <SectionRow
            icon={FileText}
            label="Privacy Policy"
            value="Read"
            tint={COLORS.yes}
            badgeBg="rgba(34,197,94,0.12)"
            onPress={() => router.push('/(settings)/privacy-policy')}
          />
          <SectionRow
            icon={HeartHandshake}
            label="Terms of Service"
            value="Read"
            tint={COLORS.purple}
            badgeBg="rgba(139,92,246,0.14)"
            onPress={() => router.push('/(settings)/terms-of-service')}
            last
          />
        </SettingsSection>

        <SettingsSection title="DATA CONTROLS">
          <SectionRow
            icon={Trash2}
            label="Clear my votes"
            value="Active profile"
            tint={COLORS.no}
            badgeBg="rgba(239,68,68,0.12)"
            onPress={confirmClearVotes}
          />
          <SectionRow
            icon={Link2Off}
            label="Disconnect remote partner"
            value="Local only"
            tint={COLORS.no}
            badgeBg="rgba(239,68,68,0.12)"
            onPress={confirmDisconnect}
          />
          <SectionRow
            icon={RotateCcw}
            label={resetting ? 'Resetting...' : 'Reset app on this device'}
            value="All local data"
            tint={COLORS.no}
            badgeBg="rgba(239,68,68,0.12)"
            onPress={resetting ? undefined : confirmResetApp}
            last
          />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionGroup}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(194,24,91,0.12)',
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  summaryText: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
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
});
