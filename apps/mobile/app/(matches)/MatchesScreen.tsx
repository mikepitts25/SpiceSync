import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Check,
  Ellipsis,
  Heart,
  LockKeyhole,
  Share2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import {
  AppHeader,
  AppTabBar,
  CardAccentTop,
} from '../../components/app-chrome';
import ProfileAvatarIcon from '../../components/ProfileAvatarIcon';
import { ScreenTour } from '../../components/ScreenTour';
import { useKinks } from '../../lib/data';
import { computeRevealBuckets } from '../../lib/match/reveal';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { usePartnerVotesStore } from '../../lib/sync/partnerVotes';
import {
  requestRevealUnlock,
  useRevealConsentStore,
  type RevealConsentBucket,
} from '../../lib/sync/revealConsent';
import { useProfilesStore, type Profile } from '../../src/stores/profiles';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useVotesStore, type VoteValue } from '../../src/stores/votes';
import { interpolate, useTranslation } from '../../lib/i18n';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';

const EMPTY_PROFILE_VOTES = Object.freeze({}) as Record<string, VoteValue>;

type MatchItem = {
  id: string;
  title: string;
  category: string;
};

export default function MatchesScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const { t } = useTranslation();
  const coupleLink = useCoupleLinkStore((state) => state.link);
  const isRemotePartner = coupleLink?.status === 'active';

  const { hydrated, activeId, profiles } = useProfilesStore(
    useShallow((state) => ({
      hydrated: state.isHydrated(),
      activeId: state.getActiveProfileId(),
      profiles: state.getProfiles(),
    }))
  );

  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    null
  );

  const partners = useMemo(() => {
    if (!activeId) return [] as Profile[];
    return profiles.filter((profile) => profile.id !== activeId);
  }, [profiles, activeId]);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeId) ?? null,
    [profiles, activeId]
  );

  useEffect(() => {
    if (hydrated && !activeId) {
      router.replace('/welcome');
    }
  }, [hydrated, activeId, router]);

  useEffect(() => {
    if (isRemotePartner) {
      setSelectedPartnerId(null);
      setPartnerPickerOpen(false);
      return;
    }
    if (!partners.length) {
      setSelectedPartnerId(null);
      setPartnerPickerOpen(false);
      return;
    }
    if (
      !selectedPartnerId ||
      !partners.some((profile) => profile.id === selectedPartnerId)
    ) {
      setSelectedPartnerId(partners[0].id);
    }
  }, [isRemotePartner, partners, selectedPartnerId]);

  const partnerProfile = useMemo<Profile | null>(() => {
    if (!partners.length) return null;
    if (!selectedPartnerId) return partners[0] ?? null;
    return (
      partners.find((profile) => profile.id === selectedPartnerId) ??
      partners[0] ??
      null
    );
  }, [partners, selectedPartnerId]);

  const activeKey = activeId ? String(activeId) : null;
  const partnerKey = partnerProfile?.id ? String(partnerProfile.id) : null;

  const [activeVotes, localPartnerVotes] = useVotesStore(
    useShallow((state) => [
      activeKey
        ? (state.votesByProfile[activeKey] ?? EMPTY_PROFILE_VOTES)
        : EMPTY_PROFILE_VOTES,
      partnerKey
        ? (state.votesByProfile[partnerKey] ?? EMPTY_PROFILE_VOTES)
        : EMPTY_PROFILE_VOTES,
    ])
  );

  const remotePartnerVotes = usePartnerVotesStore((state) => state.byCardId);
  const partnerVotes = useMemo(() => {
    if (!isRemotePartner) return localPartnerVotes;
    return Object.fromEntries(
      Object.entries(remotePartnerVotes).map(([cardId, record]) => [
        cardId,
        record.vote,
      ])
    ) as Record<string, VoteValue>;
  }, [isRemotePartner, localPartnerVotes, remotePartnerVotes]);

  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');

  const { mutualYes, partialYesMaybe, mutualMaybe } = useMemo(
    () =>
      computeRevealBuckets({
        kinks,
        mine: activeVotes,
        theirs: partnerVotes,
      }),
    [activeVotes, kinks, partnerVotes]
  );

  const {
    partialUnlocked,
    maybeUnlocked,
    partialLocalConsent,
    maybeLocalConsent,
  } = useRevealConsentStore(
    useShallow((state) => ({
      partialUnlocked: state.hasUnlock('partialYesMaybe', isRemotePartner),
      maybeUnlocked: state.hasUnlock('mutualMaybe', isRemotePartner),
      partialLocalConsent: Boolean(state.local.partialYesMaybe),
      maybeLocalConsent: Boolean(state.local.mutualMaybe),
    }))
  );

  const totalMatches =
    mutualYes.length + partialYesMaybe.length + mutualMaybe.length;

  const handlePartnerSelect = useCallback((id: string) => {
    setSelectedPartnerId(id);
    setPartnerPickerOpen(false);
  }, []);

  const handleUnlock = useCallback((bucket: RevealConsentBucket) => {
    void requestRevealUnlock(bucket);
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: interpolate(t.matches.shareMessage, {
          yes: mutualYes.length,
          maybe:
            (maybeUnlocked ? mutualMaybe.length : 0) +
            (partialUnlocked ? partialYesMaybe.length : 0),
        }),
      });
    } catch {
      Alert.alert(t.common.error, t.matches.shareError);
    }
  }, [
    maybeUnlocked,
    mutualMaybe.length,
    partialUnlocked,
    partialYesMaybe.length,
    mutualYes.length,
    t.common.error,
    t.matches.shareError,
    t.matches.shareMessage,
  ]);

  if (!hydrated || !activeId) {
    return null;
  }

  if (!profiles.length || !activeProfile) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" />
        <AppHeader />
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>{t.profiles.noProfile}</Text>
          <Text style={styles.emptyCopy}>{t.profiles.createPartner}</Text>
        </View>
        <AppTabBar active="matches" />
      </SafeAreaView>
    );
  }

  if (!isRemotePartner && (!partners.length || !partnerProfile)) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" />
        <AppHeader />
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>{t.profiles.needPartner}</Text>
          <Text style={styles.emptyCopy}>{t.profiles.createPartner}</Text>
        </View>
        <AppTabBar active="matches" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <View style={styles.content}>
        <ScreenTour
          screenId="matches"
          screenLabel={t.tabs.matches}
          steps={t.tours.matches}
        />

        <View style={styles.partnerBanner}>
          <CardAccentTop />
          <View style={styles.partnerBannerInner}>
            <View style={styles.avatarPair}>
              <ProfileAvatarIcon
                avatar={activeProfile.emoji}
                size={52}
                selected
              />

              <Pressable
                style={styles.matchCenter}
                onPress={() => setPartnerPickerOpen((open) => !open)}
                accessibilityRole="button"
              >
                <Heart size={20} color={COLORS.pink} fill={COLORS.pink} />
                <Text style={styles.matchCount}>
                  {interpolate(t.matches.matchCount, { count: totalMatches })}
                </Text>
              </Pressable>

              <ProfileAvatarIcon
                avatar={
                  isRemotePartner
                    ? (coupleLink?.partnerProfileAvatar ?? null)
                    : partnerProfile?.emoji
                }
                size={52}
              />
            </View>

            <View style={styles.partnerLabels}>
              <Text style={styles.partnerLabel}>{t.matches.you}</Text>
              <Text style={styles.partnerLabel}>{t.matches.lastSynced}</Text>
              <Text style={styles.partnerLabel}>
                {isRemotePartner
                  ? (coupleLink?.partnerProfileName ?? t.deck.partnerFallback)
                  : (partnerProfile?.displayName ?? partnerProfile?.name)}
              </Text>
            </View>

            {!isRemotePartner &&
            partnerProfile &&
            partnerPickerOpen &&
            partners.length > 1 ? (
              <View style={styles.partnerDropdown}>
                {partners.map((profile) => (
                  <Pressable
                    key={profile.id}
                    onPress={() => handlePartnerSelect(profile.id)}
                    style={[
                      styles.partnerOption,
                      profile.id === partnerProfile.id &&
                        styles.partnerOptionActive,
                    ]}
                  >
                    <View style={styles.partnerOptionLabel}>
                      <ProfileAvatarIcon
                        avatar={profile.emoji}
                        size={22}
                        framed={false}
                      />
                      <Text style={styles.partnerOptionText}>
                        {profile.displayName ?? profile.name}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <MatchSection
          tone="yes"
          icon={Check}
          title={t.matches.mutualYes.toUpperCase()}
          rows={mutualYes}
          emptyTitle={t.matches.noSharedPicks}
          emptySubtitle={t.matches.keepSwipingShort}
        />
        <MatchSection
          tone="partial"
          icon={LockKeyhole}
          title={t.matches.partialMatch.toUpperCase()}
          rows={partialYesMaybe}
          emptyTitle={t.matches.noSharedPicks}
          emptySubtitle={t.matches.keepSwipingShort}
          locked={!partialUnlocked}
          lockTitle={t.matches.partialYesLocked}
          unlockLabel={
            isRemotePartner && partialLocalConsent
              ? t.matches.waitingForPartner
              : t.matches.unlockPartialYes
          }
          onUnlock={() => handleUnlock('partialYesMaybe')}
        />
        <MatchSection
          tone="maybe"
          icon={Ellipsis}
          title={t.matches.mutualMaybe.toUpperCase()}
          rows={mutualMaybe}
          emptyTitle={t.matches.noSharedPicks}
          emptySubtitle={t.matches.keepSwipingShort}
          locked={!maybeUnlocked}
          lockTitle={t.matches.mutualMaybeLocked}
          unlockLabel={
            isRemotePartner && maybeLocalConsent
              ? t.matches.waitingForPartner
              : t.matches.unlockMutualMaybe
          }
          onUnlock={() => handleUnlock('mutualMaybe')}
        />

        <Pressable
          style={styles.sharePress}
          onPress={handleShare}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shareButton}
          >
            <Share2 size={17} color={COLORS.textPrimary} />
            <Text style={styles.shareText}>
              {t.matches.shareResults.toUpperCase()}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <AppTabBar active="matches" />
    </SafeAreaView>
  );
}

function MatchSection({
  tone,
  icon: Icon,
  title,
  rows,
  emptyTitle,
  emptySubtitle,
  locked = false,
  lockTitle,
  unlockLabel,
  onUnlock,
}: {
  tone: 'yes' | 'partial' | 'maybe';
  icon: typeof Check;
  title: string;
  rows: MatchItem[];
  emptyTitle: string;
  emptySubtitle: string;
  locked?: boolean;
  lockTitle?: string;
  unlockLabel?: string;
  onUnlock?: () => void;
}) {
  const color =
    tone === 'yes'
      ? COLORS.yes
      : tone === 'partial'
        ? COLORS.pink
        : COLORS.maybe;
  const bg =
    tone === 'yes'
      ? 'rgba(34,197,94,0.04)'
      : tone === 'partial'
        ? 'rgba(255,45,146,0.05)'
        : 'rgba(245,158,11,0.06)';
  const border =
    tone === 'yes'
      ? 'rgba(34,197,94,0.19)'
      : tone === 'partial'
        ? 'rgba(255,45,146,0.22)'
        : 'rgba(245,158,11,0.22)';

  return (
    <View
      style={[styles.section, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Icon size={16} color={color} />
          <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: `${color}1F` }]}>
          <Text style={[styles.countBadgeText, { color }]}>{rows.length}</Text>
        </View>
      </View>

      <View style={styles.rowList}>
        {locked && rows.length ? (
          <>
            <View style={styles.resultRow}>
              <Text style={styles.resultTitle}>
                {lockTitle ?? 'Locked matches'}
              </Text>
              <Text style={styles.resultCategory}>
                {`${rows.length} ${rows.length === 1 ? 'ITEM' : 'ITEMS'}`}
              </Text>
            </View>
            {unlockLabel && onUnlock ? (
              <Pressable
                style={[styles.unlockButton, { borderColor: color }]}
                onPress={onUnlock}
                accessibilityRole="button"
              >
                <LockKeyhole size={14} color={color} />
                <Text style={[styles.unlockText, { color }]}>
                  {unlockLabel.toUpperCase()}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : rows.length ? (
          rows.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.resultRow}>
              <Text style={styles.resultTitle}>{item.title}</Text>
              <Text style={styles.resultCategory}>
                {item.category.toUpperCase()}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.resultRow}>
            <Text style={styles.resultTitle}>{emptyTitle}</Text>
            <Text style={styles.resultCategory}>
              {emptySubtitle.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  partnerBanner: {
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  partnerBannerInner: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 10,
  },
  avatarPair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  matchCenter: {
    alignItems: 'center',
    gap: 4,
    minWidth: 78,
  },
  matchCount: {
    color: COLORS.pink,
    fontSize: 10,
    fontWeight: '700',
  },
  partnerLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerLabel: {
    color: 'rgba(255,255,255,0.37)',
    fontSize: 11,
    fontWeight: '600',
  },
  partnerDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    overflow: 'hidden',
  },
  partnerOption: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardAlt,
  },
  partnerOptionActive: {
    backgroundColor: 'rgba(194,24,91,0.2)',
  },
  partnerOptionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerOptionText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  countBadge: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rowList: {
    gap: 8,
  },
  resultRow: {
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.024)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  resultCategory: {
    color: 'rgba(255,45,146,0.5)',
    fontSize: 10,
    fontWeight: '700',
  },
  unlockButton: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.026)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  unlockText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sharePress: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  shareText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCopy: {
    color: COLORS.textSub,
    fontSize: 13,
    textAlign: 'center',
  },
});
