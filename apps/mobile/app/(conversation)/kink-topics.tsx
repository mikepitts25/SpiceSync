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
  ArrowRight,
} from 'lucide-react-native';

import { COLORS, GRADIENTS, SIZES, SHADOWS } from '../../constants/theme';
import { getKinkConversationTopics, hasKinkConversationTopics } from '../../data/kinkConversationTopics';
import { useKinks } from '../../lib/data';
import { useSettingsStore } from '../../src/stores/settingsStore';

const { width } = Dimensions.get('window');

// Approach card component
const ApproachCard = ({
  approach,
  index,
  isExpanded,
  onToggle,
}: {
  approach: {
    title: string;
    description: string;
    starter: string;
    followUps: string[];
  };
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const colors = [
    ['#8B5CF6', '#C084FC'],
    ['#F472B6', '#EF4444'],
    ['#00D9FF', '#8B5CF6'],
  ];
  const gradient = colors[index % colors.length] as [string, string];

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
            <Text style={styles.approachDescription}>{approach.description}</Text>
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

  const topics = kinkSlug ? getKinkConversationTopics(kinkSlug) : undefined;
  const kink = kinkSlug ? Object.values(kinksById).find(k => k.slug === kinkSlug) : undefined;
  const displayTitle = kinkTitle || kink?.title || 'Kink Topics';

  if (!topics || !hasKinkConversationTopics(kinkSlug || '')) {
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
          <Text style={styles.emptyTitle}>No Topics Available</Text>
          <Text style={styles.emptyText}>
            We haven't created conversation topics for this kink yet. 
            Check back in a future update!
          </Text>
          <TouchableOpacity style={styles.backToMatchesButton} onPress={() => router.back()}>
            <Text style={styles.backToMatchesText}>Back to Matches</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerSubtitle}>{displayTitle}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Card */}
        <View style={styles.introCard}>
          <LinearGradient
            colors={['#1E1E2E', '#252538']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.introGradient}
          >
            <View style={styles.introIconContainer}>
              <MessageCircle size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.introTitle}>Start the Conversation</Text>
            <Text style={styles.introText}>
              You both matched on this kink! Here are different ways to bring it 
              up with your partner. Each approach offers a unique angle—choose 
              the one that feels most natural for your relationship.
            </Text>
          </LinearGradient>
        </View>

        {/* Approaches */}
        <Text style={styles.sectionTitle}>Choose Your Approach</Text>
        
        {topics.approaches.map((approach, index) => (
          <ApproachCard
            key={index}
            approach={approach}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}

        {/* Safety Note */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyHeader}>
            <Shield size={20} color="#22C55E" />
            <Text style={styles.safetyTitle}>Remember</Text>
          </View>
          <Text style={styles.safetyText}>
            These conversation starters are designed to open dialogue, not pressure. 
            Your partner's comfort and consent always come first. If they're not ready 
            to explore this, that's completely okay. The goal is honest communication, 
            not immediate agreement.
          </Text>
        </View>

        {/* Navigation */}
        <TouchableOpacity
          style={styles.conversationButton}
          onPress={() => router.push('/(conversation)')}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.conversationButtonGradient}
          >
            <Text style={styles.conversationButtonText}>Browse All Conversations</Text>
            <ArrowRight size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },

  // Intro Card
  introCard: {
    marginBottom: 24,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  introGradient: {
    padding: 24,
    alignItems: 'center',
  },
  introIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Section Title
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },

  // Approach Card
  approachCard: {
    marginBottom: 16,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  approachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  approachNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
    backgroundColor: `${COLORS.secondary}10`,
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

  // Safety Card
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

  // Conversation Button
  conversationButton: {
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  conversationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  conversationButtonText: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    color: '#fff',
  },

  // Empty State
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
