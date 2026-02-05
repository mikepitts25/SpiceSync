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
import SettingsButton from '../../src/components/SettingsButton';
import { useKinks } from '../../lib/data';
import { useFilters } from '../../lib/state/filters';
import { useProfilesStore } from '../../lib/state/profiles';
import { useVotesStore, type VoteValue } from '../../src/stores/votes';
import { useSettings } from '../../lib/state/useStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

const { width: SCREEN_W } = Dimensions.get('window');

export default function DeckScreen() {
  const router = useRouter();
  const { language } = useSettings();
  const { selectedTier } = useFilters();
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

  // Source deck for current filter
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

  // Index is stored per (user, tier)
  const key = `${activeProfileIdValue ?? 'none'}::${selectedTier ?? 'all'}`;
  const [indexByKey, setIndexByKey] = useState<Record<string, number>>({});
  const [cardAnimating, setCardAnimating] = useState(false);
  const queuedVoteRef = useRef<VoteValue | null>(null);
  const topCardRef = useRef<SwipeDeckHandle>(null);
  const index = indexByKey[key] ?? 0;
  const current = queue[index] ?? null;

  // ✅ HARD RESET when profile or category changes
  useEffect(() => {
    setIndexByKey((prev) => ({ ...prev, [key]: 0 }));
  }, [key]);

  // Guard if queue length shrinks (e.g., after votes reset)
  useEffect(() => {
    const max = Math.max(0, queue.length - 1);
    if (index > max) {
      setIndexByKey((prev) => ({
        ...prev,
        [key]: Math.max(0, Math.min(index, max)),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length, index, key]);

  // Optional: on refocus we could validate index (kept as no-op)
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
        <Text style={styles.h1}>Choose a profile</Text>
        <Text style={styles.p}>
          Open Settings → Profiles to select who is swiping.
        </Text>
        <SettingsButton />
      </SafeAreaView>
    );
  }

  if (!filteredKinks.length) {
    return (
      <SafeAreaView style={styles.wrap} edges={['top', 'left', 'right']}>
        <Text style={styles.h1}>No items in this category</Text>
        <Text style={styles.p}>Try another category or add content.</Text>
        <SettingsButton />
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
        <SettingsButton />
      </SafeAreaView>
    );
  }

  const leftCount = queue.length;
  const me = activeProfile;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{leftCount} left</Text>
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
      <View style={styles.settingsFooter}>
        <SettingsButton />
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
