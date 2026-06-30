import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  X,
} from 'lucide-react-native';

import {
  AccentBar,
  ActionCircle,
  AppHeader,
  CardAccentTop,
} from '../../../components/app-chrome';
import {
  type ConversationStarter,
  getDailyStarterByLanguage,
  getRandomStarterByLanguage,
  getStartersByCategoryAndLanguage,
} from '../../../lib/conversationStarters';
import { getConversationTopicTile } from '../../../lib/conversationExperience';
import {
  CONVERSATION_CARD_MIN_FONT_SCALE,
  CONVERSATION_CARD_QUESTION_LINES,
  getConversationCardQuestionTextStyle,
} from '../../../lib/conversationCardText';
import { useConversationStore } from '../../../lib/state/conversationStore';
import { useConversationTranslation } from '../../../lib/i18n';
import { COLORS, GRADIENTS, RADII, SHADOWS } from '../../../constants/theme';

const MAIN_TOPIC_FONT_SIZE = 24;
const MAIN_TOPIC_LINE_HEIGHT = 31;
const NORMAL_FONT_SIZE = 16;
const NORMAL_LINE_HEIGHT = 23;

export default function ConversationTopicScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const topic = getConversationTopicTile(category);
  const selectedCategory =
    topic?.id ?? ('date_night' as ConversationStarter['category']);
  const { favorites, toggleFavorite, addToHistory } = useConversationStore();
  const { language } = useConversationTranslation();
  const [currentStarter, setCurrentStarter] = useState<ConversationStarter>(
    () =>
      getRandomStarterByLanguage(language, { category: selectedCategory }) ??
      getDailyStarterByLanguage(language)
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const categoryPool = useMemo(
    () => getStartersByCategoryAndLanguage(selectedCategory, language),
    [language, selectedCategory]
  );

  useEffect(() => {
    if (!topic) {
      router.replace('/(conversation)' as never);
    }
  }, [router, topic]);

  useEffect(() => {
    if (!topic) return;
    const starter =
      getRandomStarterByLanguage(language, { category: selectedCategory }) ??
      getDailyStarterByLanguage(language);
    setCurrentStarter(starter);
    setQuestionIndex(0);
    addToHistory(starter.id);
  }, [addToHistory, language, selectedCategory, topic]);

  const isFavorite = favorites.includes(currentStarter.id);

  const showStarter = useCallback(
    (offset: number) => {
      if (!categoryPool.length) return;
      const nextIndex =
        (questionIndex + offset + categoryPool.length) % categoryPool.length;
      const next = categoryPool[nextIndex];
      setQuestionIndex(nextIndex);
      setCurrentStarter(next);
      addToHistory(next.id);
    },
    [addToHistory, categoryPool, questionIndex]
  );

  const pickRandom = useCallback(() => {
    const starter =
      getRandomStarterByLanguage(language, { category: selectedCategory }) ??
      getDailyStarterByLanguage(language);
    const index = categoryPool.findIndex((item) => item.id === starter.id);
    setCurrentStarter(starter);
    setQuestionIndex(index >= 0 ? index : 0);
    addToHistory(starter.id);
  }, [addToHistory, categoryPool, language, selectedCategory]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `SpiceSync conversation starter: ${currentStarter.question}`,
      });
    } catch {
      // Native share cancellation does not need UI.
    }
  }, [currentStarter.question]);

  const handleSave = useCallback(() => {
    toggleFavorite(currentStarter.id);
  }, [currentStarter.id, toggleFavorite]);

  if (!topic) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to conversation topics"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={21} color={COLORS.textPrimary} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{topic.mark}</Text>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.86}
            numberOfLines={1}
            style={styles.title}
          >
            {topic.label}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.conversationCard}>
          <CardAccentTop />
          <View style={styles.cardInner}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardCategory}>
                {topic.label.toUpperCase()}
              </Text>
              <Text style={styles.questionCount}>
                QUESTION {Math.min(questionIndex + 1, categoryPool.length || 1)}{' '}
                OF {categoryPool.length || 1}
              </Text>
            </View>
            <AccentBar />

            <Text
              adjustsFontSizeToFit
              minimumFontScale={CONVERSATION_CARD_MIN_FONT_SCALE}
              numberOfLines={CONVERSATION_CARD_QUESTION_LINES}
              style={[
                styles.questionText,
                getConversationCardQuestionTextStyle(currentStarter.question),
              ]}
            >
              {currentStarter.question}
            </Text>

            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              numberOfLines={3}
              style={styles.tipText}
            >
              {currentStarter.context ||
                "Take turns sharing. Really listen to each other's answer."}
            </Text>

            {isFavorite ? (
              <View style={styles.savedBadge}>
                <Heart size={14} color={COLORS.pink} fill={COLORS.pink} />
                <Text style={styles.savedText}>Saved to favorites</Text>
              </View>
            ) : null}

            <View style={styles.navRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous question"
                onPress={() => showStarter(-1)}
                style={styles.prevButton}
              >
                <ChevronLeft size={20} color={COLORS.textSub} />
              </Pressable>

              <View style={styles.progressDots}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index <= questionIndex % 5 && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next question"
                onPress={() => showStarter(1)}
                style={styles.nextButtonPress}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.nextButton}
                >
                  <ChevronRight size={21} color={COLORS.textPrimary} />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <ActionCircle
            label="SKIP"
            icon={X}
            color={COLORS.no}
            onPress={pickRandom}
          />
          <ActionCircle
            label="SAVE"
            icon={Heart}
            variant="gradient"
            color={COLORS.pink}
            size={66}
            iconSize={28}
            onPress={handleSave}
          />
          <ActionCircle
            label="SHARE"
            icon={Share2}
            color={COLORS.maybe}
            onPress={handleShare}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.uiDark,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.maybe,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '800',
    letterSpacing: 0,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: MAIN_TOPIC_FONT_SIZE,
    lineHeight: MAIN_TOPIC_LINE_HEIGHT,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 12,
  },
  conversationCard: {
    flex: 1,
    borderRadius: RADII.card,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardCategory: {
    color: COLORS.pink,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '700',
    letterSpacing: 0,
  },
  questionCount: {
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '700',
  },
  questionText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: MAIN_TOPIC_FONT_SIZE,
    lineHeight: MAIN_TOPIC_LINE_HEIGHT,
    fontWeight: '800',
  },
  tipText: {
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
  },
  savedBadge: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedText: {
    color: COLORS.pink,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prevButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.uiDark,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 5,
  },
  progressDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressDotActive: {
    backgroundColor: COLORS.pink,
  },
  nextButtonPress: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  nextButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
});
