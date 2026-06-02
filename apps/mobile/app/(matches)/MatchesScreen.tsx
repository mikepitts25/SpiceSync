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

        {selectedMatch ? (
          <MatchDetailPanel
            item={selectedMatch}
            plan={selectedPlan}
            completedSteps={completedPlanSteps}
            onToggleStep={togglePlanStep}
            onClose={() => setSelectedMatchId(null)}
          />
        ) : null}

        <MatchSection
          tone="yes"
          icon={Check}
          title={t.matches.mutualYes.toUpperCase()}
          rows={filteredMutualYes}
          emptyTitle={t.matches.noSharedPicks}
          emptySubtitle={t.matches.keepSwipingShort}
          onSelect={handleSelectMatch}
        />
        <MatchSection
          tone="partial"
          icon={LockKeyhole}
          title={t.matches.partialMatch.toUpperCase()}
          rows={filteredPartialYesMaybe}
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
          onSelect={handleSelectMatch}
        />
        <MatchSection
          tone="maybe"
          icon={Ellipsis}
          title={t.matches.mutualMaybe.toUpperCase()}
          rows={filteredMutualMaybe}
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
          onSelect={handleSelectMatch}
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

function MatchFilters({
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
  return (
    <View style={styles.filtersCard}>
      <View style={styles.filtersTitleRow}>
        <Filter size={15} color={COLORS.pink} />
        <Text style={styles.filtersTitle}>FILTER MATCHES</Text>
      </View>

      <FilterRow
        options={VISIBILITY_FILTERS}
        selected={visibility}
        onSelect={onVisibilityChange}
      />
      <FilterRow
        options={categories.map((item) => ({
          id: item,
          label: item === 'all' ? 'All categories' : item,
        }))}
        selected={category}
        onSelect={onCategoryChange}
      />
      <FilterRow
        options={INTENSITY_FILTERS}
        selected={intensity}
        onSelect={onIntensityChange}
      />
      <FilterRow
        options={ROLE_FILTERS}
        selected={role}
        onSelect={onRoleChange}
      />
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

      {item.tags.length ? (
        <View style={styles.tagRow}>
          {item.tags.slice(0, 8).map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
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
  onSelect,
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
          rows.slice(0, 6).map((item) => (
            <Pressable
              key={item.id}
              style={styles.resultRow}
              onPress={() => onSelect?.(item)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title} match details`}
            >
              <View style={styles.resultCopy}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                {item.pairMode ? (
                  <Text style={styles.resultRole}>
                    {describeRoleCompatibility(item)}
                  </Text>
                ) : null}
              </View>
              <View style={styles.resultMeta}>
                <Text style={styles.resultCategory}>
                  {formatMatchMeta(item).toUpperCase()}
                </Text>
                <ChevronRight size={14} color={COLORS.textMuted} />
              </View>
            </Pressable>
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
    minHeight: 48,
  },
  resultCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  resultTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  resultRole: {
    color: COLORS.textSub,
    fontSize: 10,
    fontWeight: '600',
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  filtersCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.024)',
    padding: 12,
    gap: 9,
  },
  filtersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  filtersTitle: {
    color: COLORS.pink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
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
    fontSize: 11,
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
    fontSize: 10,
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
    fontSize: 11,
    fontWeight: '700',
  },
  votePillValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
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
    fontSize: 13,
    fontWeight: '700',
  },
  detailDescription: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tagChip: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagText: {
    color: COLORS.textSub,
    fontSize: 10,
    fontWeight: '700',
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
    fontSize: 11,
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
    fontSize: 13,
    fontWeight: '800',
  },
  planStepBody: {
    color: COLORS.textSub,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
