import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { BackHeader } from '../../components/app-chrome';
import {
  ACHIEVEMENTS,
  useStreakStore,
  type Achievement,
} from '../../lib/achievements';
import { COLORS, GRADIENTS } from '../../constants/theme';

export default function AchievementsScreen() {
  const { daysActive, unlockedAchievements, getProgress } = useStreakStore();

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title="Achievements" subtitle="ACHIEVEMENTS" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.grid}>
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = unlockedAchievements.includes(achievement.id);
            const progress = unlocked ? 1 : getProgress(achievement.id);
            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                unlocked={unlocked}
                progress={progress}
              />
            );
          })}
        </View>

        <Text style={styles.footerText}>
          {daysActive.length} active days tracked locally
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function AchievementCard({
  achievement,
  unlocked,
  progress,
}: {
  achievement: Achievement;
  unlocked: boolean;
  progress: number;
}) {
  return (
    <View style={[styles.badgeCard, unlocked && styles.badgeCardUnlocked]}>
      <Text style={styles.badgeIcon}>{achievement.icon}</Text>
      <Text style={styles.badgeName} numberOfLines={2}>
        {achievement.title}
      </Text>
      <Text style={styles.badgeDescription} numberOfLines={3}>
        {achievement.description}
      </Text>

      {!unlocked ? (
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[
              styles.progressFill,
              { width: `${Math.max(6, Math.min(progress, 1) * 100)}%` },
            ]}
          />
        </View>
      ) : null}

      {!unlocked ? (
        <View style={styles.lockedOverlay}>
          <Text style={styles.lockedText}>Locked</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    minHeight: 184,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  badgeCardUnlocked: {
    borderColor: COLORS.border,
  },
  badgeIcon: {
    fontSize: 32,
  },
  badgeName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeDescription: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  progressTrack: {
    marginTop: 'auto',
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
