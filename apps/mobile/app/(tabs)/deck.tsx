import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Check, Ellipsis, X } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import {
  AccentBar,
  ActionCircle,
  AppHeader,
  AppTabBar,
  IntensityDots,
} from '../../components/app-chrome';
import ProfileAvatarIcon from '../../components/ProfileAvatarIcon';
import { ScreenTour } from '../../components/ScreenTour';
import { useKinks, type KinkItem } from '../../lib/data';
import {
  filterKinksByTier,
  TIER_FILTER_OPTIONS,
  useFilters,
  type Tier,
} from '../../lib/state/filters';
import { useProfilesStore } from '../../lib/state/profiles';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { usePartnerVotesStore } from '../../lib/sync/partnerVotes';
import { useSettingsStore } from '../../src/stores/settingsStore';
import {
  useVotesStore,
  type PairPreference,
  type VoteValue,
} from '../../src/stores/votes';
import { interpolate, useTranslation } from '../../lib/i18n';
import {
  COLORS,
  GRADIENTS,
  RADII,
  SHADOWS,
  TYPOGRAPHY,
} from '../../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const OFFSCREEN_X = SCREEN_W * 1.4;
const OFFSCREEN_Y = SCREEN_H * 1.1;

type SwipeDirection = 'left' | 'right' | 'up';

type SwipeDeckHandle = {
  programmaticSwipe: (dir: SwipeDirection) => void;
  isAnimating: () => boolean;
};

const TIER_COLORS: Record<string, string> = {
  soft: COLORS.pink,
  naughty: COLORS.purple,
  xxx: COLORS.no,
};

function getTierOptionLabel(
  tier: Tier,
  t: ReturnType<typeof useTranslation>['t']
) {
  if (!tier) return t.deck.allFilter;
  if (tier === 'soft') return t.discover.soft;
  if (tier === 'naughty') return t.discover.naughty;
  return t.discover.xxx;
}

const SwipeableKinkCard = forwardRef<
  SwipeDeckHandle,
  {
    item: KinkItem;
    partnerName: string;
    partnerEmoji?: string | null;
    partnerVoted: boolean;
    partnerVotedLabel: string;
    partnerNotVotedLabel: string;
    pairPreference: PairPreference;
    onPairPreferenceChange: (value: PairPreference) => void;
    onSwipe: (dir: SwipeDirection) => void;
    onSwipeStart: () => void;
    onSwipeEnd: () => void;
  }
>(function SwipeableKinkCard(
  {
    item,
    partnerName,
    partnerEmoji,
    partnerVoted,
    partnerVotedLabel,
    partnerNotVotedLabel,
    pairPreference,
    onPairPreferenceChange,
    onSwipe,
    onSwipeStart,
    onSwipeEnd,
  },
  ref
) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const animating = useSharedValue(false);
  const tierColor = item.tier
    ? (TIER_COLORS[item.tier] ?? COLORS.pink)
    : COLORS.pink;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${x.value / 24}deg` },
    ],
  }));

  const reset = () => {
    'worklet';
    x.value = withSpring(0, { damping: 15, stiffness: 150 });
    y.value = withSpring(0, { damping: 15, stiffness: 150 });
  };

  const performSwipe = (dir: SwipeDirection) => {
    'worklet';
    const targetX =
      dir === 'right' ? OFFSCREEN_X : dir === 'left' ? -OFFSCREEN_X : 0;
    const targetY = dir === 'up' ? -OFFSCREEN_Y : 0;
    const finish = (finished?: boolean) => {
      'worklet';
      animating.value = false;
      x.value = 0;
      y.value = 0;
      runOnJS(onSwipeEnd)();
      if (finished) {
        runOnJS(onSwipe)(dir);
      }
    };

    if (dir === 'up') {
      y.value = withTiming(
        targetY,
        { duration: 230, easing: Easing.out(Easing.cubic) },
        finish
      );
      x.value = withTiming(targetX, {
        duration: 230,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      x.value = withTiming(
        targetX,
        { duration: 230, easing: Easing.out(Easing.cubic) },
        finish
      );
      y.value = withTiming(targetY, {
        duration: 230,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  const triggerSwipe = (dir: SwipeDirection) => {
    if (animating.value) return;
    animating.value = true;
    onSwipeStart();
    performSwipe(dir);
  };

  const handleEnd = (dx: number, dy: number) => {
    'worklet';
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 100) {
        runOnJS(triggerSwipe)('right');
        return;
      }
      if (dx < -100) {
        runOnJS(triggerSwipe)('left');
        return;
      }
    } else if (dy < -80) {
      runOnJS(triggerSwipe)('up');
      return;
    }
    reset();
  };

  useImperativeHandle(ref, () => ({
    programmaticSwipe: (dir: SwipeDirection) => triggerSwipe(dir),
    isAnimating: () => animating.value,
  }));

  return (
    <PanGestureHandler
      onGestureEvent={(event) => {
        x.value = Number(event.nativeEvent.translationX ?? 0);
        y.value = Number(event.nativeEvent.translationY ?? 0);
      }}
      onEnded={(event) => {
        handleEnd(
          Number(event.nativeEvent.translationX ?? 0),
          Number(event.nativeEvent.translationY ?? 0)
        );
      }}
    >
      <Animated.View style={[styles.kinkCard, animatedStyle]}>
        <LinearGradient
          colors={GRADIENTS.cardAccentBar}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.progressRail}
        />

        <View style={styles.cardInner}>
          <View style={styles.cardTopRow}>
            <Text style={styles.categoryLabel}>
              {(item.category || 'Sensation').toUpperCase()}
            </Text>
            <IntensityDots value={item.intensityScale ?? 1} color={tierColor} />
          </View>

          <AccentBar />

          <Text style={styles.kinkTitle}>{item.title}</Text>
          <Text style={styles.kinkBody}>{item.description}</Text>

          {item.pairMode ? (
            <View style={styles.roleSelector} accessibilityRole="tablist">
              {(['give', 'receive', 'both'] as PairPreference[]).map(
                (option) => {
                  const active = pairPreference === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      onPress={() => onPairPreferenceChange(option)}
                      style={[
                        styles.roleOption,
                        active && styles.roleOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          active && styles.roleOptionTextActive,
                        ]}
                      >
                        {option === 'give'
                          ? 'Give'
                          : option === 'receive'
                            ? 'Receive'
                            : 'Both'}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          ) : null}

          <View style={styles.tagRow}>
            {(item.tags ?? []).slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.partnerBlock}>
            <View style={styles.partnerPill}>
              <ProfileAvatarIcon
                avatar={partnerEmoji}
                size={24}
                framed={false}
              />
              <View style={styles.partnerCopy}>
                <Text style={styles.partnerName}>{partnerName}</Text>
                <Text style={styles.partnerStatus}>
                  {partnerVoted
                    ? `${partnerVotedLabel} ✓`
                    : partnerNotVotedLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
});

export default function DeckScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const { selectedTier, setTier, clearTier } = useFilters();
  const { t } = useTranslation();
  const coupleLink = useCoupleLinkStore((state) => state.link);
  const isRemotePartner = coupleLink?.status === 'active';
  const { isHydrated, hasActive, profiles, activeProfileId } = useProfilesStore(
    useShallow((state) => ({
      isHydrated: state.isHydrated(),
      hasActive: state.hasActiveProfile(),
      profiles: state.getProfiles(),
      activeProfileId: state.getActiveProfileId(),
    }))
  );

  useEffect(() => {
    if (isHydrated && !hasActive) {
      router.replace('/welcome');
    }
  }, [isHydrated, hasActive, router]);

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );
  const partnerProfile = useMemo(
    () => profiles.find((profile) => profile.id !== activeProfileId) ?? null,
    [profiles, activeProfileId]
  );
  const activeProfileIdValue = activeProfile?.id ?? null;
  const partnerProfileIdValue = partnerProfile?.id ?? null;
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const setVote = useVotesStore((state) => state.setVote);
  const clearVotesForKinks = useVotesStore((state) => state.clearVotesForKinks);

  const filteredKinks = useMemo(
    () => filterKinksByTier(kinks, selectedTier),
    [kinks, selectedTier]
  );
  const activeFilterLabel = useMemo(() => {
    if (!selectedTier) return t.deck.allIntensity;
    if (selectedTier === 'xxx') return t.deck.xxxIntensity;
    return interpolate(t.deck.tierIntensity, {
      tier: selectedTier[0].toUpperCase() + selectedTier.slice(1),
    });
  }, [
    selectedTier,
    t.deck.allIntensity,
    t.deck.tierIntensity,
    t.deck.xxxIntensity,
  ]);

  const allKinkIdsInFilter = useMemo(
    () => filteredKinks.map((k) => k.id),
    [filteredKinks]
  );

  const activeProfileVotes = useVotesStore((state) =>
    activeProfileIdValue
      ? state.votesByProfile[activeProfileIdValue]
      : undefined
  );
  const partnerVotes = useVotesStore((state) =>
    partnerProfileIdValue
      ? state.votesByProfile[partnerProfileIdValue]
      : undefined
  );
  const remotePartnerVotes = usePartnerVotesStore((state) => state.byCardId);

  const queue = useMemo(() => {
    if (!activeProfileIdValue) return filteredKinks;
    const voted = activeProfileVotes || {};
    return filteredKinks.filter((kink) => voted[kink.id] === undefined);
  }, [filteredKinks, activeProfileIdValue, activeProfileVotes]);

  const key = `${activeProfileIdValue ?? 'none'}::${selectedTier ?? 'all'}`;
  const [indexByKey, setIndexByKey] = useState<Record<string, number>>({});
  const [cardAnimating, setCardAnimating] = useState(false);
  const [pairPreference, setPairPreference] = useState<PairPreference>('both');
  const queuedVoteRef = useRef<VoteValue | null>(null);
  const topCardRef = useRef<SwipeDeckHandle>(null);
  const index = indexByKey[key] ?? 0;
  const current = queue[index] ?? null;

  useEffect(() => {
    setIndexByKey((prev) => ({ ...prev, [key]: 0 }));
  }, [key]);

  useEffect(() => {
    const max = Math.max(0, queue.length - 1);
    if (index > max) {
      setIndexByKey((prev) => ({
        ...prev,
        [key]: Math.max(0, Math.min(index, max)),
      }));
    }
  }, [queue.length, index, key]);

  useEffect(() => {
    setPairPreference('both');
  }, [current?.id]);

  useFocusEffect(
    useCallback(() => {
      return () => {};
    }, [])
  );

  const handleSwipeResult = useCallback(
    (dir: SwipeDirection) => {
      if (!current || !activeProfileIdValue) {
        queuedVoteRef.current = null;
        setCardAnimating(false);
        return;
      }

      const directionToVote: Record<SwipeDirection, VoteValue> = {
        left: 'no',
        right: 'yes',
        up: 'maybe',
      };

      const voteValue = queuedVoteRef.current ?? directionToVote[dir];
      queuedVoteRef.current = null;

      setVote(
        activeProfileIdValue,
        current.id,
        voteValue,
        current.pairMode ? pairPreference : undefined
      );
      setCardAnimating(false);
    },
    [current, activeProfileIdValue, pairPreference, setVote]
  );

  const handleButtonVote = useCallback(
    (value: VoteValue) => {
      if (!current || cardAnimating) return;
      const handle = topCardRef.current;
      if (!handle || handle.isAnimating()) return;
      const valueToDirection: Record<VoteValue, SwipeDirection> = {
        yes: 'right',
        no: 'left',
        maybe: 'up',
      };

      queuedVoteRef.current = value;
      handle.programmaticSwipe(valueToDirection[value]);
    },
    [cardAnimating, current]
  );

  const applyTierFilter = useCallback(
    (tier: Tier) => {
      if (tier) {
        setTier(tier);
      } else {
        clearTier();
      }
    },
    [clearTier, setTier]
  );

  if (!isHydrated || !hasActive) {
    return null;
  }

  if (!activeProfile) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" />
        <AppHeader />
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>{t.profiles.chooseProfile}</Text>
          <Text style={styles.emptyCopy}>
            {t.profiles.selectProfileToSwipe}
          </Text>
        </View>
        <AppTabBar active="deck" />
      </SafeAreaView>
    );
  }

  if (!filteredKinks.length) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" />
        <AppHeader />
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>{t.deck.noItemsInCategory}</Text>
          <Text style={styles.emptyCopy}>{t.deck.tryAnotherCategory}</Text>
        </View>
        <AppTabBar active="deck" />
      </SafeAreaView>
    );
  }

  if (!queue.length || !current) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" />
        <AppHeader />
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>{t.deck.caughtUpTitle}</Text>
          <Text style={styles.emptyCopy}>{t.deck.caughtUpDesc}</Text>
          <View style={styles.emptyActions}>
            <Pressable
              style={styles.outlineButton}
              onPress={() => {
                if (!activeProfileIdValue) return;
                clearVotesForKinks(activeProfileIdValue, allKinkIdsInFilter);
                setIndexByKey((prev) => ({ ...prev, [key]: 0 }));
              }}
            >
              <Text style={styles.outlineButtonText}>
                {t.deck.resetDeck.toUpperCase()}
              </Text>
            </Pressable>
            <Pressable
              style={styles.gradientButtonPress}
              onPress={() => router.navigate('/(tabs)/matches')}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.gradientButton}
              >
                <Text style={styles.gradientButtonText}>
                  {t.deck.viewMatches.toUpperCase()}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
        <AppTabBar active="deck" />
      </SafeAreaView>
    );
  }

  const partnerName = isRemotePartner
    ? (coupleLink?.partnerProfileName ?? t.deck.partnerFallback)
    : (partnerProfile?.displayName ??
      partnerProfile?.name ??
      t.deck.partnerFallback);
  const partnerEmoji = isRemotePartner
    ? (coupleLink?.partnerProfileAvatar ?? null)
    : partnerProfile?.emoji;
  const partnerVoted = isRemotePartner
    ? !!remotePartnerVotes[current.id]
    : !!partnerVotes?.[current.id];

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <View style={styles.content}>
        <LinearGradient
          colors={GRADIENTS.cardAccentBar}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.topProgress}
        />

        <ScreenTour
          screenId="deck"
          screenLabel={t.tabs.deck}
          steps={t.tours.deck}
          style={styles.tourCard}
        />

        <View style={styles.filterBlock}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>
              {t.common.intensity.toUpperCase()}
            </Text>
            <Text style={styles.filterSummary}>{activeFilterLabel}</Text>
          </View>

          <View style={styles.tierRow}>
            {TIER_FILTER_OPTIONS.map((option) => {
              const active = selectedTier === option.value;
              return (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => applyTierFilter(option.value)}
                  style={styles.tierPress}
                >
                  {active ? (
                    <LinearGradient
                      colors={GRADIENTS.primary}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.tierActive}
                    >
                      <Text style={styles.tierActiveText}>
                        {getTierOptionLabel(option.value, t).toUpperCase()}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.tierInactive}>
                      <Text style={styles.tierInactiveText}>
                        {getTierOptionLabel(option.value, t).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.deckArea}>
          <SwipeableKinkCard
            ref={topCardRef}
            item={current}
            partnerName={partnerName}
            partnerEmoji={partnerEmoji}
            partnerVoted={partnerVoted}
            partnerVotedLabel={t.deck.partnerVoted}
            partnerNotVotedLabel={t.deck.partnerNotVoted}
            pairPreference={pairPreference}
            onPairPreferenceChange={setPairPreference}
            onSwipe={handleSwipeResult}
            onSwipeStart={() => setCardAnimating(true)}
            onSwipeEnd={() => setCardAnimating(false)}
          />
        </View>

        <View style={styles.actionRow}>
          <ActionCircle
            label={t.deck.pass.toUpperCase()}
            icon={X}
            color={COLORS.no}
            onPress={() => handleButtonVote('no')}
          />
          <ActionCircle
            label={t.deck.yes.toUpperCase()}
            icon={Check}
            variant="gradient"
            color={COLORS.pink}
            size={66}
            iconSize={28}
            onPress={() => handleButtonVote('yes')}
          />
          <ActionCircle
            label={t.deck.maybe.toUpperCase()}
            icon={Ellipsis}
            color={COLORS.maybe}
            onPress={() => handleButtonVote('maybe')}
          />
        </View>
      </View>

      <AppTabBar active="deck" />
    </SafeAreaView>
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
  },
  topProgress: {
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  tourCard: {
    marginBottom: 10,
  },
  filterBlock: {
    gap: 8,
    paddingBottom: 10,
  },
  filterHeader: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  filterTitle: {
    color: COLORS.pink,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  filterSummary: {
    flexShrink: 1,
    color: COLORS.textSub,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  tierRow: {
    flexDirection: 'row',
    gap: 7,
  },
  tierPress: {
    flex: 1,
    minWidth: 0,
    borderRadius: 15,
    overflow: 'hidden',
  },
  tierActive: {
    minHeight: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tierActiveText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  tierInactive: {
    minHeight: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: COLORS.cardAlt,
  },
  tierInactiveText: {
    color: 'rgba(255,255,255,0.43)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  deckArea: {
    flex: 1,
  },
  kinkCard: {
    flex: 1,
    width: '100%',
    maxWidth: Math.min(SCREEN_W - 32, 460),
    alignSelf: 'center',
    borderRadius: RADII.card,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  progressRail: {
    height: 3,
    width: '100%',
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    color: COLORS.pink,
    ...TYPOGRAPHY.label,
  },
  kinkTitle: {
    color: COLORS.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
  },
  kinkBody: {
    ...TYPOGRAPHY.body,
  },
  roleSelector: {
    minHeight: 42,
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardAlt,
    padding: 4,
    gap: 4,
  },
  roleOption: {
    flex: 1,
    minWidth: 0,
    minHeight: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  roleOptionActive: {
    backgroundColor: COLORS.pink,
  },
  roleOptionText: {
    color: COLORS.textSub,
    fontSize: 12,
    fontWeight: '800',
  },
  roleOptionTextActive: {
    color: COLORS.textPrimary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.21)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    color: COLORS.pink,
    fontSize: 12,
    fontWeight: '600',
  },
  partnerBlock: {
    gap: 8,
  },
  partnerLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  partnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 10,
  },
  partnerCopy: {
    flex: 1,
  },
  partnerName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  partnerStatus: {
    color: COLORS.textSub,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  centerState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCopy: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  outlineButton: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlineButtonText: {
    color: COLORS.pink,
    fontSize: 12,
    fontWeight: '800',
  },
  gradientButtonPress: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButtonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
});
