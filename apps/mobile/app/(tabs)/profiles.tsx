import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronRight, Link as LinkIcon, Plus } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

import { AppHeader, AppTabBar } from '../../components/app-chrome';
import ProfileAvatarIcon from '../../components/ProfileAvatarIcon';
import { ScreenTour } from '../../components/ScreenTour';
import { MAIN_SCREEN_TOURS } from '../../lib/main-screen-tours';
import { useProfilesStore } from '../../lib/state/profiles';
import { useVotesStore } from '../../src/stores/votes';
import { usePartnerStore } from '../../src/stores/partner';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';

const PROFILE_COLORS = [
  COLORS.pink,
  COLORS.purple,
  COLORS.yes,
  COLORS.maybe,
  COLORS.no,
];

export default function ProfilesHubScreen() {
  const router = useRouter();

  const { profiles, activeProfileId } = useProfilesStore(
    useShallow((state) => ({
      profiles: state.getProfiles(),
      activeProfileId: state.getActiveProfileId(),
    }))
  );

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );

  const profileVotes = useVotesStore((state) =>
    activeProfileId ? (state.votesByProfile[activeProfileId] ?? {}) : {}
  );

  const { partner, pendingInvite } = usePartnerStore(
    useShallow((state) => ({
      partner: state.partner,
      pendingInvite: state.pendingInvite,
    }))
  );

  const voteValues = Object.values(profileVotes);
  const totalVoted = voteValues.length;
  const yesCount = voteValues.filter((v) => v === 'yes').length;
  const maybeCount = voteValues.filter((v) => v === 'maybe').length;

  const inviteCode =
    pendingInvite?.status === 'pending' && Date.now() < pendingInvite.expiresAt
      ? pendingInvite.code
      : null;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ScreenTour
          screenId="profiles"
          screenLabel="Profiles"
          steps={MAIN_SCREEN_TOURS.profiles}
        />

        {/* Active Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardTop}>
            <ProfileAvatarIcon
              avatar={activeProfile?.emoji}
              size={52}
              selected
            />
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>
                {activeProfile?.displayName ??
                  activeProfile?.name ??
                  'No Profile'}
              </Text>
              <Text style={styles.profileSubtitle}>Active Profile</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage profiles"
              onPress={() => router.push('/(settings)/profiles')}
              hitSlop={10}
            >
              <ChevronRight size={18} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalVoted}</Text>
              <Text style={styles.statLabel}>Voted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: COLORS.yes }]}>
                {yesCount}
              </Text>
              <Text style={styles.statLabel}>Yes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: COLORS.maybe }]}>
                {maybeCount}
              </Text>
              <Text style={styles.statLabel}>Maybe</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View my votes"
            onPress={() => router.push('/(settings)/my-votes')}
            style={styles.viewVotesPress}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.viewVotesButton}
            >
              <Text style={styles.viewVotesText}>VIEW MY VOTES</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Profiles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>PROFILES</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(settings)/profiles')}
            >
              <Text style={styles.sectionAction}>Manage →</Text>
            </Pressable>
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.avatarRow}>
              {profiles.map((profile, index) => {
                const dotColor =
                  profile.color ??
                  PROFILE_COLORS[index % PROFILE_COLORS.length];
                const isActive = profile.id === activeProfileId;
                return (
                  <Pressable
                    key={profile.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Switch to ${profile.displayName ?? profile.name}`}
                    onPress={() => router.push('/(settings)/profiles')}
                  >
                    {isActive ? (
                      <ProfileAvatarIcon
                        avatar={profile.emoji}
                        size={48}
                        selected
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: dotColor + '33' },
                        ]}
                      >
                        <ProfileAvatarIcon
                          avatar={profile.emoji}
                          size={42}
                          framed={false}
                        />
                      </View>
                    )}
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add profile"
                onPress={() => router.push('/(settings)/profiles/new')}
                style={[styles.avatarCircle, styles.addCircle]}
              >
                <Plus size={18} color={COLORS.textMuted} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Partner Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>PARTNER</Text>
          </View>
          <View style={styles.sectionCard}>
            {partner ? (
              <View style={styles.partnerRow}>
                <LinearGradient
                  colors={GRADIENTS.purple}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.partnerAvatar}
                >
                  <ProfileAvatarIcon
                    avatar={partner.emoji}
                    size={34}
                    framed={false}
                  />
                </LinearGradient>
                <View style={styles.partnerInfo}>
                  <View style={styles.partnerNameRow}>
                    <Text style={styles.partnerName}>{partner.name}</Text>
                    <View style={styles.linkedBadge}>
                      <Text style={styles.linkedText}>Linked</Text>
                    </View>
                  </View>
                  {inviteCode ? (
                    <View style={styles.codeRow}>
                      <LinkIcon size={12} color={COLORS.textMuted} />
                      <Text style={styles.codeText}>{inviteCode}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(onboarding)/invite')}
                style={styles.connectRow}
              >
                <Text style={styles.connectLabel}>
                  {inviteCode
                    ? `Your code: ${inviteCode}`
                    : 'Connect with Partner'}
                </Text>
                <ChevronRight size={16} color={COLORS.pink} />
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      <AppTabBar active="profiles" />
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
    paddingTop: 10,
    paddingBottom: 18,
    gap: 16,
  },

  // Profile card
  profileCard: {
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    padding: 18,
    gap: 14,
    ...SHADOWS.card,
  },
  profileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileMeta: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  profileSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 3,
  },
  statNumber: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'stretch',
    marginVertical: 4,
  },

  // View My Votes button
  viewVotesPress: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  viewVotesButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewVotesText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Sections
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  sectionAction: {
    color: COLORS.pink,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
  },

  // Profile avatars
  avatarRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircle: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },

  // Partner
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInfo: {
    flex: 1,
    gap: 4,
  },
  partnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  linkedBadge: {
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  linkedText: {
    color: COLORS.yes,
    fontSize: 10,
    fontWeight: '700',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  codeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  connectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectLabel: {
    color: COLORS.pink,
    fontSize: 14,
    fontWeight: '700',
  },
});
