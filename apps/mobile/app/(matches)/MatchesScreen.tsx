import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  CalendarClock,
  Check,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
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
import {
  filterMatchItems,
  type MatchRoleFilter,
  type MatchVisibilityFilter,
} from '../../lib/match/experience';
import {
  computeActionBuckets,
  explainMatch,
  type ActionMatchItem,
} from '../../lib/match/actionBuckets';
import {
  buildProposalText,
  selectNextSession,
  useMatchPlansStore,
} from '../../lib/state/matchPlans';
import { useViewedMatchesStore } from '../../lib/match/viewedMatches';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { usePartnerVotesStore } from '../../lib/sync/partnerVotes';
import {
  requestRevealUnlock,
  useRevealConsentStore,
  type RevealConsentBucket,
} from '../../lib/sync/revealConsent';
import { useProfilesStore, type Profile } from '../../lib/state/profiles';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useVotesStore, type KinkVote } from '../../src/stores/votes';
import { interpolate, useTranslation } from '../../lib/i18n';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';
import {
  BucketDetailView,
  BucketOverview,
} from '../../components/matches/MatchBuckets';
import { MatchDetailPanel } from '../../components/matches/MatchDetailPanel';
import { MatchFilters } from '../../components/matches/MatchFilters';
import { HiddenPrivacyTile } from '../../components/matches/HiddenPrivacyTile';
import type {
  BucketId,
  BucketView,
} from '../../components/matches/matchPresentation';

const EMPTY_PROFILE_VOTES = Object.freeze({}) as Record<string, KinkVote>;

type MatchItem = ActionMatchItem;

export function MatchScreenContent({
  selectedDetail,
  children,
}: {
  selectedDetail: React.ReactNode;
  children: React.ReactNode;
}) {
  return <>{selectedDetail ?? children}</>;
}

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
  const [visibilityFilter, setVisibilityFilter] =
    useState<MatchVisibilityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [intensityFilter, setIntensityFilter] = useState<
    'all' | '1' | '2' | '3'
  >('all');
  const [roleFilter, setRoleFilter] = useState<MatchRoleFilter>('all');
  const [selectedBucket, setSelectedBucket] = useState<BucketId | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [completedPlanSteps, setCompletedPlanSteps] = useState<
    Record<string, true>
  >({});
  const viewedIdsRecord = useViewedMatchesStore((state) => state.viewedIds);
  const markViewed = useViewedMatchesStore((state) => state.markViewed);

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
        record.pairPreference || record.readiness
          ? {
              value: record.vote,
              pairPreference: record.pairPreference,
              readiness: record.readiness,
            }
          : record.vote,
      ])
    ) as Record<string, KinkVote>;
  }, [isRemotePartner, localPartnerVotes, remotePartnerVotes]);

  const { kinks, kinksById } = useKinks(language === 'es' ? 'es' : 'en');

  const actionBuckets = useMemo(
    () =>
      computeActionBuckets({
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

  // Consent gating mirrors the pre-readiness model: anything that reveals a
  // "maybe/maybe" pairing needs the mutualMaybe unlock, anything revealing a
  // mixed signal (yes+maybe, or a not-now conversation topic) needs the
  // partialYesMaybe unlock. Mutual-yes rows are always visible, as before.
  const readyNow = actionBuckets.readyNow;

  const visibleCurious = useMemo(
    () =>
      actionBuckets.curiousTogether.filter((item) =>
        item.myVote === 'maybe' && item.partnerVote === 'maybe'
          ? maybeUnlocked
          : partialUnlocked
      ),
    [actionBuckets.curiousTogether, maybeUnlocked, partialUnlocked]
  );

  const visibleTalk = useMemo(
    () =>
      actionBuckets.needsConversation.filter((item) =>
        item.reasons.includes('timing') ? partialUnlocked : true
      ),
    [actionBuckets.needsConversation, partialUnlocked]
  );

  const totalMatches =
    readyNow.length +
    actionBuckets.curiousTogether.length +
    actionBuckets.needsConversation.length;

  const allMatches = useMemo(
    () => [...readyNow, ...visibleCurious, ...visibleTalk],
    [readyNow, visibleCurious, visibleTalk]
  );

  const viewedIds = useMemo(
    () => new Set(Object.keys(viewedIdsRecord)),
    [viewedIdsRecord]
  );

  const activeFilters = useMemo(
    () => ({
      visibility: visibilityFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      intensity:
        intensityFilter === 'all' ? undefined : Number(intensityFilter),
      role: roleFilter,
      viewedIds,
    }),
    [categoryFilter, intensityFilter, roleFilter, viewedIds, visibilityFilter]
  );

  const filteredReady = useMemo(
    () => filterMatchItems(readyNow, activeFilters),
    [activeFilters, readyNow]
  );
  const filteredCurious = useMemo(
    () => filterMatchItems(visibleCurious, activeFilters),
    [activeFilters, visibleCurious]
  );
  const filteredTalk = useMemo(
    () => filterMatchItems(visibleTalk, activeFilters),
    [activeFilters, visibleTalk]
  );

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(allMatches.map((item) => item.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return ['all', ...categories];
  }, [allMatches]);

  const selectedMatch = useMemo(
    () => allMatches.find((item) => item.id === selectedMatchId) ?? null,
    [allMatches, selectedMatchId]
  );

  const selectedExplanation = useMemo(
    () =>
      selectedMatch
        ? explainMatch(selectedMatch, kinksById[selectedMatch.id])
        : null,
    [kinksById, selectedMatch]
  );

  const plansByKinkId = useMatchPlansStore((state) => state.plansByKinkId);
  const toggleFavorite = useMatchPlansStore((state) => state.toggleFavorite);
  const toggleNextSession = useMatchPlansStore(
    (state) => state.toggleNextSession
  );
  const markCompleted = useMatchPlansStore((state) => state.markCompleted);
  const setPlanNote = useMatchPlansStore((state) => state.setNote);

  const selectedPlanState = selectedMatchId
    ? plansByKinkId[selectedMatchId]
    : undefined;

  const nextSessionTitles = useMemo(
    () =>
      selectNextSession(plansByKinkId)
        .map((plan) => kinksById[plan.kinkId]?.title)
        .filter((title): title is string => Boolean(title)),
    [kinksById, plansByKinkId]
  );

  useEffect(() => {
    if (
      selectedMatchId &&
      !allMatches.some((item) => item.id === selectedMatchId)
    ) {
      setSelectedMatchId(null);
      setCompletedPlanSteps({});
    }
  }, [allMatches, selectedMatchId]);

  const handlePartnerSelect = useCallback((id: string) => {
    setSelectedPartnerId(id);
    setPartnerPickerOpen(false);
  }, []);

  const handleUnlock = useCallback((buckets: RevealConsentBucket[]) => {
    for (const bucket of buckets) {
      void requestRevealUnlock(bucket);
    }
  }, []);

  const waitingOnPartner = useCallback(
    (localConsents: boolean[]) =>
      isRemotePartner && localConsents.every(Boolean),
    [isRemotePartner]
  );

  const buckets = useMemo<BucketView[]>(() => {
    const curiousTotal = actionBuckets.curiousTogether.length;
    const talkTotal = actionBuckets.needsConversation.length;
    const curiousHiddenRows = curiousTotal - visibleCurious.length;
    const talkHiddenRows = talkTotal - visibleTalk.length;

    const curiousMissingConsents: RevealConsentBucket[] = [];
    if (!partialUnlocked) curiousMissingConsents.push('partialYesMaybe');
    if (!maybeUnlocked) curiousMissingConsents.push('mutualMaybe');

    return [
      {
        id: 'ready',
        tone: 'yes',
        icon: Check,
        title: t.matches.readyNow,
        blurb: t.matches.bucketReadyBlurb,
        total: readyNow.length,
        rows: filteredReady,
        locked: false,
      },
      {
        id: 'curious',
        tone: 'maybe',
        icon: Sparkles,
        title: t.matches.curiousTogether,
        blurb: t.matches.bucketCuriousBlurb,
        total: curiousTotal,
        rows: filteredCurious,
        locked: curiousTotal > 0 && visibleCurious.length === 0,
        lockTitle: t.matches.mutualMaybeLocked,
        unlockLabel: waitingOnPartner([partialLocalConsent, maybeLocalConsent])
          ? t.matches.waitingForPartner
          : t.matches.unlockCurious,
        lockedNote:
          curiousHiddenRows > 0 && visibleCurious.length > 0
            ? interpolate(t.matches.lockedRowsNote, {
                count: curiousHiddenRows,
              })
            : undefined,
        onUnlock: () => handleUnlock(curiousMissingConsents),
      },
      {
        id: 'talk',
        tone: 'partial',
        icon: MessageCircle,
        title: t.matches.needsConversation,
        blurb: t.matches.bucketTalkBlurb,
        total: talkTotal,
        rows: filteredTalk,
        locked: talkTotal > 0 && visibleTalk.length === 0,
        lockTitle: t.matches.partialYesLocked,
        unlockLabel: waitingOnPartner([partialLocalConsent])
          ? t.matches.waitingForPartner
          : t.matches.unlockConversation,
        lockedNote:
          talkHiddenRows > 0 && visibleTalk.length > 0
            ? interpolate(t.matches.lockedRowsNote, { count: talkHiddenRows })
            : undefined,
        onUnlock: () => handleUnlock(['partialYesMaybe']),
      },
    ];
  }, [
    actionBuckets.curiousTogether.length,
    actionBuckets.needsConversation.length,
    filteredCurious,
    filteredReady,
    filteredTalk,
    handleUnlock,
    maybeLocalConsent,
    maybeUnlocked,
    partialLocalConsent,
    partialUnlocked,
    readyNow.length,
    t.matches.bucketCuriousBlurb,
    t.matches.bucketReadyBlurb,
    t.matches.bucketTalkBlurb,
    t.matches.curiousTogether,
    t.matches.lockedRowsNote,
    t.matches.mutualMaybeLocked,
    t.matches.needsConversation,
    t.matches.partialYesLocked,
    t.matches.readyNow,
    t.matches.unlockConversation,
    t.matches.unlockCurious,
    t.matches.waitingForPartner,
    visibleCurious.length,
    visibleTalk.length,
    waitingOnPartner,
  ]);

  const activeBucket = useMemo(
    () => buckets.find((bucket) => bucket.id === selectedBucket) ?? null,
    [buckets, selectedBucket]
  );

  const handleSelectMatch = useCallback(
    (item: MatchItem) => {
      setSelectedMatchId(item.id);
      setCompletedPlanSteps({});
      markViewed(item.id);
    },
    [markViewed]
  );

  const togglePlanStep = useCallback((stepId: string) => {
    setCompletedPlanSteps((current) => {
      if (current[stepId]) {
        const { [stepId]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [stepId]: true };
    });
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: interpolate(t.matches.shareMessage, {
          yes: readyNow.length,
          maybe: visibleCurious.length,
        }),
      });
    } catch {
      Alert.alert(t.common.error, t.matches.shareError);
    }
  }, [
    readyNow.length,
    visibleCurious.length,
    t.common.error,
    t.matches.shareError,
    t.matches.shareMessage,
  ]);

  const handleShareProposal = useCallback(async (title: string) => {
    try {
      await Share.share({ message: buildProposalText(title) });
    } catch {
      // Sharing is best-effort; the proposal text stays available in-app.
    }
  }, []);

  const showHiddenInfo = useCallback(() => {
    Alert.alert(t.matches.hiddenTitle, t.matches.hiddenInfo);
  }, [t.matches.hiddenInfo, t.matches.hiddenTitle]);

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <MatchScreenContent
          selectedDetail={
            selectedMatch && selectedExplanation ? (
              <MatchDetailPanel
                item={selectedMatch}
                explanation={selectedExplanation}
                plan={selectedPlanState}
                completedSteps={completedPlanSteps}
                onToggleStep={togglePlanStep}
                onToggleFavorite={() => toggleFavorite(selectedMatch.id)}
                onToggleNextSession={() => toggleNextSession(selectedMatch.id)}
                onMarkCompleted={() => markCompleted(selectedMatch.id)}
                onNoteChange={(note) => setPlanNote(selectedMatch.id, note)}
                onShareProposal={() => handleShareProposal(selectedMatch.title)}
                onClose={() => setSelectedMatchId(null)}
                t={t}
              />
            ) : null
          }
        >
          <ScreenTour
            screenId="matches"
            screenLabel={t.tabs.matches}
            steps={t.tours.matches}
          />

          {activeBucket ? (
            <BucketDetailView
              bucket={activeBucket}
              backLabel={t.matches.backToCategories}
              emptyTitle={t.matches.noSharedPicks}
              emptySubtitle={t.matches.keepSwipingShort}
              onBack={() => setSelectedBucket(null)}
              onSelect={handleSelectMatch}
              filters={
                <MatchFilters
                  visibility={visibilityFilter}
                  onVisibilityChange={setVisibilityFilter}
                  category={categoryFilter}
                  categories={categoryOptions}
                  onCategoryChange={setCategoryFilter}
                  intensity={intensityFilter}
                  onIntensityChange={setIntensityFilter}
                  role={roleFilter}
                  onRoleChange={setRoleFilter}
                />
              }
            />
          ) : (
            <>
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
                        {interpolate(t.matches.matchCount, {
                          count: totalMatches,
                        })}
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
                    <Text style={styles.partnerLabel}>
                      {t.matches.lastSynced}
                    </Text>
                    <Text style={styles.partnerLabel}>
                      {isRemotePartner
                        ? (coupleLink?.partnerProfileName ??
                          t.deck.partnerFallback)
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

              <BucketOverview
                buckets={buckets}
                viewLabel={t.matches.viewMatches}
                sharedPicksLabel={t.matches.sharedPicks}
                onSelect={setSelectedBucket}
              />

              <HiddenPrivacyTile
                count={actionBuckets.hiddenCount}
                title={t.matches.hiddenTitle}
                blurb={t.matches.hiddenBlurb}
                onPress={showHiddenInfo}
              />

              {nextSessionTitles.length ? (
                <View style={styles.nextSessionStrip}>
                  <View style={styles.nextSessionHeader}>
                    <CalendarClock size={16} color={COLORS.accent} />
                    <Text style={styles.nextSessionTitle}>
                      {t.matches.nextSessionStrip.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.nextSessionItems} numberOfLines={2}>
                    {nextSessionTitles.join(' • ')}
                  </Text>
                </View>
              ) : null}

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
            </>
          )}
        </MatchScreenContent>
      </ScrollView>

      <AppTabBar active="matches" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 96,
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
    fontSize: 16,
    fontWeight: '700',
  },
  partnerLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerLabel: {
    color: COLORS.textSub,
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 16,
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
    fontSize: 16,
    textAlign: 'center',
  },
  nextSessionStrip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.28)',
    backgroundColor: 'rgba(167,139,250,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  nextSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextSessionTitle: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  nextSessionItems: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
