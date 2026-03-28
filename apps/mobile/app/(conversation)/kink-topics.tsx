// apps/mobile/app/(conversation)/kink-topics.tsx
// Conversation topics for a specific matched kink
// Launched from the Matches screen when a user taps "Discuss" on a matched kink

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronDown, ChevronUp, Share2, Shuffle } from 'lucide-react-native';

import { COLORS, SIZES, SHADOWS, GRADIENTS } from '../../constants/theme';
import { getTopicsForKink, type KinkConversationTopic } from '../../data/kink_conversation_topics';
import { useKinks } from '../../lib/data';
import { useSettingsStore } from '../../src/stores/settingsStore';

// ─── Topic Card ──────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  isActive,
  onPress,
  onShare,
}: {
  topic: KinkConversationTopic;
  isActive: boolean;
  onPress: () => void;
  onShare: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.topicCardWrapper}
    >
      <LinearGradient
        colors={isActive ? ['#1E1E3A', '#252550'] : ['#141420', '#1A1A2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.topicCard, isActive && styles.topicCardActive]}
      >
        {/* Approach badge */}
        <View style={styles.approachRow}>
          <Text style={styles.approachIcon}>{topic.approachIcon}</Text>
          <Text style={styles.approachLabel}>{topic.approach}</Text>
          <View style={styles.chevronWrap}>
            {isActive ? (
              <ChevronUp size={16} color={COLORS.primary} />
            ) : (
              <ChevronDown size={16} color={COLORS.textSecondary} />
            )}
          </View>
        </View>

        {/* Prompt */}
        <Text style={[styles.promptText, isActive && styles.promptTextActive]}>
          {topic.prompt}
        </Text>

        {/* Expanded content */}
        {isActive && (
          <>
            {/* Context */}
            <View style={styles.contextBox}>
              <Text style={styles.contextText}>{topic.context}</Text>
            </View>

            {/* Follow-ups */}
            <View style={styles.followUpsSection}>
              <Text style={styles.followUpsLabel}>Keep the conversation going:</Text>
              {topic.followUps.map((fu, i) => (
                <View key={i} style={styles.followUpRow}>
                  <View style={styles.followUpBullet} />
                  <Text style={styles.followUpText}>{fu}</Text>
                </View>
              ))}
            </View>

            {/* Share */}
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
              <Share2 size={16} color={COLORS.textSecondary} />
              <Text style={styles.shareButtonText}>Share this prompt</Text>
            </TouchableOpacity>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function KinkTopicsScreen() {
  const router = useRouter();
  const { kinkId } = useLocalSearchParams<{ kinkId: string }>();
  const language = useSettingsStore((s) => s.language);
  const { kinksById } = useKinks(language === 'es' ? 'es' : 'en');

  const kink = kinkId ? kinksById[kinkId] : null;

  const topics = useMemo(() => {
    if (!kink) return [];
    return getTopicsForKink(kink.slug, kink.category);
  }, [kink]);

  const [activeTopicId, setActiveTopicId] = useState<string | null>(
    topics[0]?.id ?? null
  );

  const handleToggle = (id: string) => {
    setActiveTopicId((prev) => (prev === id ? null : id));
  };

  const handleShuffle = () => {
    if (!topics.length) return;
    const others = topics.filter((t) => t.id !== activeTopicId);
    const next = others[Math.floor(Math.random() * others.length)];
    setActiveTopicId(next?.id ?? topics[0].id);
  };

  const handleShare = async (topic: KinkConversationTopic) => {
    try {
      await Share.share({
        message: `💬 ${topic.prompt}\n\nFrom SpiceSync – conversation starters for couples`,
      });
    } catch (_) {}
  };

  if (!kink) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Kink not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tierColor =
    kink.tier === 'soft' ? '#FF6B9D' : kink.tier === 'naughty' ? '#F472B6' : '#EF4444';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIconBtn}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Let's Talk About It
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {kink.title}
          </Text>
        </View>
        <TouchableOpacity onPress={handleShuffle} style={styles.shuffleBtn}>
          <Shuffle size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Kink context card */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          style={styles.kinkCard}
        >
          <View style={styles.kinkCardTop}>
            <View style={[styles.tierBadge, { backgroundColor: `${tierColor}25` }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>
                {kink.tier?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {kink.category.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.kinkTitle}>{kink.title}</Text>
          <Text style={styles.kinkDescription}>{kink.description}</Text>
        </LinearGradient>

        {/* Section label */}
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>
            {topics.length} conversation approaches
          </Text>
          <TouchableOpacity onPress={handleShuffle} style={styles.shuffleLink}>
            <Shuffle size={14} color={COLORS.primary} />
            <Text style={styles.shuffleLinkText}>Random</Text>
          </TouchableOpacity>
        </View>

        {/* Topic cards */}
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            isActive={activeTopicId === topic.id}
            onPress={() => handleToggle(topic.id)}
            onShare={() => handleShare(topic)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  shuffleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Kink context card
  kinkCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kinkCardTop: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: `${COLORS.textSecondary}20`,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  kinkTitle: {
    fontSize: SIZES.h3,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  kinkDescription: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Section label
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  shuffleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shuffleLinkText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Topic card
  topicCardWrapper: {
    marginBottom: 10,
    borderRadius: 14,
    ...SHADOWS.medium,
  },
  topicCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topicCardActive: {
    borderColor: COLORS.primary,
  },
  approachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  approachIcon: {
    fontSize: 18,
  },
  approachLabel: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  chevronWrap: {},
  promptText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  promptTextActive: {
    color: COLORS.text,
    fontSize: SIZES.medium,
    fontWeight: '700',
    lineHeight: 26,
  },
  contextBox: {
    backgroundColor: `${COLORS.primary}12`,
    borderRadius: 10,
    padding: 14,
    marginTop: 14,
  },
  contextText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  followUpsSection: {
    marginTop: 14,
  },
  followUpsLabel: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  followUpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  followUpBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
  },
  followUpText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: `${COLORS.textSecondary}15`,
  },
  shareButtonText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Error state
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 10,
  },
  backBtnText: {
    color: COLORS.text,
    fontWeight: '700',
  },
});
