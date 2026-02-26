import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useVotesStore } from '../../src/stores/votes';
import { useProfilesStore } from '../../src/stores/profiles';
import { useKinks } from '../../lib/data';
import { useSettings } from '../../lib/state/useStore';

const { width: SCREEN_W } = Dimensions.get('window');

// Simple bar chart component
function BarChart({ 
  data, 
  maxValue 
}: { 
  data: { label: string; value: number; color: string }[];
  maxValue: number;
}) {
  return (
    <View style={styles.chartContainer}>
      {data.map((item, index) => (
        <View key={index} style={styles.barRow}>
          <Text style={styles.barLabel}>{item.label}</Text>
          <View style={styles.barWrapper}>
            <View 
              style={[
                styles.bar, 
                { 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }
              ]} 
            />
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// Stat card component
function StatCard({ 
  title, 
  value, 
  subtitle,
  emoji 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  emoji: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useSettings();
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const activeProfileId = useProfilesStore((state) => state.getActiveProfileId());
  const votes = useVotesStore((state) =>
    activeProfileId ? (state.votesByProfile[activeProfileId] ?? {}) : {}
  );
  
  // Calculate insights
  const insights = useMemo(() => {
    const allVotes = Object.values(votes);
    const totalVotes = allVotes.length;
    const yesVotes = allVotes.filter(v => v === 'yes').length;
    const maybeVotes = allVotes.filter(v => v === 'maybe').length;
    const noVotes = allVotes.filter(v => v === 'no').length;
    
    // Category breakdown
    const categoryStats: Record<string, { yes: number; total: number }> = {};
    kinks.forEach(kink => {
      const vote = votes[kink.id];
      if (!categoryStats[kink.category]) {
        categoryStats[kink.category] = { yes: 0, total: 0 };
      }
      if (vote) {
        categoryStats[kink.category].total++;
        if (vote === 'yes') {
          categoryStats[kink.category].yes++;
        }
      }
    });
    
    // Top categories by interest
    const topCategories = Object.entries(categoryStats)
      .map(([name, stats]) => ({
        name,
        interest: stats.total > 0 ? Math.round((stats.yes / stats.total) * 100) : 0,
        yes: stats.yes,
        total: stats.total,
      }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.interest - a.interest)
      .slice(0, 5);
    
    // Intensity preferences
    const intensityStats = { low: 0, medium: 0, high: 0 };
    kinks.forEach(kink => {
      const vote = votes[kink.id];
      if (vote === 'yes') {
        const intensity = kink.intensityScale || 1;
        if (intensity <= 2) intensityStats.low++;
        else if (intensity <= 4) intensityStats.medium++;
        else intensityStats.high++;
      }
    });
    
    // Compatibility score (mock calculation)
    const compatibilityScore = totalVotes > 0 
      ? Math.round((yesVotes / totalVotes) * 100)
      : 0;
    
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
  
  // Chart data
  const voteDistribution = [
    { label: 'Yes', value: insights.yesVotes, color: COLORS.success },
    { label: 'Maybe', value: insights.maybeVotes, color: COLORS.warning },
    { label: 'No', value: insights.noVotes, color: COLORS.danger },
  ];
  
  const maxVotes = Math.max(insights.yesVotes, insights.maybeVotes, insights.noVotes, 1);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Your activity statistics</Text>
        </View>
        
        {/* Compatibility Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreEmoji}>💑</Text>
          <Text style={styles.scoreValue}>{insights.compatibilityScore}%</Text>
          <Text style={styles.scoreLabel}>Compatibility Score</Text>
          <Text style={styles.scoreDescription}>
            Based on your mutual interests
          </Text>
        </View>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Votes" 
            value={insights.totalVotes} 
            emoji="🗳️"
            subtitle={`${insights.yesVotes} yes • ${insights.maybeVotes} maybe`}
          />
          <StatCard 
            title="Yes Rate" 
            value={`${insights.totalVotes > 0 ? Math.round((insights.yesVotes / insights.totalVotes) * 100) : 0}%`}
            emoji="👍"
            subtitle="Activities you liked"
          />
        </View>
        
        {/* Vote Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vote Distribution</Text>
          <BarChart data={voteDistribution} maxValue={maxVotes} />
        </View>
        
        {/* Top Categories */}
        {insights.topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={styles.categoriesList}>
              {insights.topCategories.map((cat, index) => (
                <View key={cat.name} style={styles.categoryRow}>
                  <View style={styles.categoryRank}>
                    <Text style={styles.categoryRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <Text style={styles.categoryStats}>
                      {cat.yes} of {cat.total} liked
                    </Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View 
                      style={[
                        styles.categoryFill, 
                        { width: `${cat.interest}%` }
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
          <Text style={styles.sectionTitle}>Intensity Preferences</Text>
          <View style={styles.intensityGrid}>
            <View style={styles.intensityCard}>
              <Text style={styles.intensityEmoji}>🌱</Text>
              <Text style={styles.intensityValue}>{insights.intensityStats.low}</Text>
              <Text style={styles.intensityLabel}>Beginner</Text>
            </View>
            <View style={styles.intensityCard}>
              <Text style={styles.intensityEmoji}>🔥</Text>
              <Text style={styles.intensityValue}>{insights.intensityStats.medium}</Text>
              <Text style={styles.intensityLabel}>Moderate</Text>
            </View>
            <View style={styles.intensityCard}>
              <Text style={styles.intensityEmoji}>⚡</Text>
              <Text style={styles.intensityValue}>{insights.intensityStats.high}</Text>
              <Text style={styles.intensityLabel}>Advanced</Text>
            </View>
          </View>
        </View>
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
    padding: SIZES.padding * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  scoreEmoji: {
    fontSize: 48,
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
