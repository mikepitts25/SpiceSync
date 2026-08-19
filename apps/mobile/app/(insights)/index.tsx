import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InsightsCoupleMark from '../../components/InsightsCoupleMark';
import { SafeAreaView } from '../../components/SafeAreaView';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useVotesStore } from '../../src/stores/votes';
import { voteValue } from '../../lib/votes/rolePreferences';
import { useKinks } from '../../lib/data';
import { useProfilesStore } from '../../lib/state/profiles';
import { useCoupleLinkStore } from '../../lib/sync/coupleLink';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { PremiumGate } from '../../components/PremiumGate';

import { ui } from '../../lib/i18n/uiLiteral';

interface StatCardProps {
  title: string;
  value: string | number;
  emoji: string;
  subtitle?: string;
}

function StatCard({ title, value, emoji, subtitle }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function InsightsDashboard() {
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((state) => state.language);
  const activeProfileId = useProfilesStore((state) =>
    state.getActiveProfileId()
  );
  const activeProfile = useProfilesStore((state) => state.getActiveProfile());
  const coupleLink = useCoupleLinkStore((state) =>
    state.link?.status === 'active' ? state.link : null
  );
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const votes = useVotesStore((state) =>
    activeProfileId ? (state.votesByProfile[activeProfileId] ?? {}) : {}
  );

  const insights = useMemo(() => {
    const allVotes = Object.values(votes).map(voteValue).filter(Boolean);
    const totalVotes = allVotes.length;
    const yesVotes = allVotes.filter((v) => v === 'yes').length;
    const maybeVotes = allVotes.filter((v) => v === 'maybe').length;
    const noVotes = allVotes.filter((v) => v === 'no').length;

    // Category stats
    const categoryStats: Record<string, { yes: number; total: number }> = {};
    kinks.forEach((kink) => {
      const vote = voteValue(votes[kink.id]);
      if (!categoryStats[kink.category]) {
        categoryStats[kink.category] = { yes: 0, total: 0 };
      }
      if (vote) {
        categoryStats[kink.category].total++;
        if (vote === 'yes') categoryStats[kink.category].yes++;
      }
    });

    const topCategories = Object.entries(categoryStats)
      .map(([name, stats]) => ({
        name,
        interest:
          stats.total > 0 ? Math.round((stats.yes / stats.total) * 100) : 0,
        yes: stats.yes,
        total: stats.total,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.interest - a.interest)
      .slice(0, 5);

    // Intensity stats
    const intensityStats = { low: 0, medium: 0, high: 0 };
    kinks.forEach((kink) => {
      const vote = voteValue(votes[kink.id]);
      if (vote === 'yes') {
        const intensity = kink.intensityScale || 1;
        if (intensity <= 2) intensityStats.low++;
        else if (intensity <= 4) intensityStats.medium++;
        else intensityStats.high++;
      }
    });

    const compatibilityScore =
      totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0;

    return {
      totalVotes,
      yesVotes,
      maybeVotes,
      noVotes,
      topCategories,
      intensityStats,
      compatibilityScore,
    };
  }, [votes, kinks]);

  const voteDistribution = [
    { label: ui('Yes'), value: insights.yesVotes, color: COLORS.success },
    { label: ui('Maybe'), value: insights.maybeVotes, color: COLORS.warning },
    { label: ui('No'), value: insights.noVotes, color: COLORS.danger },
  ];

  const maxVotes = Math.max(
    insights.yesVotes,
    insights.maybeVotes,
    insights.noVotes,
    1
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{ui('Insights')}</Text>
          <Text style={styles.subtitle}>
            {ui('Your compatibility at a glance')}
          </Text>
        </View>

        {/* Compatibility Score */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreMark}>
            <InsightsCoupleMark
              linked={Boolean(coupleLink)}
              activeAvatar={activeProfile?.emoji}
              partnerAvatar={coupleLink?.partnerProfileAvatar}
            />
          </View>
          <Text style={styles.scoreValue}>{insights.compatibilityScore}%</Text>
          <Text style={styles.scoreLabel}>{ui('Compatibility Score')}</Text>
          <Text style={styles.scoreDescription}>
            {ui(' Based on your mutual interests ')}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title={ui('Total Votes')}
            value={insights.totalVotes}
            emoji="🗳️"
            subtitle={`${insights.yesVotes} ${ui('yes')} • ${insights.maybeVotes} ${ui('maybe')}`}
          />
          <StatCard
            title={ui('Yes Rate')}
            value={`${insights.totalVotes > 0 ? Math.round((insights.yesVotes / insights.totalVotes) * 100) : 0}%`}
            emoji="👍"
            subtitle={ui('Activities you liked')}
          />
        </View>

        {/* Vote Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{ui('Vote Distribution')}</Text>
          <View style={styles.chartContainer}>
            {voteDistribution.map((item, index) => (
              <View key={index} style={styles.barRow}>
                <Text style={styles.barLabel}>{item.label}</Text>
                <View style={styles.barWrapper}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          width: `${(item.value / maxVotes) * 100}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Top Categories */}
        {insights.topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{ui('Top Categories')}</Text>
            <View style={styles.categoriesList}>
              {insights.topCategories.map((cat, index) => (
                <View key={cat.name} style={styles.categoryRow}>
                  <View style={styles.categoryRank}>
                    <Text style={styles.categoryRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryStats}>
                      {cat.yes}
                      {ui(' of ')}
                      {cat.total}
                      {ui(' liked ')}
                    </Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View
                      style={[
                        styles.categoryFill,
                        { width: `${cat.interest}%` },
                      ]}
                    />
                    <Text style={styles.categoryPercent}>{cat.interest}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Intensity Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{ui('Intensity Preferences')}</Text>
          <View style={styles.intensityGrid}>
            <View style={styles.intensityCard}>
              <Text style={styles.intensityEmoji}>🌱</Text>
              <Text style={styles.intensityValue}>
                {insights.intensityStats.low}
              </Text>
              <Text style={styles.intensityLabel}>{ui('Beginner')}</Text>
            </View>
            <View style={styles.intensityCard}>
              <Text style={styles.intensityEmoji}>🔥</Text>
              <Text style={styles.intensityValue}>
                {insights.intensityStats.medium}
              </Text>
              <Text style={styles.intensityLabel}>{ui('Moderate')}</Text>
            </View>
            <View style={styles.intensityCard}>
              <Text style={styles.intensityEmoji}>⚡</Text>
              <Text style={styles.intensityValue}>
                {insights.intensityStats.high}
              </Text>
              <Text style={styles.intensityLabel}>{ui('Advanced')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function PremiumInsightsDashboard() {
  return (
    <PremiumGate>
      <InsightsDashboard />
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  scoreCard: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
    margin: SIZES.padding * 1.5,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreMark: {
    marginBottom: SIZES.padding,
  },
  scoreValue: {
    fontFamily: FONTS.bold,
    fontSize: 56,
    color: COLORS.primary,
    marginBottom: 4,
  },
  scoreLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 4,
  },
  scoreDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SIZES.padding,
    paddingHorizontal: SIZES.padding * 1.5,
    marginBottom: SIZES.padding * 2,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: SIZES.padding / 2,
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: 4,
  },
  statTitle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  statSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  section: {
    padding: SIZES.padding * 1.5,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  chartContainer: {
    gap: SIZES.padding,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.text,
    width: 60,
  },
  barWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.padding,
  },
  barTrack: {
    flex: 1,
  },
  bar: {
    height: 24,
    borderRadius: 12,
    minWidth: 4,
  },
  barValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    minWidth: 30,
  },
  categoriesList: {
    gap: SIZES.padding,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  categoryRankText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: '#fff',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  categoryStats: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  categoryBar: {
    width: 80,
    alignItems: 'flex-end',
  },
  categoryFill: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginBottom: 4,
  },
  categoryPercent: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  intensityGrid: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  intensityCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  intensityEmoji: {
    fontSize: 28,
    marginBottom: SIZES.padding / 2,
  },
  intensityValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: 2,
  },
  intensityLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
});
