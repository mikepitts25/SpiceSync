import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useVotesStore } from '../../../src/stores/votes';
import { useKinks } from '../../../../lib/data';

interface Suggestion {
  id: string;
  type: 'match' | 'trending' | 'milestone' | 'explore';
  title: string;
  description: string;
  activityId?: string;
  category?: string;
  priority: number;
}

export default function SuggestionsHub() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);
  const { kinks } = useKinks(language === 'es' ? 'es' : 'en');
  const votes = useVotesStore((state) => state.votes);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Generate smart suggestions based on voting patterns
  const suggestions = useMemo(() => {
    const allVotes = Object.entries(votes);
    const yesVotes = allVotes.filter(([, vote]) => vote === 'yes');
    const maybeVotes = allVotes.filter(([, vote]) => vote === 'maybe');
    
    const suggestionList: Suggestion[] = [];

    // 1. Remind about "maybe" votes (high conversion potential)
    if (maybeVotes.length > 0) {
      const randomMaybe = maybeVotes[Math.floor(Math.random() * maybeVotes.length)];
      const activity = kinks.find(k => k.id === randomMaybe[0]);
      if (activity) {
        suggestionList.push({
          id: 'revisit-maybe',
          type: 'explore',
          title: 'Revisit This Maybe',
          description: `You said "maybe" to "${activity.title}" - want to discuss it?`,
          activityId: activity.id,
          priority: 10,
        });
      }
    }

    // 2. Category exploration based on yes votes
    if (yesVotes.length > 0) {
      const categoryCounts: Record<string, number> = {};
      yesVotes.forEach(([id]) => {
        const activity = kinks.find(k => k.id === id);
        if (activity) {
          categoryCounts[activity.category] = (categoryCounts[activity.category] || 0) + 1;
        }
      });
      
      const topCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0];
      
      if (topCategory) {
        // Find similar activities in same category they haven't voted on
        const categoryActivities = kinks.filter(k => 
          k.category === topCategory[0] && !votes[k.id]
        );
        
        if (categoryActivities.length > 0) {
          const suggestion = categoryActivities[0];
          suggestionList.push({
            id: 'category-explore',
            type: 'trending',
            title: `More ${topCategory[0]} Activities`,
            description: `Since you like ${topCategory[0]}, try "${suggestion.title}"`,
            activityId: suggestion.id,
            category: topCategory[0],
            priority: 8,
          });
        }
      }
    }

    // 3. Intensity progression suggestions
    const intensityCounts = { low: 0, medium: 0, high: 0 };
    yesVotes.forEach(([id]) => {
      const activity = kinks.find(k => k.id === id);
      if (activity) {
        const intensity = activity.intensityScale || 1;
        if (intensity <= 2) intensityCounts.low++;
        else if (intensity <= 4) intensityCounts.medium++;
        else intensityCounts.high++;
      }
    });

    // Suggest next intensity level
    if (intensityCounts.medium > intensityCounts.high) {
      const highIntensityUnvoted = kinks.filter(k => 
        (k.intensityScale || 1) >= 4 && !votes[k.id]
      );
      if (highIntensityUnvoted.length > 0) {
        const suggestion = highIntensityUnvoted[0];
        suggestionList.push({
          id: 'intensity-up',
          type: 'explore',
          title: 'Ready for More?',
          description: `Try something more adventurous: "${suggestion.title}"`,
          activityId: suggestion.id,
          priority: 7,
        });
      }
    }

    // 4. Milestone celebrations
    if (yesVotes.length > 0 && yesVotes.length % 10 === 0) {
      suggestionList.push({
        id: 'milestone',
        type: 'milestone',
        title: `🎉 ${yesVotes.length} Matches!`,
        description: 'You\'ve found 10 things you both want to try. Time to pick one!',
        priority: 9,
      });
    }

    // 5. Daily trending pick
    const unvotedActivities = kinks.filter(k => !votes[k.id]);
    if (unvotedActivities.length > 0) {
      const randomActivity = unvotedActivities[Math.floor(Math.random() * unvotedActivities.length)];
      suggestionList.push({
        id: 'daily-pick',
        type: 'trending',
        title: 'Today\'s Pick',
        description: `Try something new: "${randomActivity.title}"`,
        activityId: randomActivity.id,
        priority: 5,
      });
    }

    // Sort by priority
    return suggestionList.sort((a, b) => b.priority - a.priority);
  }, [votes, kinks]);

  const handleSuggestionPress = (suggestion: Suggestion) => {
    if (suggestion.activityId) {
      router.push(`/(home)/activity/${suggestion.activityId}`);
    } else if (suggestion.type === 'milestone') {
      router.push('/(matches)');
    }
  };

  const getTypeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'match': return COLORS.success;
      case 'trending': return COLORS.warning;
      case 'milestone': return COLORS.primary;
      case 'explore': return COLORS.secondary;
      default: return COLORS.primary;
    }
  };

  const getTypeEmoji = (type: Suggestion['type']) => {
    switch (type) {
      case 'match': return '💕';
      case 'trending': return '🔥';
      case 'milestone': return '🎉';
      case 'explore': return '✨';
      default: return '💡';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>💡 Suggestions</Text>
          <Text style={styles.subtitle}>
            Personalized recommendations for you both
          </Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {suggestions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎲</Text>
              <Text style={styles.emptyTitle}>Start Swiping!</Text>
              <Text style={styles.emptyText}>
                Vote on activities to get personalized suggestions
              </Text>
              <Pressable 
                style={styles.emptyButton}
                onPress={() => router.push('/(deck)')}
              >
                <Text style={styles.emptyButtonText}>Go to Deck</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.suggestionsList}>
              {suggestions.map((suggestion, index) => (
                <Pressable
                  key={suggestion.id}
                  style={[
                    styles.suggestionCard,
                    { borderLeftColor: getTypeColor(suggestion.type) },
                  ]}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionEmoji}>
                      {getTypeEmoji(suggestion.type)}
                    </Text>
                    <View style={[
                      styles.typeBadge,
                      { backgroundColor: `${getTypeColor(suggestion.type)}20` },
                    ]}>
                      <Text style={[
                        styles.typeText,
                        { color: getTypeColor(suggestion.type) },
                      ]}>
                        {suggestion.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>
                    {suggestion.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push('/(deck)')}
              >
                <Text style={styles.actionEmoji}>🎴</Text>
                <Text style={styles.actionText}>Swipe More</Text>
              </Pressable>
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push('/(matches)')}
              >
                <Text style={styles.actionEmoji}>💕</Text>
                <Text style={styles.actionText}>See Matches</Text>
              </Pressable>
              <Pressable 
                style={styles.actionButton}
                onPress={() => router.push('/(game)')}
              >
                <Text style={styles.actionEmoji}>🎲</Text>
                <Text style={styles.actionText}>Play Game</Text>
              </Pressable>
            </View>
          </View>
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
  emptyState: {
    alignItems: 'center',
    padding: SIZES.padding * 4,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SIZES.padding,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  emptyButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  suggestionsList: {
    padding: SIZES.padding * 1.5,
    gap: SIZES.padding,
  },
  suggestionCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  suggestionEmoji: {
    fontSize: 24,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
  },
  suggestionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 4,
  },
  suggestionDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  quickActions: {
    padding: SIZES.padding * 1.5,
    paddingTop: 0,
  },
  quickActionsTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.text,
  },
});
