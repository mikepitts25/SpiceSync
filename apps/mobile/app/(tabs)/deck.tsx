import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
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
import { useTranslation } from '../../lib/i18n';
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
const SWIPE_EXIT_MS = 230;
const SWIPE_FADE_OUT_MS = 180;
const ACTIVE_CARD_FADE_IN_MS = 220;

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

type KinkCardFrameProps = {
  item: KinkItem;
  partnerName: string;
  partnerEmoji?: string | null;
  partnerVoted: boolean;
  partnerVotedLabel: string;
  partnerNotVotedLabel: string;
  pairPreference: PairPreference;
  onPairPreferenceChange?: (value: PairPreference) => void;
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

function KinkCardFrame({
  item,
  partnerName,
  partnerEmoji,
  partnerVoted,
  partnerVotedLabel,
  partnerNotVotedLabel,
  pairPreference,
  onPairPreferenceChange,
}: KinkCardFrameProps) {
  const tierColor = item.tier
    ? (TIER_COLORS[item.tier] ?? COLORS.pink)
    : COLORS.pink;
  const roleSelectorEnabled = !!onPairPreferenceChange;

  return (
    <>
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

        <View style={styles.cardMainContent}>
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
                      disabled={!roleSelectorEnabled}
                      onPress={() => onPairPreferenceChange?.(option)}
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
        </View>

        <View style={styles.partnerBlock}>
          <View style={styles.partnerPill}>
            <ProfileAvatarIcon avatar={partnerEmoji} size={24} framed={false} />
            <View style={styles.partnerCopy}>
              <Text style={styles.partnerName}>{partnerName}</Text>
              <Text style={styles.partnerStatus}>
                {partnerVoted ? `${partnerVotedLabel} ✓` : partnerNotVotedLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );
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
    enterProgress: { value: number };
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
    enterProgress,
  },
  ref
) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const animating = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value * enterProgress.value,
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
    cardOpacity.value = withTiming(1, {
      duration: SWIPE_FADE_OUT_MS,
      easing: Easing.out(Easing.quad),
    });
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
      cardOpacity.value = withTiming(0, {
        duration: SWIPE_FADE_OUT_MS,
        easing: Easing.out(Easing.quad),
      });
      y.value = withTiming(
        targetY,
        { duration: SWIPE_EXIT_MS, easing: Easing.out(Easing.cubic) },
        finish
      );
      x.value = withTiming(targetX, {
        duration: SWIPE_EXIT_MS,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      cardOpacity.value = withTiming(0, {
        duration: SWIPE_FADE_OUT_MS,
        easing: Easing.out(Easing.quad),
      });
      x.value = withTiming(
        targetX,
        { duration: SWIPE_EXIT_MS, easing: Easing.out(Easing.cubic) },
        finish
      );
      y.value = withTiming(targetY, {
        duration: SWIPE_EXIT_MS,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  const triggerSwipe = (dir: SwipeDirection) => {
    if (animating.value) return;
    animating.value = true;
    cardOpacity.value = 1;
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
        <KinkCardFrame
          item={item}
          partnerName={partnerName}
          partnerEmoji={partnerEmoji}
          partnerVoted={partnerVoted}
          partnerVotedLabel={partnerVotedLabel}
          partnerNotVotedLabel={partnerNotVotedLabel}
          pairPreference={pairPreference}
          onPairPreferenceChange={onPairPreferenceChange}
        />
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
  const previousCardIdRef = useRef<string | null>(null);
  const activeCardOpacity = useSharedValue(1);
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

  useLayoutEffect(() => {
    if (!current?.id) return;

    const previousCardId = previousCardIdRef.current;
    previousCardIdRef.current = current.id;

    if (!previousCardId || previousCardId === current.id) {
      activeCardOpacity.value = 1;
      return;
    }

    activeCardOpacity.value = 0;
    activeCardOpacity.value = withTiming(1, {
      duration: ACTIVE_CARD_FADE_IN_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [current?.id, activeCardOpacity]);

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

      activeCardOpacity.value = 0;
      setVote(
        activeProfileIdValue,
        current.id,
        voteValue,
        current.pairMode ? pairPreference : undefined
      );
      setCardAnimating(false);
    },
    [current, activeProfileIdValue, pairPreference, setVote, activeCardOpacity]
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
          </View>

          <View style={styles.tierGrid}>
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
                        {getTierOptionLabel(option.value, t)}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.tierInactive}>
                      <Text style={styles.tierInactiveText}>
                        {getTierOptionLabel(option.value, t)}
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
            key={current.id}
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
            enterProgress={activeCardOpacity}
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.2)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    padding: 12,
    gap: 10,
    marginBottom: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTitle: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  tierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tierPress: {
    width: '48.5%',
    minWidth: 132,
    flexGrow: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tierActive: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tierActiveText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  tierInactive: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardAlt,
  },
  tierInactiveText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  categoryLabel: {
    color: COLORS.pink,
    ...TYPOGRAPHY.label,
    textAlign: 'center',
  },
  cardMainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  kinkTitle: {
    color: COLORS.textPrimary,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
  },
  kinkBody: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
  roleSelector: {
    width: '100%',
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
    fontSize: 16,
    fontWeight: '800',
  },
  roleOptionTextActive: {
    color: COLORS.textPrimary,
  },
  partnerBlock: {
    alignItems: 'center',
    gap: 8,
  },
  partnerLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  partnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 12,
    padding: 10,
  },
  partnerCopy: {
    flexShrink: 1,
  },
  partnerName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  partnerStatus: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
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
    fontSize: 16,
    lineHeight: 23,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '800',
  },
});
