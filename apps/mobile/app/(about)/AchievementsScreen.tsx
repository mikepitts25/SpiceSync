import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { 
  useAchievementsStore, 
  getTierColor, 
  getTierIcon,
  AchievementTier,
} from '../../src/stores/achievements';

const TIERS: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum'];

const CATEGORY_EMOJIS: Record<string, string> = {
  voting: '🗳️',
  matches: '💕',
  game: '🎲',
  streak: '🔥',
  social: '👥',
  explorer: '🧭',
};

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { 
    achievements, 
    initializeAchievements, 
    getProgress,
    getByCategory,
  } = useAchievementsStore();
  
  const progress = getProgress();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeAchievements();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const getTierCount = (tier: AchievementTier) => {
    return achievements.filter((a) => a.tier === tier && a.unlocked).length;
  };

  const getTierTotal = (tier: AchievementTier) => {
    return achievements.filter((a) => a.tier === tier).length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Achievements</Text>
          <Text style={styles.subtitle}>
            {progress.unlocked} of {progress.total} unlocked
          </Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
          
          <View style={styles.tierCounts}>
            {TIERS.map((tier) => (
              <View key={tier} style={styles.tierCount}>
                <Text style={styles.tierIcon}>{getTierIcon(tier)}</Text>
                <Text style={styles.tierNumber}>
                  {getTierCount(tier)}/{getTierTotal(tier)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Achievements by Category */}
          {['voting', 'matches', 'game', 'streak', 'social', 'explorer'].map((category) => {
            const categoryAchievements = getByCategory(category as any);
            if (categoryAchievements.length === 0) return null;
            
            return (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>
                  {CATEGORY_EMOJIS[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                
                <View style={styles.achievementsList}>
                  {categoryAchievements.map((achievement) => (
                    <View
                      key={achievement.id}
                      style={[
                        styles.achievementCard,
                        achievement.unlocked && styles.achievementUnlocked,
                      ]}
                    >
                      <View style={styles.achievementLeft}>
                        <View 
                          style={[
                            styles.achievementEmoji,
                            { 
                              backgroundColor: achievement.unlocked 
                                ? `${getTierColor(achievement.tier)}30`
                                : COLORS.cardElevated,
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 28 }}>
                            {achievement.unlocked ? achievement.emoji : '🔒'}
                          </Text>
                        </View>
                        
                        <View style={styles.achievementInfo}>
                          <View style={styles.achievementHeader}>
                            <Text style={styles.achievementTitle}>
                              {achievement.title}
                            </Text>
                            <Text style={[
                              styles.tierBadge,
                              { color: getTierColor(achievement.tier) },
                            ]}>
                              {getTierIcon(achievement.tier)}
                            </Text>
                          </View>
                          <Text style={styles.achievementDescription}>
                            {achievement.description}
                          </Text>
                          
                          {/* Progress Bar */}
                          <View style={styles.progressBarContainer}>
                            <View style={styles.progressBar}>
                              <View 
                                style={[
                                  styles.progressFill,
                                  { 
                                    width: `${Math.min(100, (achievement.current / achievement.requirement) * 100)}%`,
                                    backgroundColor: achievement.unlocked 
                                      ? getTierColor(achievement.tier)
                                      : COLORS.textMuted,
                                  },
                                ]} 
                              />
                            </View>
                            <Text style={styles.progressText}>
                              {achievement.current}/{achievement.requirement}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
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
  progressCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding * 2,
    padding: SIZES.padding * 2,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding * 2,
  },
  progressCircle: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  progressPercentage: {
    fontFamily: FONTS.bold,
    fontSize: 48,
    color: COLORS.primary,
  },
  progressLabel: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  tierCounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tierCount: {
    alignItems: 'center',
  },
  tierIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tierNumber: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
  categorySection: {
    marginBottom: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding * 2,
  },
  categoryTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
    textTransform: 'capitalize',
  },
  achievementsList: {
    gap: SIZES.padding,
  },
  achievementCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  achievementUnlocked: {
    opacity: 1,
    borderColor: COLORS.primary,
  },
  achievementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  tierBadge: {
    fontSize: 16,
  },
  achievementDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    minWidth: 35,
  },
});
