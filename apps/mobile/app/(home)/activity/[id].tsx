import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useKinks } from '../../../lib/data';
import { useVotesStore } from '../../../src/stores/votes';

export default function ActivityDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const language = useSettingsStore((state) => state.language);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const votes = useVotesStore((state) => state.votes);
  const setVote = useVotesStore((state) => state.setVote);

  const activity = kinks.find(k => k.id === id);
  const currentVote = votes[id] || null;

  if (!activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Activity Not Found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleVote = (vote: 'yes' | 'no' | 'maybe') => {
    setVote(activity.id, vote);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      adventure: '#4ECDC4',
      sensual: '#9B59B6',
      fantasy: '#E74C3C',
      playful: '#F39C12',
      bdsm: '#2C3E50',
      public: '#1ABC9C',
    };
    return colors[category] || COLORS.primary;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>

        {/* Category Badge */}
        <View style={[
          styles.categoryBadge,
          { backgroundColor: getCategoryColor(activity.category) }
        ]}>
          <Text style={styles.categoryText}>{activity.category}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{activity.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{activity.description}</Text>

        {/* Meta Info */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Intensity</Text>
            <View style={styles.intensityDots}>
              {[1, 2, 3, 4, 5].map((dot) => (
                <View
                  key={dot}
                  style={[
                    styles.intensityDot,
                    dot <= (activity.intensityScale || 1) && styles.intensityDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
          
          {activity.tags && activity.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {activity.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Current Vote */}
        {currentVote && (
          <View style={styles.currentVoteCard}>
            <Text style={styles.currentVoteLabel}>Your Vote:</Text>
            <Text style={[
              styles.currentVoteValue,
              currentVote === 'yes' && { color: COLORS.success },
              currentVote === 'no' && { color: COLORS.danger },
              currentVote === 'maybe' && { color: COLORS.warning },
            ]}>
              {currentVote === 'yes' ? '✓ Yes' : currentVote === 'no' ? '✕ No' : '? Maybe'}
            </Text>
          </View>
        )}

        {/* Vote Buttons */}
        <View style={styles.voteSection}>
          <Text style={styles.voteTitle}>Vote on this activity</Text>
          <View style={styles.voteButtons}>
            <Pressable 
              style={[styles.voteButton, styles.yesButton]}
              onPress={() => handleVote('yes')}
            >
              <Text style={styles.voteButtonText}>✓ Yes</Text>
            </Pressable>
            <Pressable 
              style={[styles.voteButton, styles.maybeButton]}
              onPress={() => handleVote('maybe')}
            >
              <Text style={styles.voteButtonText}>? Maybe</Text>
            </Pressable>
            <Pressable 
              style={[styles.voteButton, styles.noButton]}
              onPress={() => handleVote('no')}
            >
              <Text style={styles.voteButtonText}>✕ No</Text>
            </Pressable>
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
    padding: SIZES.padding * 2,
    paddingBottom: SIZES.padding,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: SIZES.padding,
  },
  errorTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding * 2,
  },
  backButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.primary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: SIZES.padding * 2,
    paddingHorizontal: SIZES.padding,
    paddingVertical: 6,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  categoryText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: '#fff',
    textTransform: 'capitalize',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginHorizontal: SIZES.padding * 2,
    marginBottom: SIZES.padding,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginHorizontal: SIZES.padding * 2,
    marginBottom: SIZES.padding * 2,
    lineHeight: 24,
  },
  metaCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding * 2,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding * 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  metaLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  intensityDots: {
    flexDirection: 'row',
    gap: 6,
  },
  intensityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  intensityDotActive: {
    backgroundColor: COLORS.primary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  currentVoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding * 2,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding * 2,
  },
  currentVoteLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  currentVoteValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
  },
  voteSection: {
    marginHorizontal: SIZES.padding * 2,
  },
  voteTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  voteButton: {
    flex: 1,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: COLORS.success,
  },
  maybeButton: {
    backgroundColor: COLORS.warning,
  },
  noButton: {
    backgroundColor: COLORS.danger,
  },
  voteButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
});
