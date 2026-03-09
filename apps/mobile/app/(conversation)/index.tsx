// apps/mobile/app/(conversation)/index.tsx
// Deep Dives - Main Conversation Starters Screen
// Browse categories, pick random topics, save favorites

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Heart,
  Sparkles,
  Users,
  Flame,
  Shuffle,
  ChevronRight,
  Share2,
  Bookmark,
  X,
  MessageCircle,
  Moon,
} from 'lucide-react-native';

import { COLORS, GRADIENTS, SIZES, SHADOWS } from '../../constants/theme';
import {
  ConversationStarter,
  categoryInfo,
  INTENSITY_LABELS,
  getStartersByCategory,
  getRandomStarter,
  getDailyStarter,
  filterStarters,
} from '../../lib/conversationStarters';
import { useConversationStore } from '../../lib/state/conversationStore';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

// Icon mapping
const CategoryIcon = ({ name, size = 24, color = '#fff' }: { name: string; size?: number; color?: string }) => {
  switch (name) {
    case 'heart':
      return <Heart size={size} color={color} />;
    case 'users':
      return <Users size={size} color={color} />;
    case 'sparkles':
      return <Sparkles size={size} color={color} />;
    case 'flame':
      return <Flame size={size} color={color} />;
    default:
      return <MessageCircle size={size} color={color} />;
  }
};

// Intensity badge component
const IntensityBadge = ({ level }: { level: number }) => {
  const info = INTENSITY_LABELS[level];
  return (
    <View style={[styles.intensityBadge, { backgroundColor: `${info.color}30` }]}>
      <View style={[styles.intensityDot, { backgroundColor: info.color }]} />
      <Text style={[styles.intensityText, { color: info.color }]}>{info.label}</Text>
    </View>
  );
};

// Category card component
const CategoryCard = ({
  category,
  onPress,
}: {
  category: (typeof categoryInfo)[0];
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={category.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.categoryCard}
      >
        <View style={styles.categoryIconContainer}>
          <CategoryIcon name={category.icon} size={28} color="#fff" />
        </View>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {category.description}
          </Text>
        </View>
        <View style={styles.categoryCount}>
          <Text style={styles.categoryCountText}>{category.count}</Text>
          <Text style={styles.categoryCountLabel}>prompts</Text>
        </View>
        <ChevronRight size={20} color="rgba(255,255,255,0.6)" style={styles.categoryArrow} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Conversation card component
const ConversationCard = ({
  starter,
  onNext,
  onFavorite,
  onShare,
  isFavorite,
}: {
  starter: ConversationStarter;
  onNext: () => void;
  onFavorite: () => void;
  onShare: () => void;
  isFavorite: boolean;
}) => {
  const [showFollowUps, setShowFollowUps] = useState(false);
  const category = categoryInfo.find((c) => c.id === starter.category);

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#1E1E2E', '#252538']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardMeta}>
            <IntensityBadge level={starter.intensity} />
            {category && (
              <View style={[styles.categoryTag, { backgroundColor: `${category.color}30` }]}>
                <CategoryIcon name={category.icon} size={12} color={category.color} />
                <Text style={[styles.categoryTagText, { color: category.color }]}>
                  {category.subtitle}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onFavorite} style={styles.favoriteButton}>
            <Heart
              size={24}
              color={isFavorite ? '#FF2D92' : 'rgba(255,255,255,0.5)'}
              fill={isFavorite ? '#FF2D92' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Main Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{starter.question}</Text>
        </View>

        {/* Context */}
        {starter.context && (
          <View style={styles.contextContainer}>
            <Text style={styles.contextText}>{starter.context}</Text>
          </View>
        )}

        {/* Follow-ups Toggle */}
        {starter.followUps && starter.followUps.length > 0 && (
          <TouchableOpacity
            style={styles.followUpsToggle}
            onPress={() => setShowFollowUps(!showFollowUps)}
          >
            <Text style={styles.followUpsToggleText}>
              {showFollowUps ? 'Hide follow-ups' : 'Show follow-up questions'}
            </Text>
            <ChevronRight
              size={16}
              color={COLORS.primary}
              style={{ transform: [{ rotate: showFollowUps ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>
        )}

        {/* Follow-ups */}
        {showFollowUps && starter.followUps && (
          <View style={styles.followUpsContainer}>
            {starter.followUps.map((followUp, index) => (
              <View key={index} style={styles.followUpItem}>
                <View style={styles.followUpBullet} />
                <Text style={styles.followUpText}>{followUp}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {starter.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Share2 size={20} color={COLORS.textSecondary} />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Shuffle size={20} color="#fff" />
              <Text style={styles.nextButtonText}>Next Topic</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

export default function ConversationScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ConversationStarter['category'] | null>(null);
  const [currentStarter, setCurrentStarter] = useState<ConversationStarter | null>(null);
  const [showDaily, setShowDaily] = useState(false);

  const { favorites, toggleFavorite, addToHistory } = useConversationStore();

  // Get daily starter
  const dailyStarter = useMemo(() => getDailyStarter(), []);

  // Pick a random starter
  const pickRandomStarter = useCallback(() => {
    const starter = getRandomStarter(
      selectedCategory ? { category: selectedCategory } : undefined
    );
    if (starter) {
      setCurrentStarter(starter);
      addToHistory(starter.id);
    }
  }, [selectedCategory, addToHistory]);

  // Handle category selection
  const handleCategoryPress = (categoryId: ConversationStarter['category']) => {
    setSelectedCategory(categoryId);
    const starter = getRandomStarter({ category: categoryId });
    if (starter) {
      setCurrentStarter(starter);
      addToHistory(starter.id);
    }
  };

  // Handle share
  const handleShare = async (starter: ConversationStarter) => {
    try {
      await Share.share({
        message: `💬 ${starter.question}\n\nFrom SpiceSync Deep Dives - Conversation starters for couples`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Show daily starter
  const handleShowDaily = () => {
    setCurrentStarter(dailyStarter);
    setShowDaily(true);
    addToHistory(dailyStarter.id);
  };

  // Clear selection and go back to categories
  const handleBack = () => {
    setSelectedCategory(null);
    setCurrentStarter(null);
    setShowDaily(false);
  };

  // Navigate to date night mode
  const handleDateNightMode = () => {
    router.push('/(conversation)/date-night');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {currentStarter ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerIcon}>
              <MessageCircle size={24} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {currentStarter ? (showDaily ? "Today's Question" : 'Deep Dives') : 'Deep Dives'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {currentStarter
                ? 'Conversation Starters'
                : '200+ prompts to spark meaningful talks'}
            </Text>
          </View>
          {!currentStarter && (
            <TouchableOpacity style={styles.dateNightButton} onPress={handleDateNightMode}>
              <Moon size={20} color={COLORS.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {currentStarter ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ConversationCard
            starter={currentStarter}
            onNext={pickRandomStarter}
            onFavorite={() => toggleFavorite(currentStarter.id)}
            onShare={() => handleShare(currentStarter)}
            isFavorite={favorites.includes(currentStarter.id)}
          />

          {/* Category filter hint */}
          {selectedCategory && (
            <TouchableOpacity style={styles.filterHint} onPress={handleBack}>
              <Text style={styles.filterHintText}>
                Showing {categoryInfo.find((c) => c.id === selectedCategory)?.title}
              </Text>
              <Text style={styles.filterHintAction}>Change category</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.categoriesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Daily Starter Button */}
          <TouchableOpacity style={styles.dailyButton} onPress={handleShowDaily}>
            <LinearGradient
              colors={GRADIENTS.soft}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dailyButtonGradient}
            >
              <View style={styles.dailyIconContainer}>
                <Sparkles size={28} color="#fff" />
              </View>
              <View style={styles.dailyTextContainer}>
                <Text style={styles.dailyTitle}>Today's Conversation Starter</Text>
                <Text style={styles.dailySubtitle}>
                  A fresh prompt every day to keep the conversation flowing
                </Text>
              </View>
              <ChevronRight size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Random Button */}
          <TouchableOpacity style={styles.randomButton} onPress={pickRandomStarter}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.randomButtonGradient}
            >
              <Shuffle size={24} color="#fff" />
              <Text style={styles.randomButtonText}>Pick a Random Topic</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Date Night Mode Button */}
          <TouchableOpacity style={styles.dateNightCard} onPress={handleDateNightMode}>
            <LinearGradient
              colors={['#1E1E2E', '#252538']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dateNightCardGradient}
            >
              <View style={styles.dateNightIconContainer}>
                <Moon size={32} color={COLORS.accent} />
              </View>
              <View style={styles.dateNightTextContainer}>
                <Text style={styles.dateNightTitle}>Date Night Mode</Text>
                <Text style={styles.dateNightSubtitle}>
                  Full-screen conversation experience with timer and beautiful backgrounds
                </Text>
              </View>
              <ChevronRight size={24} color={COLORS.accent} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Categories */}
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          {categoryInfo.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => handleCategoryPress(category.id)}
            />
          ))}

          {/* Favorites hint */}
          {favorites.length > 0 && (
            <View style={styles.favoritesHint}>
              <Heart size={16} color={COLORS.primary} fill={COLORS.primary} />
              <Text style={styles.favoritesHintText}>
                You have {favorites.length} saved favorite{favorites.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dateNightButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  categoriesContent: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },

  // Daily Button
  dailyButton: {
    marginBottom: 16,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  dailyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  dailyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dailyTextContainer: {
    flex: 1,
  },
  dailyTitle: {
    fontSize: SIZES.large,
    fontWeight: '700',
    color: '#fff',
  },
  dailySubtitle: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Random Button
  randomButton: {
    marginBottom: 16,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  randomButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  randomButtonText: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    color: '#fff',
  },

  // Date Night Card
  dateNightCard: {
    marginBottom: 24,
    borderRadius: SIZES.radiusLarge,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateNightCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  dateNightIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${COLORS.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dateNightTextContainer: {
    flex: 1,
  },
  dateNightTitle: {
    fontSize: SIZES.large,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateNightSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Section Title
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },

  // Category Card
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: SIZES.radiusLarge,
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: '#fff',
  },
  categorySubtitle: {
    fontSize: SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  categoryDescription: {
    fontSize: SIZES.small,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  categoryCount: {
    alignItems: 'center',
    marginRight: 8,
  },
  categoryCountText: {
    fontSize: SIZES.h3,
    fontWeight: '800',
    color: '#fff',
  },
  categoryCountLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },
  categoryArrow: {
    marginLeft: 4,
  },

  // Conversation Card
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: SIZES.radiusLarge,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 36,
  },
  contextContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 16,
  },
  contextText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  followUpsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  followUpsToggleText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  followUpsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: SIZES.radius,
    marginBottom: 16,
  },
  followUpItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  followUpBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
    marginRight: 12,
  },
  followUpText: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
    gap: 8,
    flex: 1,
  },
  actionButtonText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  nextButtonText: {
    fontSize: SIZES.body,
    color: '#fff',
    fontWeight: '700',
  },

  // Filter hint
  filterHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterHintText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  filterHintAction: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Favorites hint
  favoritesHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  favoritesHintText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
});
