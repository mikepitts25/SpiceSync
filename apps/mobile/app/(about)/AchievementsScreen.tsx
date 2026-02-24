import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import {
  useAchievementsStore,
  ACHIEVEMENTS,
  Achievement,
  AchievementId,
} from '../../src/stores/achievements';

const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const CATEGORY_LABELS: Record<string, string> = {
  beginner: '🌱 Beginner',
  explorer: '🔍 Explorer',
  matcher: '💑 Matcher',
  adventurer: '🎒 Adventurer',
  social: '🤝 Social',
  special: '✨ Special',
};

function AchievementCard({
  achievement,
  unlocked,
  onPress,
}: {
  achievement: Achievement;
  unlocked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.card, unlocked && styles.cardUnlocked]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{achievement.emoji}</Text>
        <View
          style={[
            styles.tierBadge,
            { backgroundColor: TIER_COLORS[achievement.tier] },
          ]}
        >
          <Text style={styles.tierText}>
            {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.title, !unlocked && styles.titleLocked]}>
        {achievement.secret && !unlocked ? '???' : achievement.title}
      </Text>
      
      <Text style={[styles.description, !unlocked && styles.descriptionLocked]}>
        {achievement.secret && !unlocked
          ? 'Secret achievement - keep exploring!'
          : achievement.description}
      </Text>
      
      {!unlocked && <View style={styles.lockedOverlay} />}
    </Pressable>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {current}/{total}
      </Text>
    </View>
  );
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { unlocked, showUnlockAnimation, clearUnlockAnimation } =
    useAchievementsStore();
  const [selectedAchievement, setSelectedAchievement] =
    React.useState<Achievement | null>(null);

  // Group achievements by category
  const grouped = React.useMemo(() => {
    const groups: Record<string, Achievement[]> = {};
    ACHIEVEMENTS.forEach((achievement) => {
      if (!groups[achievement.category]) {
        groups[achievement.category] = [];
      }
      groups[achievement.category].push(achievement);
    });
    return groups;
  }, []);

  // Calculate progress
  const progress = React.useMemo(() => {
    const total = ACHIEVEMENTS.length;
    const completed = unlocked.length;
    return { total, completed, percentage: Math.round((completed / total) * 100) };
  }, [unlocked]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSubtitle}>
            {progress.completed} of {progress.total} unlocked
          </Text>
          <ProgressBar current={progress.completed} total={progress.total} />
        </View>

        {/* Categories */}
        {Object.entries(grouped).map(([category, achievements]) => {
          const categoryUnlocked = achievements.filter((a) =>
            unlocked.includes(a.id)
          ).length;

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>
                  {CATEGORY_LABELS[category] || category}
                </Text>
                <Text style={styles.categoryProgress}>
                  {categoryUnlocked}/{achievements.length}
                </Text>
              </View>

              <View style={styles.achievementsGrid}>
                {achievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={unlocked.includes(achievement.id)}
                    onPress={() => setSelectedAchievement(achievement)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal
        visible={!!selectedAchievement}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAchievement && (
              <>
                <Text style={styles.modalEmoji}>
                  {selectedAchievement.emoji}
                </Text>
                <Text style={styles.modalTitle}>
                  {selectedAchievement.title}
                </Text>
                <Text style={styles.modalDescription}>
                  {selectedAchievement.description}
                </Text>
                <View
                  style={[
                    styles.modalTier,
                    { backgroundColor: TIER_COLORS[selectedAchievement.tier] },
                  ]}
                >
                  <Text style={styles.modalTierText}>
                    {selectedAchievement.tier.toUpperCase()}
                  </Text>
                </View>
                <Pressable
                  style={styles.modalClose}
                  onPress={() => setSelectedAchievement(null)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Unlock Animation */}
      <Modal
        visible={!!showUnlockAnimation}
        transparent
        animationType="fade"
        onRequestClose={clearUnlockAnimation}
      >
        {showUnlockAnimation && (
          <UnlockAnimation
            achievement={ACHIEVEMENTS.find((a) => a.id === showUnlockAnimation)!}
            onComplete={clearUnlockAnimation}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

function UnlockAnimation({
  achievement,
  onComplete,
}: {
  achievement: Achievement;
  onComplete: () => void;
}) {
  const scale = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, []);

  return (
    <Animated.View style={[styles.unlockOverlay, { opacity }]}>
      <Animated.View style={[styles.unlockContent, { transform: [{ scale }] }]}>
        <Text style={styles.unlockLabel}>Achievement Unlocked!</Text>
        <Text style={styles.unlockEmoji}>{achievement.emoji}</Text>
        <Text style={styles.unlockTitle}>{achievement.title}</Text>
        <Text style={styles.unlockDescription}>{achievement.description}</Text>
      </Animated.View>
    </Animated.View>
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
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.padding,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: FONTS.semiBold,
    fontSize: SIZES.small,
    color: COLORS.text,
    minWidth: 40,
  },
  categorySection: {
    padding: SIZES.padding * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  categoryTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
  },
  categoryProgress: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
  },
  cardUnlocked: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  emoji: {
    fontSize: 28,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tierText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: '#000',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: 4,
  },
  titleLocked: {
    color: COLORS.textMuted,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  descriptionLocked: {
    color: COLORS.textMuted,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding * 2,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 60,
    marginBottom: SIZES.padding,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  modalDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  modalTier: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 8,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding * 2,
  },
  modalTierText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: '#000',
  },
  modalClose: {
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
  },
  modalCloseText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.primary,
  },
  unlockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  unlockContent: {
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  unlockLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.primary,
    marginBottom: SIZES.padding,
  },
  unlockEmoji: {
    fontSize: 80,
    marginBottom: SIZES.padding,
  },
  unlockTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  unlockDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
