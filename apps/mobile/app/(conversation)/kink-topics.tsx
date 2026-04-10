// apps/mobile/app/(conversation)/kink-topics.tsx
// Kink Conversation Topics Screen
// Shows conversation starters for a specific matched kink

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronLeft,
  MessageCircle,
  Sparkles,
  Heart,
  Shield,
} from 'lucide-react-native';

import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { getKinkConversationTopics } from '../../data/kinkConversationTopics';
import { getTopicsForKink } from '../../data/kink_conversation_topics';
import { useKinks } from '../../lib/data';
import { useSettingsStore } from '../../src/stores/settingsStore';

const { width } = Dimensions.get('window');

type Approach = {
  title: string;
  description: string;
  starter: string;
  followUps: string[];
};

// Convert category-based topic to approach format
function categoryTopicToApproach(topic: ReturnType<typeof getTopicsForKink>[number]): Approach {
  return {
    title: `${topic.approachIcon} ${topic.approach}`,
    description: topic.context,
    starter: topic.prompt,
    followUps: topic.followUps,
  };
}

// Approach card component
const ApproachCard = ({
  approach,
  index,
  isExpanded,
  onToggle,
}: {
  approach: Approach;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const colors: [string, string][] = [
    ['#8B5CF6', '#C084FC'],
    ['#F472B6', '#EF4444'],
    ['#00D9FF', '#8B5CF6'],
    ['#F59E0B', '#EF4444'],
    ['#10B981', '#3B82F6'],
    ['#EC4899', '#8B5CF6'],
  ];
  const gradient = colors[index % colors.length];

  return (
    <View style={styles.approachCard}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.9}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.approachHeader}
        >
          <View style={styles.approachNumber}>
            <Text style={styles.approachNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.approachTitleContainer}>
            <Text style={styles.approachTitle}>{approach.title}</Text>
            <Text style={styles.approachDescription} numberOfLines={isExpanded ? undefined : 1}>
              {approach.description}
            </Text>
          </View>
          <ChevronLeft
            size={24}
            color="#fff"
            style={[
              styles.approachArrow,
              { transform: [{ rotate: isExpanded ? '-90deg' : '180deg' }] },
            ]}
          />
        </LinearGradient>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.approachContent}>
          {/* Starter Question */}
          <View style={styles.starterContainer}>
            <View style={styles.starterHeader}>
              <MessageCircle size={18} color={COLORS.primary} />
              <Text style={styles.starterLabel}>Conversation Starter</Text>
            </View>
            <Text style={styles.starterText}>{approach.starter}</Text>
          </View>

          {/* Follow-ups */}
          <View style={styles.followUpsContainer}>
            <View style={styles.followUpsHeader}>
              <Sparkles size={18} color={COLORS.accent} />
              <Text style={styles.followUpsLabel}>Follow-up Questions</Text>
            </View>
            {approach.followUps.map((followUp, idx) => (
              <View key={idx} style={styles.followUpItem}>
                <View style={styles.followUpBullet} />
                <Text style={styles.followUpText}>{followUp}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <View style={styles.tipsHeader}>
              <Heart size={18} color="#EF4444" />
              <Text style={styles.tipsLabel}>Tips for Success</Text>
            </View>
            <Text style={styles.tipsText}>
              Choose a relaxed, private moment. Start with curiosity, not pressure.
              Listen more than you talk. Be open to your partner's response, whether
              it's enthusiastic, hesitant, or a "not right now."
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default function KinkTopicsScreen() {
  const router = useRouter();
  const { kinkSlug, kinkTitle } = useLocalSearchParams<{ kinkSlug: string; kinkTitle: string }>();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const language = useSettingsStore((state) => state.language);
  const { kinksById } = useKinks(language === 'es' ? 'es' : 'en');

  // Find kink by slug
  const kink = kinkSlug ? Object.values(kinksById).find((k) => k.slug === kinkSlug) : undefined;
  const displayTitle = kinkTitle || kink?.title || 'Kink Topics';

  // Build approaches: prefer per-kink topics, fall back to category topics
  const approaches: Approach[] = (() => {
    const perKink = kinkSlug ? getKinkConversationTopics(kinkSlug) : undefined;
    if (perKink?.approaches?.length) return perKink.approaches;
    if (kink) {
      return getTopicsForKink(kink.slug, kink.category).map(categoryTopicToApproach);
    }
    return [];
  })();

  if (!kink && !kinkTitle) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation Topics</Text>
        </View>
        <View style={styles.emptyState}>
          <Shield size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>Kink Not Found</Text>
          <Text style={styles.emptyText}>We couldn't load topics for this kink.</Text>
          <TouchableOpacity style={styles.backToMatchesButton} onPress={() => router.back()}>
            <Text style={styles.backToMatchesText}>Back to Matches</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tierColor =
    kink?.tier === 'soft' ? '#FF6B9D' : kink?.tier === 'naughty' ? '#F472B6' : '#EF4444';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Let's Talk About</Text>
          <Text style={styles.headerKinkName} numberOfLines={1}>{displayTitle}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Kink info card */}
        {kink && (
          <LinearGradient
            colors={['#1A1A2E', '#16213E']}
            style={styles.kinkInfoCard}
          >
            <View style={styles.kinkBadgeRow}>
              {kink.tier && (
                <View style={[styles.tierBadge, { backgroundColor: `${tierColor}25` }]}>
                  <Text style={[styles.tierBadgeText, { color: tierColor }]}>
                    {kink.tier.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {kink.category.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <Text style={styles.kinkDescription}>{kink.description}</Text>
          </LinearGradient>
        )}

        {/* Intro */}
        <Text style={styles.sectionIntro}>
          {approaches.length} ways to start this conversation
        </Text>

        {/* Approach cards */}
        {approaches.map((approach, index) => (
          <ApproachCard
            key={index}
            approach={approach}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}

        {/* Safety reminder */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyHeader}>
            <Shield size={20} color="#22C55E" />
            <Text style={styles.safetyTitle}>A Gentle Reminder</Text>
          </View>
          <Text style={styles.safetyText}>
            These conversations work best when both partners feel safe to say yes, no, or
            "I need more time." There's no wrong answer — curiosity is the goal.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  headerKinkName: {
    fontSize: SIZES.h3,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Kink info card
  kinkInfoCard: {
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kinkBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tierBadgeText: {
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
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  kinkDescription: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Section intro
  sectionIntro: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  // Approach card
  approachCard: {
    marginBottom: 12,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  approachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  approachNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approachNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  approachTitleContainer: {
    flex: 1,
  },
  approachTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  approachDescription: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.8)',
  },
  approachArrow: {
    marginLeft: 8,
  },
  approachContent: {
    padding: 20,
    backgroundColor: COLORS.card,
  },

  // Starter
  starterContainer: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 16,
  },
  starterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  starterLabel: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starterText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // Follow-ups
  followUpsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 16,
  },
  followUpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  followUpsLabel: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  followUpItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  followUpBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 8,
    marginRight: 12,
  },
  followUpText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
    lineHeight: 22,
  },

  // Tips
  tipsContainer: {
    backgroundColor: `${COLORS.secondary ?? '#EF4444'}10`,
    borderRadius: SIZES.radius,
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  tipsLabel: {
    fontSize: SIZES.small,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipsText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Safety card
  safetyCard: {
    backgroundColor: '#064E3B',
    borderRadius: SIZES.radiusLarge,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  safetyTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: '#22C55E',
  },
  safetyText: {
    fontSize: SIZES.small,
    color: '#86EFAC',
    lineHeight: 20,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backToMatchesButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: SIZES.radius,
  },
  backToMatchesText: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: '#fff',
  },
});
