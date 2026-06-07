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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  Ellipsis,
  Filter,
  Heart,
  LockKeyhole,
  Share2,
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
  createMatchPlan,
  describeRoleCompatibility,
  filterMatchItems,
  type MatchExperienceItem,
  type MatchRoleFilter,
  type MatchVisibilityFilter,
} from '../../lib/match/experience';
import { computeRevealBuckets } from '../../lib/match/reveal';
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

type MatchItem = MatchExperienceItem;

type BucketId = 'yes' | 'partial' | 'maybe';
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
        record.pairPreference
          ? { value: record.vote, pairPreference: record.pairPreference }
          : record.vote,
      ])
    ) as Record<string, KinkVote>;
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

  const allMatches = useMemo(
    () => [...mutualYes, ...partialYesMaybe, ...mutualMaybe],
    [mutualYes, partialYesMaybe, mutualMaybe]
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

  const filteredMutualYes = useMemo(
    () => filterMatchItems(mutualYes, activeFilters),
    [activeFilters, mutualYes]
  );
  const filteredPartialYesMaybe = useMemo(
    () => filterMatchItems(partialYesMaybe, activeFilters),
    [activeFilters, partialYesMaybe]
  );
  const filteredMutualMaybe = useMemo(
    () => filterMatchItems(mutualMaybe, activeFilters),
    [activeFilters, mutualMaybe]
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

  const selectedPlan = useMemo(
    () => (selectedMatch ? createMatchPlan(selectedMatch) : []),
    [selectedMatch]
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

  const handleUnlock = useCallback((bucket: RevealConsentBucket) => {
    void requestRevealUnlock(bucket);
  }, []);

  const buckets = useMemo<BucketView[]>(
    () => [
      {
        id: 'yes',
        tone: 'yes',
        icon: Check,
        title: t.matches.mutualYes,
        blurb: t.matches.bucketYesBlurb,
        total: mutualYes.length,
        rows: filteredMutualYes,
        locked: false,
      },
      {
        id: 'partial',
        tone: 'partial',
        icon: LockKeyhole,
        title: t.matches.partialMatch,
        blurb: t.matches.bucketPartialBlurb,
        total: partialYesMaybe.length,
        rows: filteredPartialYesMaybe,
        locked: !partialUnlocked,
        lockTitle: t.matches.partialYesLocked,
        unlockLabel:
          isRemotePartner && partialLocalConsent
            ? t.matches.waitingForPartner
            : t.matches.unlockPartialYes,
        onUnlock: () => handleUnlock('partialYesMaybe'),
      },
      {
        id: 'maybe',
        tone: 'maybe',
        icon: Ellipsis,
        title: t.matches.mutualMaybe,
        blurb: t.matches.bucketMaybeBlurb,
        total: mutualMaybe.length,
        rows: filteredMutualMaybe,
        locked: !maybeUnlocked,
        lockTitle: t.matches.mutualMaybeLocked,
        unlockLabel:
          isRemotePartner && maybeLocalConsent
            ? t.matches.waitingForPartner
            : t.matches.unlockMutualMaybe,
        onUnlock: () => handleUnlock('mutualMaybe'),
      },
    ],
    [
      filteredMutualMaybe,
      filteredMutualYes,
      filteredPartialYesMaybe,
      handleUnlock,
      isRemotePartner,
      maybeLocalConsent,
      maybeUnlocked,
      mutualMaybe.length,
      mutualYes.length,
      partialLocalConsent,
      partialUnlocked,
      partialYesMaybe.length,
      t.matches.bucketMaybeBlurb,
      t.matches.bucketPartialBlurb,
      t.matches.bucketYesBlurb,
      t.matches.mutualMaybe,
      t.matches.mutualMaybeLocked,
      t.matches.mutualYes,
      t.matches.partialMatch,
      t.matches.partialYesLocked,
      t.matches.unlockMutualMaybe,
      t.matches.unlockPartialYes,
      t.matches.waitingForPartner,
    ]
  );

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <MatchScreenContent
          selectedDetail={
            selectedMatch ? (
              <MatchDetailPanel
                item={selectedMatch}
                plan={selectedPlan}
                completedSteps={completedPlanSteps}
                onToggleStep={togglePlanStep}
                onClose={() => setSelectedMatchId(null)}
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

function MatchDetailPanel({
  item,
  plan,
  completedSteps,
  onToggleStep,
  onClose,
}: {
  item: MatchItem;
  plan: ReturnType<typeof createMatchPlan>;
  completedSteps: Record<string, true>;
  onToggleStep: (stepId: string) => void;
  onClose: () => void;
}) {
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

      <View style={styles.roleCallout}>
        <Heart size={15} color={COLORS.pink} fill={COLORS.pink} />
        <Text style={styles.roleCalloutText}>
          {describeRoleCompatibility(item)}
        </Text>
      </View>

      {item.description ? (
        <Text style={styles.detailDescription}>{item.description}</Text>
      ) : null}

      <View style={styles.planCard}>
        <Text style={styles.planTitle}>TRY TONIGHT</Text>
        {plan.map((step) => {
          const checked = Boolean(completedSteps[step.id]);
          return (
            <Pressable
              key={step.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => onToggleStep(step.id)}
              style={styles.planStep}
            >
              {checked ? (
                <CheckCircle size={18} color={COLORS.yes} />
              ) : (
                <Circle size={18} color={COLORS.textMuted} />
              )}
              <View style={styles.planStepCopy}>
                <Text style={styles.planStepTitle}>{step.title}</Text>
                <Text style={styles.planStepBody}>{step.body}</Text>
              </View>
            </Pressable>
          );
        })}
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
    fontSize: 15,
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
    fontSize: 15,
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
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '800',
  },
  resultCategory: {
    color: COLORS.pink,
    fontSize: 15,
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
    fontSize: 15,
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
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  filtersPanel: {
    gap: 8,
    paddingTop: 2,
  },
  filterGroupLabel: {
    color: COLORS.pink,
    fontSize: 15,
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
    fontSize: 15,
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
});
