// Achievements Screen
// Displays user achievements and streak information

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { 
  ACHIEVEMENTS, 
  useStreakStore,
  Achievement,
  AchievementId,
} from '../lib/achievements';
import AnimatedButton from '../components/AnimatedButton';
import { useRouter } from 'expo-router';

const { width: SCREEN_W } = Dimensions.get('window');

// Achievement Card Component
function AchievementCard({
  achievement,
  unlocked,
  progress,
  index,
}: {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
  index: number;
}) {
  const scale = useSharedValue(0);
  
  // Staggered animation
  React.useEffect(() => {
    scale.value = withDelay(
      index * 50,
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  }, [scale, index]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View
      style={[
        styles.achievementCard,
        !unlocked && styles.achievementCardLocked,
        animatedStyle,
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, unlocked && styles.iconContainerUnlocked]}>
        <Text style={styles.icon}>{achievement.icon}</Text>
        {unlocked && <View style={styles.unlockedBadge}><Text>✓</Text></View>}
      </View>
      
      {/* Content */}
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, !unlocked && styles.lockedText]}>
          {achievement.title}
        </Text>
        <Text style={styles.achievementDescription}>
          {achievement.description}
        </Text>
        
        {/* Progress bar */}
        {!unlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        )}
        
        {unlocked && (
          <Text style={styles.unlockedText}>Unlocked! 🎉</Text>
        )}
      </View>
    </Animated.View>
  );
}

// Streak Card Component
function StreakCard() {
  const { currentStreak, longestStreak, daysActive } = useStreakStore();
  
  return (
    <View style={styles.streakCard}>
      <Text style={styles.streakTitle}>🔥 Your Streak</Text>
      
      <View style={styles.streakStats}>
        <View style={styles.streakStat}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Current</Text>
        </View>
        
        <View style={styles.streakDivider} />
        
        <View style={styles.streakStat}>
          <Text style={styles.streakNumber}>{longestStreak}</Text>
          <Text style={styles.streakLabel}>Best</Text>
        </View>
        
        <View style={styles.streakDivider} />
        
        <View style={styles.streakStat}>
          <Text style={styles.streakNumber}>{daysActive.length}</Text>
          <Text style={styles.streakLabel}>Total Days</Text>
        </View>
      </View>
      
      {/* Streak message */}
      <Text style={styles.streakMessage}>
        {currentStreak >= 7 
          ? "You're on fire! Keep it going! 🔥" 
          : currentStreak >= 3 
            ? "Great streak! Don't break it! 💪"
            : "Start your streak today! ✨"}
      </Text>
    </View>
  );
}

// Category Progress Component
function CategoryProgress() {
  const { categoriesCompleted } = useStreakStore();
  const categories = Object.entries(categoriesCompleted);
  
  if (categories.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🎯</Text>
        <Text style={styles.emptyText}>
          Start exploring categories to see your progress!
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.categorySection}>
      <Text style={styles.sectionTitle}>Category Progress</Text>
      {categories.map(([category, activities]) => (
        <View key={category} style={styles.categoryItem}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryName}>{category}</Text>
            <Text style={styles.categoryCount}>{activities.length} activities</Text>
          </View>
          <View style={styles.categoryBar}>
            <View 
              style={[
                styles.categoryFill, 
                { width: `${Math.min(activities.length * 10, 100)}%` }
              ]} 
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const unlockedAchievements = useStreakStore((state) => state.unlockedAchievements);
  const getProgress = useStreakStore((state) => state.getProgress);
  
  // Separate unlocked and locked achievements
  const unlocked = ACHIEVEMENTS.filter(a => unlockedAchievements.includes(a.id));
  const locked = ACHIEVEMENTS.filter(a => !unlockedAchievements.includes(a.id));
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
        <Text style={styles.headerSubtitle}>
          {unlocked.length} of {ACHIEVEMENTS.length} unlocked
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Card */}
        <StreakCard />
        
        {/* Category Progress */}
        <CategoryProgress />
        
        {/* Unlocked Achievements */}
        {unlocked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Unlocked</Text>
            {unlocked.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={true}
                progress={1}
                index={index}
              />
            ))}
          </View>
        )}
        
        {/* Locked Achievements */}
        {locked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Locked</Text>
            {locked.map((achievement, index) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={false}
                progress={getProgress(achievement.id)}
                index={index + unlocked.length}
              />
            ))}
          </View>
        )}
        
        {/* Back Button */}
        <AnimatedButton
          title="Back to Profile"
          variant="outline"
          onPress={() => router.back()}
          style={styles.backButton}
        />
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
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding * 2,
    gap: SIZES.padding * 2,
  },
  streakCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding * 2,
    ...SHADOWS.md,
  },
  streakTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakStat: {
    alignItems: 'center',
  },
  streakNumber: {
    fontFamily: FONTS.extraBold,
    fontSize: SIZES.display,
    color: COLORS.primary,
  },
  streakLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  streakDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.border,
  },
  streakMessage: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.padding,
  },
  section: {
    gap: SIZES.padding,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: SIZES.padding / 2,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    gap: SIZES.padding,
    ...SHADOWS.sm,
  },
  achievementCardLocked: {
    opacity: 0.7,
    backgroundColor: COLORS.backgroundSecondary,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainerUnlocked: {
    backgroundColor: `${COLORS.primary}20`,
  },
  icon: {
    fontSize: 28,
  },
  unlockedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.yes,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
    justifyContent: 'center',
  },
  achievementTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  lockedText: {
    color: COLORS.textMuted,
  },
  achievementDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    minWidth: 30,
    textAlign: 'right',
  },
  unlockedText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.yes,
    marginTop: 4,
  },
  categorySection: {
    gap: SIZES.padding,
  },
  categoryItem: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.body,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  categoryCount: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  categoryBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: SIZES.padding,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    marginTop: SIZES.padding,
  },
});
