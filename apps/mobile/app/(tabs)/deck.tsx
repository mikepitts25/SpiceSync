import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwipeDeck, {
  type SwipeDeckHandle,
  type SwipeDirection,
} from '../../components/SwipeDeck';
import VoteButtons from '../../components/VoteButtons';
import EndOfDeck from '../../components/EndOfDeck';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useProfilesStore } from '../../lib/state/profiles';
import { useVotesStore, type VoteValue } from '../../src/stores/votes';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../lib/i18n';

const { width: SCREEN_W } = Dimensions.get('window');

export default function DeckScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const { selectedTier } = useFilters();
  const { t } = useTranslation();
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
  const activeProfileIdValue = activeProfile?.id ?? null;
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const setVote = useVotesStore((state) => state.setVote);
  const clearVotesForKinks = useVotesStore((state) => state.clearVotesForKinks);

  const filteredKinks = useMemo(
    () => (selectedTier ? kinks.filter((k) => k.tier === selectedTier) : kinks),
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

  const queue = useMemo(() => {
    if (!activeProfileIdValue) return filteredKinks;
    const voted = activeProfileVotes || {};
    return filteredKinks.filter((kink) => voted[kink.id] === undefined);
  }, [filteredKinks, activeProfileIdValue, activeProfileVotes]);

  const key = `${activeProfileIdValue ?? 'none'}::${selectedTier ?? 'all'}`;
  const [indexByKey, setIndexByKey] = useState<Record<string, number>>({});
  const [cardAnimating, setCardAnimating] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      return () => {};
    }, [])
  );

  const updateIndex = useCallback(
    (updater: (current: number) => number) => {
      setIndexByKey((prev) => {
        const currentValue = prev[key] ?? 0;
        const nextValue = Math.max(
          0,
          Math.min(queue.length, updater(currentValue))
        );
        if (nextValue === currentValue) {
          return prev;
        }
        return {
          ...prev,
          [key]: nextValue,
        };
      });
    },
    [key, queue.length]
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
        down: 'maybe',
      };

      const voteValue = queuedVoteRef.current ?? directionToVote[dir];
      queuedVoteRef.current = null;

      setVote(activeProfileIdValue, current.id, voteValue);
      setCardAnimating(false);
    },
    [current, activeProfileIdValue, setVote]
  );

  const handleButtonVote = useCallback(
    (value: VoteValue) => {
      if (!current || cardAnimating) return;
      const handle = topCardRef.current;
      if (!handle || handle.isAnimating()) return;
      const valueToDirection: Record<VoteValue, SwipeDirection> = {
        yes: 'right',
        no: 'left',
        maybe: 'down',
      };

      queuedVoteRef.current = value;
      handle.programmaticSwipe(valueToDirection[value]);
    },
    [cardAnimating, current]
  );

  if (!isHydrated || !hasActive) {
    return null;
  }

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>{t.profiles.chooseProfile}</Text>
        <Text style={styles.p}>{t.profiles.selectProfileToSwipe}</Text>
      </SafeAreaView>
    );
  }

  if (!filteredKinks.length) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>{t.deck.noItemsInCategory}</Text>
        <Text style={styles.p}>{t.deck.tryAnotherCategory}</Text>
      </SafeAreaView>
    );
  }

  if (!queue.length || !current) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <EndOfDeck
          onReset={() => {
            if (!activeProfileIdValue) return;
            clearVotesForKinks(activeProfileIdValue, allKinkIdsInFilter);
            setIndexByKey((prev) => ({ ...prev, [key]: 0 }));
          }}
          onViewMatches={() => router.navigate('/matches')}
        />
      </SafeAreaView>
    );
  }

  const leftCount = queue.length;
  const me = activeProfile;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{leftCount} {t.common.left}</Text>
        {selectedTier ? (
          <Text style={styles.tier}>• {selectedTier?.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.user}>
          {me?.emoji} {me?.displayName ?? me?.name}
        </Text>
      </View>
      <View style={styles.deckArea}>
        <View style={styles.cardMaxW}>
          <SwipeDeck
            ref={topCardRef}
            item={current}
            onSwipe={handleSwipeResult}
            onUndo={() => updateIndex((prev) => prev - 1)}
            onSwipeStart={() => setCardAnimating(true)}
            onSwipeEnd={() => setCardAnimating(false)}
          />
        </View>
      </View>

      <VoteButtons
        currentKinkId={current?.id}
        onVote={handleButtonVote}
        disabled={cardAnimating || !current}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 12, backgroundColor: '#0b0f14' },
  wrap: {
    flex: 1,
    padding: 16,
    gap: 12,
    justifyContent: 'center',
    backgroundColor: '#0b0f14',
  },
  h1: { fontSize: 22, fontWeight: '800', color: 'white' },
  p: { fontSize: 16, color: '#94a3b8' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  count: { fontWeight: '700', color: 'white' },
  tier: { color: '#9ca3af', fontWeight: '600' },
  user: { marginLeft: 'auto', color: '#93c5fd', fontWeight: '800' },

  deckArea: {
    flex: 1,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMaxW: { maxWidth: Math.min(SCREEN_W, 520), alignSelf: 'center' },
  settingsFooter: { marginTop: 12, paddingBottom: 84 },
});
