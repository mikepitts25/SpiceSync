import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { VoteValue } from '../src/stores/votes';

type VoteVal = VoteValue | undefined;

type ChipProps = {
  emoji?: string | null;
  vote: VoteVal;
};

const voteLabel = (vote: VoteVal): string => {
  if (vote === 'yes') return 'Yes';
  if (vote === 'maybe') return 'Maybe';
  if (vote === 'no') return 'No';
  return '—';
};

const voteBg = (vote: VoteVal): string => {
  if (vote === 'yes') return '#16a34a';
  if (vote === 'maybe') return '#f59e0b';
  if (vote === 'no') return '#ef4444';
  return '#475569';
};

function VoteChip({ emoji, vote }: ChipProps) {
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: voteBg(vote),
          opacity: vote ? 1 : 0.6,
        },
      ]}
    >
      <Text style={styles.chipEmoji}>{emoji ?? '🙂'}</Text>
      <Text style={styles.chipText}>{voteLabel(vote)}</Text>
    </View>
  );
}

type Props = {
  title: string;
  subtitle?: string | null;
  aEmoji?: string | null;
  bEmoji?: string | null;
  aVote: VoteVal;
  bVote: VoteVal;
  onDiscuss?: () => void;
};

const MatchRow: React.FC<Props> = ({
  title,
  subtitle,
  aEmoji,
  bEmoji,
  aVote,
  bVote,
  onDiscuss,
}) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onDiscuss && (
          <Pressable
            style={styles.discussBtn}
            onPress={onDiscuss}
            accessibilityRole="button"
            accessibilityLabel={`Discuss ${title}`}
          >
            <Text style={styles.discussBtnText}>💬 Discuss</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.chipsRow}>
        <VoteChip emoji={aEmoji} vote={aVote} />
        <VoteChip emoji={bEmoji} vote={bVote} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 12,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  discussBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1d3a5e',
    borderWidth: 1,
    borderColor: '#2563eb',
    alignSelf: 'flex-start',
  },
  discussBtnText: {
    color: '#93c5fd',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default MatchRow;
