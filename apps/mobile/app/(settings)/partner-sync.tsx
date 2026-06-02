import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Link2Off, Radio, RefreshCcw, ShieldCheck } from 'lucide-react-native';

import { BackHeader } from '../../components/app-chrome';
import ProfileAvatarIcon from '../../components/ProfileAvatarIcon';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';
import { disconnectRemotePartnerLocal } from '../../lib/safety/localDataControls';
import { useProfilesStore } from '../../lib/state/profiles';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { useEventQueueStore } from '../../lib/sync/eventQueue';
import { usePartnerVotesStore } from '../../lib/sync/partnerVotes';
import { getPartnerDashboardStats } from '../../lib/sync/partnerDashboard';
import { useVoteSyncStore } from '../../lib/sync/voteSync';

export default function PartnerSyncScreen() {
  const router = useRouter();
  const link = useCoupleLinkStore((state) => state.link);
  const activeLink = link?.status === 'active' ? link : null;
  const partnerVotes = usePartnerVotesStore((state) => state.byCardId);
  const answeredCount = usePartnerVotesStore((state) => state.answeredCount);
  const pendingEvents = useEventQueueStore((state) => state.pending);
  const localProfileId = useVoteSyncStore((state) => state.localProfileId);
  const profiles = useProfilesStore((state) => state.getProfiles());

  const stats = useMemo(
    () =>
      getPartnerDashboardStats({
        link: activeLink,
        partnerVotes,
        answeredCount,
        pendingEvents,
        localProfileId,
        profiles,
      }),
    [
      activeLink,
      answeredCount,
      localProfileId,
      partnerVotes,
      pendingEvents,
      profiles,
    ]
  );

  const partnerName = activeLink?.partnerProfileName ?? 'Remote partner';
  const partnerAvatar = activeLink?.partnerProfileAvatar ?? null;

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      'Disconnect remote partner?',
      "This clears the partner link, partner votes, reveal consent, and pending sync events from this device. It does not delete anything from your partner's device.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnectRemotePartnerLocal();
            router.replace('/(tabs)/profiles');
          },
        },
      ]
    );
  }, [router]);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title="Partner Sync" subtitle="Connection status" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {activeLink ? (
          <>
            <View style={styles.partnerCard}>
              <LinearGradient
                colors={GRADIENTS.purple}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.partnerAvatar}
              >
                <ProfileAvatarIcon
                  avatar={partnerAvatar}
                  size={42}
                  framed={false}
                />
              </LinearGradient>
              <View style={styles.partnerCopy}>
                <Text style={styles.partnerName}>{partnerName}</Text>
                <View style={styles.statusPill}>
                  <Radio size={13} color={COLORS.yes} />
                  <Text style={styles.statusText}>Remote sync active</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsGrid}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.primaryAction}
                onPress={() => router.push('/(tabs)/matches')}
              >
                <ShieldCheck size={18} color={COLORS.textPrimary} />
                <Text style={styles.primaryActionText}>View matches</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryAction}
                onPress={() => router.push('/(onboarding)/partner-connect')}
              >
                <RefreshCcw size={18} color={COLORS.pink} />
                <Text style={styles.secondaryActionText}>Partner setup</Text>
              </Pressable>
              <Pressable style={styles.dangerAction} onPress={handleDisconnect}>
                <Link2Off size={18} color={COLORS.no} />
                <Text style={styles.dangerActionText}>
                  Disconnect remote partner
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Radio size={28} color={COLORS.pink} />
            </View>
            <Text style={styles.emptyTitle}>No remote partner connected</Text>
            <Text style={styles.emptyCopy}>
              Create or accept a private invite link to sync encrypted vote
              updates with a partner on another device.
            </Text>
            <Pressable
              style={styles.primaryAction}
              onPress={() => router.push('/(onboarding)/partner-connect')}
            >
              <Text style={styles.primaryActionText}>Open partner setup</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 16,
    ...SHADOWS.card,
  },
  partnerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  partnerName: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    flexShrink: 1,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.11)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    color: COLORS.yes,
    fontSize: 12,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '49%',
    minHeight: 82,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.18)',
    backgroundColor: COLORS.card,
    padding: 12,
    justifyContent: 'space-between',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  actions: {
    gap: 10,
  },
  primaryAction: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  primaryActionText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryAction: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  secondaryActionText: {
    color: COLORS.pink,
    fontSize: 15,
    fontWeight: '800',
  },
  dangerAction: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239,68,68,0.07)',
  },
  dangerActionText: {
    color: COLORS.no,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 18,
    gap: 12,
    ...SHADOWS.card,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(194,24,91,0.12)',
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCopy: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
