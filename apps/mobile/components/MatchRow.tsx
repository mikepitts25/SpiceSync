import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import type { VoteValue } from '../src/stores/votes';
import { hasKinkConversationTopics } from '../data/kinkConversationTopics';
import { COLORS } from '../constants/theme';

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
  kinkSlug?: string;
  kinkTier?: string;
  showConversationButton?: boolean;
};

const MatchRow: React.FC<Props> = ({
  title,
  subtitle,
  aEmoji,
  bEmoji,
  aVote,
  bVote,
  kinkSlug,
  kinkTier,
  showConversationButton = true,
}) => {
  const router = useRouter();
  const hasTopics = kinkSlug && hasKinkConversationTopics(kinkSlug);
  const isMutualYes = aVote === 'yes' && bVote === 'yes';
  const isNaughtyOrXXX = kinkTier === 'naughty' || kinkTier === 'xxx';
  const shouldShowButton = showConversationButton && hasTopics && isMutualYes && isNaughtyOrXXX;

  const handleConversationPress = () => {
    if (kinkSlug) {
      router.push({
        pathname: '/(conversation)/kink-topics',
        params: { kinkSlug, kinkTitle: title },
      });
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.chipsRow}>
        <VoteChip emoji={aEmoji} vote={aVote} />
        <VoteChip emoji={bEmoji} vote={bVote} />
      </View>
      {shouldShowButton && (
        <TouchableOpacity
          style={styles.conversationButton}
          onPress={handleConversationPress}
          activeOpacity={0.8}
        >
          <MessageCircle size={16} color={COLORS.primary} />
          <Text style={styles.conversationButtonText}>Talk About This</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 12,
    gap: 8,
  },
  textWrap: {
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
  conversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
  },
  conversationButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default MatchRow;
