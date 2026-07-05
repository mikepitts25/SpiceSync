import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { StatusBar } from 'expo-status-bar';
import { Check, Minus, X } from 'lucide-react-native';

import { BackHeader } from '../../components/app-chrome';
import { useProfilesStore } from '../../lib/state/profiles';
import {
  useVotesStore,
  type PairPreference,
  type Readiness,
  type VoteValue,
} from '../../src/stores/votes';
import { useKinks, type KinkItem } from '../../lib/data';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { normalizeVoteRecord } from '../../lib/votes/rolePreferences';
import { COLORS } from '../../constants/theme';

type Filter = 'all' | VoteValue;

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: 'all', label: 'ALL', color: COLORS.textPrimary },
  { key: 'yes', label: 'YES', color: COLORS.yes },
  { key: 'maybe', label: 'MAYBE', color: COLORS.maybe },
  { key: 'no', label: 'NO', color: COLORS.no },
];

// Refined readiness options. "Not now" is shared with your partner as a
// talk-later topic; "Hard no" always stays private.
const READINESS_OPTIONS: {
  value: Readiness;
  label: string;
  hint: string;
  color: string;
}[] = [
  { value: 'yes', label: 'YES', hint: 'Ready for this', color: COLORS.yes },
  {
    value: 'curious',
    label: 'CURIOUS',
    hint: 'Open to exploring',
    color: COLORS.maybe,
  },
  {
    value: 'not_now',
    label: 'NOT NOW',
    hint: 'Maybe later — shared as a talk topic',
    color: COLORS.purpleLight,
  },
  {
    value: 'hard_no',
    label: 'HARD NO',
    hint: 'Always stays private',
    color: COLORS.no,
  },
];

const READINESS_BADGES: Record<Readiness, { label: string; color: string }> = {
  yes: { label: 'YES', color: COLORS.yes },
  curious: { label: 'CURIOUS', color: COLORS.maybe },
  not_now: { label: 'NOT NOW', color: COLORS.purpleLight },
  hard_no: { label: 'HARD NO', color: COLORS.no },
};

type SelectedItem = {
  kink: KinkItem;
  vote: VoteValue;
  readiness?: Readiness;
  pairPreference?: PairPreference;
};

export default function MyVotesScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<SelectedItem | null>(null);

  const language = useSettingsStore((state) => state.language);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');

  const activeProfileId = useProfilesStore((state) =>
    state.getActiveProfileId()
  );

  const profileVotes = useVotesStore((state) =>
    activeProfileId ? (state.votesByProfile[activeProfileId] ?? {}) : {}
  );
  const setReadiness = useVotesStore((state) => state.setReadiness);

  const { votedKinks, counts } = useMemo(() => {
    const voted: SelectedItem[] = [];
    const counts = { all: 0, yes: 0, maybe: 0, no: 0 };

    for (const kink of kinks) {
      const vote = normalizeVoteRecord(profileVotes[kink.id]);
      if (vote) {
        voted.push({
          kink,
          vote: vote.value,
          readiness: vote.readiness,
          pairPreference: vote.pairPreference,
        });
        counts.all++;
        counts[vote.value]++;
      }
    }

    return { votedKinks: voted, counts };
  }, [kinks, profileVotes]);

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? votedKinks
        : votedKinks.filter(({ vote }) => vote === filter),
    [votedKinks, filter]
  );

  const handleChangeReadiness = (readiness: Readiness) => {
    if (!selected || !activeProfileId) return;
    setReadiness(
      activeProfileId,
      selected.kink.id,
      readiness,
      selected.kink.pairMode ? selected.pairPreference : undefined
    );
    setSelected(null);
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title="My Votes" />

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(({ key, label, color }) => {
          const isSelected = filter === key;
          const count = counts[key];
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => setFilter(key)}
              style={[
                styles.chip,
                isSelected && {
                  borderColor: color,
                  backgroundColor: color + '1A',
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? color : COLORS.textMuted },
                ]}
              >
                {label}
              </Text>
              <Text
                style={[
                  styles.chipCount,
                  { color: isSelected ? color : COLORS.textMuted },
                ]}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>
        Tap any card to review or change your vote
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={({ kink }) => kink.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <VoteRow
            kink={item.kink}
            vote={item.vote}
            readiness={item.readiness}
            onPress={() => setSelected(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No votes yet</Text>
            <Text style={styles.emptySub}>
              {filter === 'all'
                ? 'Start swiping to vote on activities.'
                : `No ${filter} votes yet.`}
            </Text>
          </View>
        }
      />

      {/* Vote change modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {selected && (
              <>
                <Text style={styles.sheetCategory}>
                  {selected.kink.category?.toUpperCase() ?? 'GENERAL'}
                </Text>
                <Text style={styles.sheetTitle}>{selected.kink.title}</Text>
                {selected.kink.description ? (
                  <Text style={styles.sheetDesc}>
                    {selected.kink.description}
                  </Text>
                ) : null}

                <Text style={styles.sheetPrompt}>Change your answer</Text>

                <View style={styles.readinessList}>
                  {READINESS_OPTIONS.map(({ value, label, hint, color }) => {
                    // Highlight the explicit readiness, or the legacy vote's
                    // equivalent (yes→yes, maybe→curious). A plain legacy
                    // "no" highlights nothing until the user refines it.
                    const isActive = selected.readiness
                      ? selected.readiness === value
                      : (selected.vote === 'yes' && value === 'yes') ||
                        (selected.vote === 'maybe' && value === 'curious');
                    return (
                      <Pressable
                        key={value}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        onPress={() => handleChangeReadiness(value)}
                        style={[
                          styles.readinessBtn,
                          {
                            borderColor: isActive
                              ? color
                              : 'rgba(255,255,255,0.1)',
                          },
                          isActive && { backgroundColor: color + '22' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.readinessBtnLabel,
                            { color: isActive ? color : COLORS.textPrimary },
                          ]}
                        >
                          {label}
                        </Text>
                        <Text style={styles.readinessBtnHint}>{hint}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  onPress={() => setSelected(null)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function VoteRow({
  kink,
  vote,
  readiness,
  onPress,
}: {
  kink: KinkItem;
  vote: VoteValue;
  readiness?: Readiness;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kink.title}, voted ${vote}. Tap to change.`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowCategory}>
          {kink.category?.toUpperCase() ?? 'GENERAL'}
        </Text>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {kink.title}
        </Text>
        {kink.description ? (
          <Text style={styles.rowDesc} numberOfLines={2}>
            {kink.description}
          </Text>
        ) : null}
      </View>
      <VoteBadge vote={vote} readiness={readiness} />
    </Pressable>
  );
}

function VoteBadge({
  vote,
  readiness,
}: {
  vote: VoteValue;
  readiness?: Readiness;
}) {
  if (readiness) {
    const { label, color } = READINESS_BADGES[readiness];
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: color + '1F', borderColor: color + '4D' },
        ]}
      >
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  }
  if (vote === 'yes') {
    return (
      <View style={[styles.badge, styles.badgeYes]}>
        <Check size={12} color={COLORS.yes} strokeWidth={3} />
        <Text style={[styles.badgeText, { color: COLORS.yes }]}>YES</Text>
      </View>
    );
  }
  if (vote === 'maybe') {
    return (
      <View style={[styles.badge, styles.badgeMaybe]}>
        <Minus size={12} color={COLORS.maybe} strokeWidth={3} />
        <Text style={[styles.badgeText, { color: COLORS.maybe }]}>MAYBE</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeNo]}>
      <X size={12} color={COLORS.no} strokeWidth={3} />
      <Text style={[styles.badgeText, { color: COLORS.no }]}>NO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  chipCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLeft: {
    flex: 1,
    gap: 3,
  },
  rowCategory: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  rowTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  rowDesc: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
  },

  // Vote badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeYes: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  badgeMaybe: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  badgeNo: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    gap: 10,
  },
  sheetCategory: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  sheetTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  sheetDesc: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 4,
  },
  sheetPrompt: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 6,
  },
  readinessList: {
    gap: 8,
    marginTop: 2,
  },
  readinessBtn: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  readinessBtnLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  readinessBtnHint: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  emptySub: {
    color: COLORS.textSub,
    fontSize: 16,
    textAlign: 'center',
  },
});
