import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  CalendarClock,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  EyeOff,
  Filter,
  Heart,
  LockKeyhole,
  MessageCircle,
  Share2,
  Sparkles,
  Star,
  X,
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
  describeRoleCompatibility,
  filterMatchItems,
  type MatchRoleFilter,
  type MatchVisibilityFilter,
} from '../../lib/match/experience';
import {
  computeActionBuckets,
  explainMatch,
  type ActionMatchItem,
  type MatchExplanation,
} from '../../lib/match/actionBuckets';
import {
  buildProposalText,
  selectNextSession,
  useMatchPlansStore,
  type MatchPlan,
} from '../../lib/state/matchPlans';
import { useViewedMatchesStore } from '../../lib/match/viewedMatches';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { usePartnerVotesStore } from '../../lib/sync/partnerVotes';
import {
  requestRevealUnlock,
  useRevealConsentStore,
  type RevealConsentBucket,
} from '../../lib/sync/revealConsent';
import { useProfilesStore, type Profile } from '../../src/stores/profiles';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useVotesStore, type KinkVote } from '../../src/stores/votes';
import { interpolate, useTranslation } from '../../lib/i18n';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';

const EMPTY_PROFILE_VOTES = Object.freeze({}) as Record<string, KinkVote>;

type MatchItem = ActionMatchItem;

type BucketId = 'ready' | 'curious' | 'talk';
type BucketTone = 'yes' | 'partial' | 'maybe';

type BucketView = {
  id: BucketId;
  tone: BucketTone;
  icon: typeof Check;
  title: string;
  blurb: string;
  total: number;
  rows: MatchItem[];
  locked: boolean;
  lockTitle?: string;
  unlockLabel?: string;
  // Shown when some rows are visible but others still need consent.
  lockedNote?: string;
  onUnlock?: () => void;
};

function bucketToneColors(tone: BucketTone): {
  color: string;
  bg: string;
  border: string;
} {
  if (tone === 'yes') {
    return {
      color: COLORS.yes,
      bg: 'rgba(34,197,94,0.04)',
      border: 'rgba(34,197,94,0.19)',
    };
  }
  if (tone === 'partial') {
    return {
      color: COLORS.pink,
      bg: 'rgba(255,45,146,0.05)',
      border: 'rgba(255,45,146,0.22)',
    };
  }
  return {
    color: COLORS.maybe,
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.22)',
  };
}

const VISIBILITY_FILTERS: { id: MatchVisibilityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unseen', label: 'Unseen' },
];

const ROLE_FILTERS: { id: MatchRoleFilter; label: string }[] = [
  { id: 'all', label: 'All roles' },
  { id: 'paired', label: 'Paired' },
  { id: 'give', label: 'You give' },
  { id: 'receive', label: 'You receive' },
  { id: 'both', label: 'Both' },
];

const INTENSITY_FILTERS = [
  { id: 'all', label: 'All levels' },
  { id: '1', label: 'Level 1' },
  { id: '2', label: 'Level 2' },
  { id: '3', label: 'Level 3' },
] as const;

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

function formatMatchMeta(item: MatchItem): string {
  const parts = [item.category];
  if (item.intensityScale) {
    parts.push(`L${item.intensityScale}`);
  }
  return parts.join(' • ');
}

function voteLabel(value?: string): string {
  if (value === 'yes') return 'Yes';
  if (value === 'maybe') return 'Maybe';
  if (value === 'no') return 'No';
  return 'Not set';
}

function voteBadgeColor(value?: string): string {
  if (value === 'yes') return COLORS.yes;
  if (value === 'maybe') return COLORS.maybe;
  if (value === 'no') return COLORS.no;
  return COLORS.textMuted;
}

function voteBadgeBorderColor(value?: string): string {
  if (value === 'yes') return 'rgba(34,197,94,0.4)';
  if (value === 'maybe') return 'rgba(245,158,11,0.42)';
  if (value === 'no') return 'rgba(239,68,68,0.4)';
  return 'rgba(255,255,255,0.16)';
}

function MatchVoteBadge({ label, value }: { label: string; value?: string }) {
  const color = voteBadgeColor(value);
  return (
    <View
      style={[
        styles.resultVoteBadge,
        { borderColor: voteBadgeBorderColor(value) },
      ]}
    >
      <Text style={[styles.resultVoteText, { color }]}>
        {`${label}: ${voteLabel(value)}`}
      </Text>
    </View>
  );
}

export function MatchFilters({
  visibility,
  onVisibilityChange,
  category,
  categories,
  onCategoryChange,
  intensity,
  onIntensityChange,
  role,
  onRoleChange,
}: {
  visibility: MatchVisibilityFilter;
  onVisibilityChange: (value: MatchVisibilityFilter) => void;
  category: string;
  categories: string[];
  onCategoryChange: (value: string) => void;
  intensity: 'all' | '1' | '2' | '3';
  onIntensityChange: (value: 'all' | '1' | '2' | '3') => void;
  role: MatchRoleFilter;
  onRoleChange: (value: MatchRoleFilter) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeFilterCount = [
    visibility !== 'all',
    category !== 'all',
    intensity !== 'all',
    role !== 'all',
  ].filter(Boolean).length;
  const filterSummary =
    activeFilterCount === 0
      ? 'All filters'
      : `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`;
  const categoryOptions = categories.map((item) => ({
    id: item,
    label: item === 'all' ? 'All categories' : item,
  }));

  return (
    <View style={styles.filtersCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filter matches"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={styles.filtersToggle}
      >
        <View style={styles.filtersToggleCopy}>
          <View style={styles.filtersTitleRow}>
            <Filter size={15} color={COLORS.pink} />
            <Text style={styles.filtersTitle}>FILTER MATCHES</Text>
          </View>
          <Text style={styles.filtersSummary}>{filterSummary}</Text>
        </View>
        <View style={styles.filtersToggleAction}>
          <Text style={styles.filtersToggleActionText}>
            {expanded ? 'Hide filters' : 'Show filters'}
          </Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterGroupLabel}>Result</Text>
          <FilterRow
            options={VISIBILITY_FILTERS}
            selected={visibility}
            onSelect={onVisibilityChange}
          />
          <Text style={styles.filterGroupLabel}>Category</Text>
          <FilterChipGrid
            options={categoryOptions}
            selected={category}
            onSelect={onCategoryChange}
            accessibilityLabel="Category filters"
          />
          <Text style={styles.filterGroupLabel}>Level</Text>
          <FilterRow
            options={INTENSITY_FILTERS}
            selected={intensity}
            onSelect={onIntensityChange}
          />
          <Text style={styles.filterGroupLabel}>Role</Text>
          <FilterRow
            options={ROLE_FILTERS}
            selected={role}
            onSelect={onRoleChange}
          />
        </View>
      ) : null}
    </View>
  );
}

function FilterChipGrid<T extends string>({
  options,
  selected,
  onSelect,
  accessibilityLabel,
}: {
  options: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.filterChipGrid} accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            onPress={() => onSelect(option.id)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                active && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FilterRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            onPress={() => onSelect(option.id)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                active && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function HiddenPrivacyTile({
  count,
  title,
  blurb,
  onPress,
}: {
  count: number;
  title: string;
  blurb: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count} items stay private`}
      onPress={onPress}
      style={styles.hiddenTile}
    >
      <View style={styles.hiddenIcon}>
        <EyeOff size={16} color={COLORS.textMuted} />
      </View>
      <View style={styles.hiddenCopy}>
        <Text style={styles.hiddenTitle}>
          {title.toUpperCase()}
          {count ? ` · ${count}` : ''}
        </Text>
        <Text style={styles.hiddenBlurb}>{blurb}</Text>
      </View>
    </Pressable>
  );
}

function ChecklistCard({
  title,
  steps,
  idPrefix,
  completedSteps,
  onToggleStep,
}: {
  title: string;
  steps: string[];
  idPrefix: string;
  completedSteps: Record<string, true>;
  onToggleStep: (stepId: string) => void;
}) {
  if (!steps.length) return null;
  return (
    <View style={styles.planCard}>
      <Text style={styles.planTitle}>{title.toUpperCase()}</Text>
      {steps.map((body, index) => {
        const stepId = `${idPrefix}-${index}`;
        const checked = Boolean(completedSteps[stepId]);
        return (
          <Pressable
            key={stepId}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => onToggleStep(stepId)}
            style={styles.planStep}
          >
            {checked ? (
              <CheckCircle size={18} color={COLORS.yes} />
            ) : (
              <Circle size={18} color={COLORS.textMuted} />
            )}
            <View style={styles.planStepCopy}>
              <Text style={styles.planStepBody}>{body}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function PlanActionButton({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: typeof Star;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? COLORS.pink : COLORS.textMuted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.planActionButton, active && styles.planActionButtonActive]}
    >
      <Icon size={16} color={color} fill={active ? COLORS.pink : 'none'} />
      <Text style={[styles.planActionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function MatchDetailPanel({
  item,
  explanation,
  plan,
  completedSteps,
  onToggleStep,
  onToggleFavorite,
  onToggleNextSession,
  onMarkCompleted,
  onNoteChange,
  onShareProposal,
  onClose,
  t,
}: {
  item: MatchItem;
  explanation: MatchExplanation;
  plan?: MatchPlan;
  completedSteps: Record<string, true>;
  onToggleStep: (stepId: string) => void;
  onToggleFavorite: () => void;
  onToggleNextSession: () => void;
  onMarkCompleted: () => void;
  onNoteChange: (note: string) => void;
  onShareProposal: () => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const [noteDraft, setNoteDraft] = useState(plan?.note ?? '');

  useEffect(() => {
    setNoteDraft(plan?.note ?? '');
    // Reset the draft only when switching activities, not on every keystroke
    // round-trip through the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const completedCount = plan?.completedAt.length ?? 0;

  return (
    <View style={styles.detailPanel}>
      <View style={styles.detailHeader}>
        <View style={styles.detailTitleCopy}>
          <Text style={styles.detailEyebrow}>
            {formatMatchMeta(item).toUpperCase()}
          </Text>
          <Text style={styles.detailTitle}>{item.title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close match details"
          onPress={onClose}
          style={styles.detailClose}
        >
          <X size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <View style={styles.votePillRow}>
        <View style={styles.votePill}>
          <Text style={styles.votePillLabel}>You</Text>
          <Text style={styles.votePillValue}>{voteLabel(item.myVote)}</Text>
        </View>
        <View style={styles.votePill}>
          <Text style={styles.votePillLabel}>Partner</Text>
          <Text style={styles.votePillValue}>
            {voteLabel(item.partnerVote)}
          </Text>
        </View>
      </View>

      <View style={styles.explanationCard}>
        <Text style={styles.explanationLabel}>
          {t.matches.whyThisMatch.toUpperCase()}
        </Text>
        <Text style={styles.explanationHeadline}>{explanation.headline}</Text>
        <Text style={styles.explanationNote}>
          {explanation.intensityRiskNote}
        </Text>
      </View>

      <View style={styles.roleCallout}>
        <Heart size={15} color={COLORS.pink} fill={COLORS.pink} />
        <Text style={styles.roleCalloutText}>{explanation.roleNote}</Text>
      </View>

      {item.description ? (
        <Text style={styles.detailDescription}>{item.description}</Text>
      ) : null}

      <View style={styles.starterCard}>
        <MessageCircle size={15} color={COLORS.accent} />
        <View style={styles.starterCopy}>
          <Text style={styles.starterLabel}>
            {t.matches.conversationStarter.toUpperCase()}
          </Text>
          <Text style={styles.starterText}>
            {explanation.conversationStarter}
          </Text>
        </View>
      </View>

      <ChecklistCard
        title={t.matches.prepChecklist}
        steps={explanation.prep}
        idPrefix="prep"
        completedSteps={completedSteps}
        onToggleStep={onToggleStep}
      />

      {explanation.safetyNotes.length ? (
        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>
            {t.matches.safetyNotes.toUpperCase()}
          </Text>
          {explanation.safetyNotes.map((note, index) => (
            <Text key={index} style={styles.safetyNote}>
              {`• ${note}`}
            </Text>
          ))}
        </View>
      ) : null}

      <ChecklistCard
        title={t.matches.aftercareChecklist}
        steps={explanation.aftercare}
        idPrefix="aftercare"
        completedSteps={completedSteps}
        onToggleStep={onToggleStep}
      />

      <View style={styles.planCard}>
        <Text style={styles.planTitle}>
          {t.matches.planActions.toUpperCase()}
        </Text>
        <View style={styles.planActionRow}>
          <PlanActionButton
            icon={Star}
            label={plan?.favorite ? t.matches.favorited : t.matches.favorite}
            active={Boolean(plan?.favorite)}
            onPress={onToggleFavorite}
          />
          <PlanActionButton
            icon={CalendarClock}
            label={
              plan?.nextSession ? t.matches.planned : t.matches.nextSession
            }
            active={Boolean(plan?.nextSession)}
            onPress={onToggleNextSession}
          />
          <PlanActionButton
            icon={CheckCircle}
            label={
              completedCount
                ? interpolate(t.matches.completedTimes, {
                    count: completedCount,
                  })
                : t.matches.markCompleted
            }
            active={completedCount > 0}
            onPress={onMarkCompleted}
          />
        </View>

        <Text style={styles.noteLabel}>
          {t.matches.privateNote.toUpperCase()}
        </Text>
        <TextInput
          value={noteDraft}
          onChangeText={setNoteDraft}
          onEndEditing={() => onNoteChange(noteDraft)}
          placeholder={t.matches.privateNotePlaceholder}
          placeholderTextColor={COLORS.textMuted}
          multiline
          style={styles.noteInput}
          accessibilityLabel={t.matches.privateNote}
        />

        <Pressable
          accessibilityRole="button"
          onPress={onShareProposal}
          style={styles.proposalButton}
        >
          <Share2 size={15} color={COLORS.textPrimary} />
          <Text style={styles.proposalButtonText}>
            {t.matches.shareProposal.toUpperCase()}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MatchRow({
  item,
  onSelect,
}: {
  item: MatchItem;
  onSelect?: (item: MatchItem) => void;
}) {
  return (
    <Pressable
      style={styles.resultRow}
      onPress={() => onSelect?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title} match details`}
    >
      <View
        style={styles.resultSummary}
        accessibilityLabel="Compact match summary"
      >
        <View style={styles.resultPrimaryRow}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <ChevronRight size={15} color={COLORS.textMuted} />
        </View>
        <View style={styles.resultBadgeRow}>
          {item.category ? (
            <Text style={styles.resultCategory} numberOfLines={1}>
              {item.category}
            </Text>
          ) : null}
          {item.intensityScale ? (
            <View style={styles.resultLevelBadge}>
              <Text style={styles.resultLevelText}>
                {`L${item.intensityScale}`}
              </Text>
            </View>
          ) : null}
          <MatchVoteBadge label="You" value={item.myVote} />
          <MatchVoteBadge label="Partner" value={item.partnerVote} />
        </View>
        {item.pairMode ? (
          <Text style={styles.resultRole} numberOfLines={1}>
            {describeRoleCompatibility(item)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function MatchSection({
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
  onSelect,
  hideHeader = false,
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
  onSelect?: (item: MatchItem) => void;
  hideHeader?: boolean;
}) {
  const { color, bg, border } = bucketToneColors(tone);

  return (
    <View
      style={[styles.section, { backgroundColor: bg, borderColor: border }]}
    >
      {hideHeader ? null : (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon size={16} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: `${color}1F` }]}>
            <Text style={[styles.countBadgeText, { color }]}>
              {rows.length}
            </Text>
          </View>
        </View>
      )}

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
          rows.map((item) => (
            <MatchRow key={item.id} item={item} onSelect={onSelect} />
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

function BucketCard({
  bucket,
  variant,
  viewLabel,
  sharedPicksLabel,
  onSelect,
}: {
  bucket: BucketView;
  variant: 'hero' | 'tile';
  viewLabel: string;
  sharedPicksLabel: string;
  onSelect: (id: BucketId) => void;
}) {
  const { color, bg, border } = bucketToneColors(bucket.tone);
  const Icon = bucket.icon;
  const isHero = variant === 'hero';

  return (
    <Pressable
      onPress={() => onSelect(bucket.id)}
      accessibilityRole="button"
      accessibilityLabel={`${bucket.title}, ${bucket.total} matches`}
      style={[
        isHero ? styles.bucketHero : styles.bucketTile,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      <View style={styles.bucketTopRow}>
        <View style={[styles.bucketIcon, { backgroundColor: `${color}1F` }]}>
          <Icon size={isHero ? 20 : 18} color={color} />
        </View>
        {bucket.locked ? (
          <LockKeyhole size={15} color={COLORS.textMuted} />
        ) : (
          <ChevronRight size={18} color={COLORS.textMuted} />
        )}
      </View>

      <View style={styles.bucketBody}>
        <Text style={[styles.bucketCount, { color }]}>{bucket.total}</Text>
        <Text
          style={[styles.bucketTitle, isHero && styles.bucketTitleHero]}
          numberOfLines={1}
        >
          {bucket.title}
        </Text>
        <Text style={styles.bucketBlurb} numberOfLines={2}>
          {bucket.blurb}
        </Text>
      </View>

      {isHero ? (
        <View style={styles.bucketHeroFooter}>
          <Text style={[styles.bucketHeroFooterText, { color }]}>
            {bucket.locked
              ? (bucket.unlockLabel ?? viewLabel).toUpperCase()
              : interpolate(sharedPicksLabel, {
                  count: bucket.total,
                }).toUpperCase()}
          </Text>
          <ChevronRight size={16} color={color} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function BucketOverview({
  buckets,
  viewLabel,
  sharedPicksLabel,
  onSelect,
}: {
  buckets: BucketView[];
  viewLabel: string;
  sharedPicksLabel: string;
  onSelect: (id: BucketId) => void;
}) {
  const [hero, ...tiles] = buckets;
  return (
    <View style={styles.bucketOverview}>
      {hero ? (
        <BucketCard
          bucket={hero}
          variant="hero"
          viewLabel={viewLabel}
          sharedPicksLabel={sharedPicksLabel}
          onSelect={onSelect}
        />
      ) : null}
      <View style={styles.bucketTileRow}>
        {tiles.map((bucket) => (
          <BucketCard
            key={bucket.id}
            bucket={bucket}
            variant="tile"
            viewLabel={viewLabel}
            sharedPicksLabel={sharedPicksLabel}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  );
}

export function BucketDetailView({
  bucket,
  backLabel,
  emptyTitle,
  emptySubtitle,
  filters,
  onBack,
  onSelect,
}: {
  bucket: BucketView;
  backLabel: string;
  emptyTitle: string;
  emptySubtitle: string;
  filters: React.ReactNode;
  onBack: () => void;
  onSelect: (item: MatchItem) => void;
}) {
  const { color } = bucketToneColors(bucket.tone);
  const Icon = bucket.icon;

  return (
    <View style={styles.bucketDetail}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        style={styles.backChip}
      >
        <ChevronLeft size={16} color={COLORS.textSub} />
        <Text style={styles.backChipText}>{backLabel}</Text>
      </Pressable>

      <View style={styles.bucketDetailHeader}>
        <View style={styles.sectionTitleRow}>
          <Icon size={18} color={color} />
          <Text style={[styles.bucketDetailTitle, { color }]}>
            {bucket.title.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: `${color}1F` }]}>
          <Text style={[styles.countBadgeText, { color }]}>{bucket.total}</Text>
        </View>
      </View>

      {filters}

      <MatchSection
        tone={bucket.tone}
        icon={bucket.icon}
        title={bucket.title.toUpperCase()}
        rows={bucket.rows}
        emptyTitle={emptyTitle}
        emptySubtitle={emptySubtitle}
        locked={bucket.locked}
        lockTitle={bucket.lockTitle}
        unlockLabel={bucket.unlockLabel}
        onUnlock={bucket.onUnlock}
        onSelect={onSelect}
        hideHeader
      />

      {bucket.lockedNote && bucket.onUnlock ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={bucket.lockedNote}
          onPress={bucket.onUnlock}
          style={styles.lockedNoteRow}
        >
          <LockKeyhole size={14} color={COLORS.textMuted} />
          <Text style={styles.lockedNoteText}>{bucket.lockedNote}</Text>
        </Pressable>
      ) : null}
    </View>
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '800',
  },
  rowList: {
    gap: 8,
  },
  bucketOverview: {
    gap: 12,
  },
  bucketHero: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
    ...SHADOWS.card,
  },
  bucketTileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bucketTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  bucketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bucketIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketBody: {
    gap: 2,
  },
  bucketCount: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bucketTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bucketTitleHero: {
    fontSize: 18,
  },
  bucketBlurb: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
  },
  bucketHeroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  bucketHeroFooterText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bucketDetail: {
    gap: 12,
  },
  backChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  backChipText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  bucketDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bucketDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  resultRow: {
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.024)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
  },
  resultSummary: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    gap: 6,
    alignItems: 'stretch',
  },
  resultPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  resultRole: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
  },
  resultBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  resultLevelBadge: {
    minHeight: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.42)',
    backgroundColor: 'rgba(255,45,146,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  resultLevelText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  resultCategory: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '700',
  },
  resultVoteBadge: {
    minHeight: 24,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  resultVoteText: {
    fontSize: 16,
    fontWeight: '800',
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
    fontSize: 16,
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
  filtersCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.2)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    padding: 14,
    gap: 14,
  },
  filtersToggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  filtersToggleCopy: {
    flex: 1,
    gap: 4,
  },
  filtersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  filtersTitle: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  filtersSummary: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  filtersToggleAction: {
    minWidth: 92,
    minHeight: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.42)',
    backgroundColor: 'rgba(255,45,146,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  filtersToggleActionText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  filtersPanel: {
    gap: 8,
    paddingTop: 2,
  },
  filterGroupLabel: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  filterChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  filterRow: {
    gap: 7,
    paddingRight: 6,
  },
  filterChip: {
    minHeight: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
  },
  filterChipActive: {
    borderColor: 'rgba(255,45,146,0.54)',
    backgroundColor: 'rgba(255,45,146,0.15)',
  },
  filterChipText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: COLORS.textPrimary,
  },
  detailPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.24)',
    backgroundColor: COLORS.card,
    padding: 16,
    gap: 14,
    ...SHADOWS.card,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailTitleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  detailEyebrow: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  detailTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  detailClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  votePillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  votePill: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
    gap: 3,
  },
  votePillLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  votePillValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  roleCallout: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,45,146,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleCalloutText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  detailDescription: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  planCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(0,0,0,0.12)',
    padding: 12,
    gap: 10,
  },
  planTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: 10,
  },
  planStepCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  planStepTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  planStepBody: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  hiddenTile: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.024)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hiddenIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  hiddenCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  hiddenTitle: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  hiddenBlurb: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
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
  lockedNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.026)',
    paddingHorizontal: 12,
  },
  lockedNoteText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  explanationCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.28)',
    backgroundColor: 'rgba(139,92,246,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  explanationLabel: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  explanationHeadline: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
  explanationNote: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  starterCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.28)',
    backgroundColor: 'rgba(167,139,250,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  starterCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  starterLabel: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  starterText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  safetyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.24)',
    backgroundColor: 'rgba(239,68,68,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
  },
  safetyTitle: {
    color: COLORS.no,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  safetyNote: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  planActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  planActionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  planActionButtonActive: {
    borderColor: 'rgba(255,45,146,0.42)',
    backgroundColor: 'rgba(255,45,146,0.12)',
  },
  planActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  noteLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  noteInput: {
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(0,0,0,0.18)',
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  proposalButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.42)',
    backgroundColor: 'rgba(255,45,146,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  proposalButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
