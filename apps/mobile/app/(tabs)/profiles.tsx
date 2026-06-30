import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronRight, Heart, Plus, Users, Zap } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

import { AppHeader, AppTabBar } from '../../components/app-chrome';
import ProfileAvatarIcon from '../../components/ProfileAvatarIcon';
import { ScreenTour } from '../../components/ScreenTour';
import { useTranslation } from '../../lib/i18n';
import { useStreakStore } from '../../lib/achievements';
import { useProfilesStore } from '../../lib/state/profiles';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { voteValue } from '../../lib/votes/rolePreferences';
import { useVotesStore } from '../../src/stores/votes';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';

const PROFILE_COLORS = [
  COLORS.pink,
  COLORS.purple,
  COLORS.yes,
  COLORS.maybe,
  COLORS.no,
];

const ACTIVE_PROFILE_AVATAR_SIZE = 76;
const PROFILE_STRIP_AVATAR_SIZE = 68;
const PROFILE_STRIP_ICON_SIZE = 58;
const PARTNER_AVATAR_SIZE = 64;
const PARTNER_AVATAR_ICON_SIZE = 52;
const PARTNER_OVERLAP = 18;
const PARTNER_HEART_SIZE = 26;
const PARTNER_HEART_LEFT =
  PARTNER_AVATAR_SIZE - PARTNER_OVERLAP / 2 - PARTNER_HEART_SIZE / 2;
const PARTNER_HEART_TOP = (PARTNER_AVATAR_SIZE - PARTNER_HEART_SIZE) / 2;

export default function ProfilesHubScreen() {
  const router = useRouter();
  const { t } = useTranslation();

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

  const coupleLink = useCoupleLinkStore((state) =>
    state.link?.status === 'active' ? state.link : null
  );

  const currentStreak = useStreakStore((state) => state.currentStreak);

  const voteValues = Object.values(profileVotes).map(voteValue).filter(Boolean);
  const totalVoted = voteValues.length;
  const yesCount = voteValues.filter((v) => v === 'yes').length;
  const maybeCount = voteValues.filter((v) => v === 'maybe').length;

  const myName =
    activeProfile?.displayName ?? activeProfile?.name ?? t.kinks.noProfile;
  const partnerName = coupleLink?.partnerProfileName ?? 'Remote partner';
  const partnerAvatar = coupleLink?.partnerProfileAvatar ?? null;

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
          screenLabel={t.tabs.profiles}
          steps={t.tours.profiles}
        />

        {/* Active Profile Card — gradient, centered layout */}
        <LinearGradient
          colors={['#8B5CF6', '#C2185B', '#FF2D92']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileCardCentered}>
            <ProfileAvatarIcon
              avatar={activeProfile?.emoji}
              size={ACTIVE_PROFILE_AVATAR_SIZE}
              selected
            />
            <Text style={styles.profileName}>{myName}</Text>
            <View style={styles.activeNowRow}>
              <View style={styles.activeNowDot} />
              <Text style={styles.activeNowText}>Active now</Text>
            </View>
            {currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>
                  🔥 {currentStreak} day streak
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statBoxTop}>
                <Users size={14} color={COLORS.textPrimary} strokeWidth={2.2} />
                <Text style={styles.statNumber}>{totalVoted}</Text>
              </View>
              <Text style={styles.statLabel}>{t.kinks.voted}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statBoxTop}>
                <Heart size={14} color={COLORS.yes} strokeWidth={2.2} />
                <Text style={[styles.statNumber, { color: COLORS.yes }]}>
                  {yesCount}
                </Text>
              </View>
              <Text style={styles.statLabel}>{t.common.yes}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxMaybe]}>
              <View style={styles.statBoxTop}>
                <Zap size={14} color={COLORS.maybe} strokeWidth={2.2} />
                <Text style={[styles.statNumber, { color: COLORS.maybe }]}>
                  {maybeCount}
                </Text>
              </View>
              <Text style={styles.statLabel}>{t.deck.maybe}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.kinks.viewMyVotes}
            onPress={() => router.push('/(settings)/my-votes')}
            style={styles.viewVotesPress}
          >
            <View style={styles.viewVotesButton}>
              <Text style={styles.viewVotesText}>{t.kinks.viewMyVotes}</Text>
            </View>
          </Pressable>
        </LinearGradient>

        {/* Profiles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Profiles</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(settings)/profiles')}
            >
              <Text style={styles.sectionAction}>Manage</Text>
            </Pressable>
          </View>
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
                      size={PROFILE_STRIP_AVATAR_SIZE}
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
                        size={PROFILE_STRIP_ICON_SIZE}
                        framed={false}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.profiles.addProfile}
              onPress={() => router.push('/(settings)/profiles/new')}
              style={[styles.avatarCircle, styles.addCircle]}
            >
              <Plus size={24} color={COLORS.textMuted} strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>

        {/* Partner Section */}
        <View style={styles.sectionCard}>
          {coupleLink ? (
            <View style={styles.partnerCentered}>
              <View style={styles.partnerAvatars}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.partnerAvatarCircle}
                >
                  <ProfileAvatarIcon
                    avatar={activeProfile?.emoji}
                    size={PARTNER_AVATAR_ICON_SIZE}
                    framed={false}
                  />
                </LinearGradient>
                <View style={styles.partnerHeartBadge}>
                  <Heart
                    size={14}
                    color={COLORS.textPrimary}
                    fill={COLORS.textPrimary}
                  />
                </View>
                <LinearGradient
                  colors={['#60A5FA', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.partnerAvatarCircle, styles.partnerAvatarRight]}
                >
                  <ProfileAvatarIcon
                    avatar={partnerAvatar}
                    size={PARTNER_AVATAR_ICON_SIZE}
                    framed={false}
                  />
                </LinearGradient>
              </View>

              <Text style={styles.partnerCoupledName}>
                {myName} & {partnerName}
              </Text>

              <View style={styles.syncedBadge}>
                <Text style={styles.syncedText}>⟳ {t.kinks.linked}</Text>
              </View>

              <Text style={styles.partnerSubtext}>
                Remote sync active · matches stay private
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open partner sync"
                onPress={() => router.push('/(settings)/partner-sync')}
                style={styles.seeMatchesPress}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.seeMatchesButton}
                >
                  <Heart
                    size={18}
                    color={COLORS.textPrimary}
                    fill={COLORS.textPrimary}
                  />
                  <Text style={styles.seeMatchesText}>Partner sync</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(onboarding)/partner-connect')}
              style={styles.connectRow}
            >
              <Text style={styles.connectLabel}>
                {t.kinks.connectWithPartner}
              </Text>
              <ChevronRight size={16} color={COLORS.pink} />
            </Pressable>
          )}
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
    paddingTop: 6,
    paddingBottom: 8,
    gap: 10,
  },

  // Profile card — gradient, centered
  profileCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 14,
    gap: 10,
  },
  profileCardCentered: {
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  activeNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeNowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.yes,
  },
  activeNowText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  streakBadge: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  streakText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 3,
  },
  statBoxMaybe: {
    backgroundColor: 'rgba(239,68,68,0.18)',
  },
  statBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // View My Votes — white button
  viewVotesPress: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  viewVotesButton: {
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  viewVotesText: {
    color: '#1A0810',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionAction: {
    color: COLORS.purpleLight,
    fontSize: 16,
    fontWeight: '700',
  },

  // Profile avatars
  avatarRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  avatarCircle: {
    width: PROFILE_STRIP_AVATAR_SIZE,
    height: PROFILE_STRIP_AVATAR_SIZE,
    borderRadius: PROFILE_STRIP_AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    ...SHADOWS.small,
  },
  addCircle: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },

  // Partner card
  sectionCard: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
  },
  partnerCentered: {
    alignItems: 'center',
    gap: 10,
  },
  partnerAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: PARTNER_AVATAR_SIZE,
    width: PARTNER_AVATAR_SIZE * 2 - PARTNER_OVERLAP,
  },
  partnerAvatarCircle: {
    width: PARTNER_AVATAR_SIZE,
    height: PARTNER_AVATAR_SIZE,
    borderRadius: PARTNER_AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  partnerAvatarRight: {
    marginLeft: -PARTNER_OVERLAP,
    zIndex: 0,
  },
  partnerHeartBadge: {
    position: 'absolute',
    left: PARTNER_HEART_LEFT,
    top: PARTNER_HEART_TOP,
    zIndex: 2,
    width: PARTNER_HEART_SIZE,
    height: PARTNER_HEART_SIZE,
    borderRadius: PARTNER_HEART_SIZE / 2,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerCoupledName: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  syncedBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  syncedText: {
    color: COLORS.yes,
    fontSize: 16,
    fontWeight: '700',
  },
  partnerSubtext: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  seeMatchesPress: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
  },
  seeMatchesButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
  },
  seeMatchesText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },

  // Partner connect (unlinked)
  connectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectLabel: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '700',
  },
});
