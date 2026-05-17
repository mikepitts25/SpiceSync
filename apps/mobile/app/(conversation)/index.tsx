import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
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
  AppTabBar,
  CardAccentTop,
} from '../../components/app-chrome';
import { ScreenTour } from '../../components/ScreenTour';
import {
  type ConversationStarter,
  getDailyStarterByLanguage,
  getRandomStarterByLanguage,
  getStartersByCategoryAndLanguage,
} from '../../lib/conversationStarters';
import {
  CONVERSATION_CATEGORY_FILTERS,
  LOVE_LANGUAGE_PROMPT_CATEGORY,
  LOVE_LANGUAGE_QUIZ_ROUTE,
  getLoveLanguageModuleCopy,
} from '../../lib/conversationExperience';
import {
  CONVERSATION_CARD_MIN_FONT_SCALE,
  CONVERSATION_CARD_QUESTION_LINES,
  getConversationCardQuestionTextStyle,
} from '../../lib/conversationCardText';
import { useConversationStore } from '../../lib/state/conversationStore';
import { useProfilesStore } from '../../lib/state/profiles';
import { useConversationTranslation, useTranslation } from '../../lib/i18n';
import { useLoveLanguagesStore } from '../../src/stores/loveLanguages';
import { COLORS, GRADIENTS, RADII, SHADOWS } from '../../constants/theme';

export default function ConversationScreen() {
  const router = useRouter();
  const { favorites, toggleFavorite, addToHistory } = useConversationStore();
  const { language } = useConversationTranslation();
  const { t } = useTranslation();
  const { activeId, profiles } = useProfilesStore(
    useShallow((state) => ({
      activeId: state.getActiveProfileId(),
      profiles: state.getProfiles(),
    }))
  );
  const loveLanguageResults = useLoveLanguagesStore((state) => state.results);
  const [selectedCategory, setSelectedCategory] =
    useState<ConversationStarter['category']>('date_night');
  const [currentStarter, setCurrentStarter] = useState<ConversationStarter>(
    () => getDailyStarterByLanguage(language)
  );
  const [questionIndex, setQuestionIndex] = useState(0);

  const categoryPool = useMemo(
    () => getStartersByCategoryAndLanguage(selectedCategory, language),
    [language, selectedCategory]
  );

  const loveLanguageCopy = useMemo(
    () =>
      getLoveLanguageModuleCopy(
        activeId ? loveLanguageResults[activeId] : undefined,
        profiles
          .filter((profile) => profile.id !== activeId)
          .map((profile) => ({
            name: profile.displayName ?? profile.name,
            result: loveLanguageResults[profile.id],
          }))
      ),
    [activeId, loveLanguageResults, profiles]
  );

  useEffect(() => {
    const starter =
      getRandomStarterByLanguage(language, { category: selectedCategory }) ??
      getDailyStarterByLanguage(language);
    setCurrentStarter(starter);
    setQuestionIndex(0);
    addToHistory(starter.id);
  }, [addToHistory, language, selectedCategory]);

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

  const showLoveLanguagePrompts = useCallback(() => {
    setSelectedCategory(LOVE_LANGUAGE_PROMPT_CATEGORY);
  }, []);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <View style={styles.tourWrap}>
        <ScreenTour
          screenId="conversation"
          screenLabel={t.tabs.conversation}
          steps={t.tours.conversation}
        />
      </View>

      <View style={styles.loveModule}>
        <View style={styles.loveCard}>
          <CardAccentTop />
          <View style={styles.loveInner}>
            <View style={styles.loveTopRow}>
              <View style={styles.loveCopy}>
                <Text style={styles.loveEyebrow}>
                  {loveLanguageCopy.eyebrow}
                </Text>
                <Text style={styles.loveTitle}>{loveLanguageCopy.title}</Text>
                <Text style={styles.loveDescription}>
                  {loveLanguageCopy.description}
                </Text>
              </View>
              <Text style={styles.loveMark}>♡</Text>
            </View>

            {loveLanguageCopy.activePrimary ? (
              <View style={styles.loveResultRow}>
                <View style={styles.loveResultBlock}>
                  <Text style={styles.loveResultLabel}>PRIMARY</Text>
                  <Text style={styles.loveResultValue}>
                    {loveLanguageCopy.activePrimary}
                  </Text>
                </View>
                {loveLanguageCopy.activeSecondary ? (
                  <View style={styles.loveResultBlock}>
                    <Text style={styles.loveResultLabel}>SECONDARY</Text>
                    <Text style={styles.loveResultValue}>
                      {loveLanguageCopy.activeSecondary}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {loveLanguageCopy.partnerSummary ? (
              <Text style={styles.lovePartner}>
                {loveLanguageCopy.partnerSummary}
              </Text>
            ) : null}

            <View style={styles.loveActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(LOVE_LANGUAGE_QUIZ_ROUTE as never)}
                style={styles.lovePrimaryPress}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.lovePrimaryButton}
                >
                  <Text style={styles.lovePrimaryText}>
                    {loveLanguageCopy.ctaLabel}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={showLoveLanguagePrompts}
                style={[
                  styles.lovePromptButton,
                  selectedCategory === LOVE_LANGUAGE_PROMPT_CATEGORY &&
                    styles.lovePromptButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.lovePromptText,
                    selectedCategory === LOVE_LANGUAGE_PROMPT_CATEGORY &&
                      styles.lovePromptTextActive,
                  ]}
                >
                  {selectedCategory === LOVE_LANGUAGE_PROMPT_CATEGORY
                    ? 'Showing prompts'
                    : loveLanguageCopy.promptLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          data={CONVERSATION_CATEGORY_FILTERS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const active = selectedCategory === item.id;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedCategory(item.id)}
                style={styles.categoryPress}
              >
                {active ? (
                  <LinearGradient
                    colors={GRADIENTS.primary}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.categoryActive}
                  >
                    <Text style={styles.categoryActiveText}>{item.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.categoryInactive}>
                    <Text style={styles.categoryInactiveText}>
                      {item.label}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.conversationCard}>
          <CardAccentTop />
          <View style={styles.cardInner}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardCategory}>
                {CONVERSATION_CATEGORY_FILTERS.find(
                  (item) => item.id === selectedCategory
                )?.label.toUpperCase()}
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
                <ChevronLeft size={20} color="rgba(255,255,255,0.37)" />
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

      <AppTabBar active="convo" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  tourWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  loveModule: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  loveCard: {
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  loveInner: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 9,
  },
  loveTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  loveCopy: {
    flex: 1,
    gap: 3,
  },
  loveEyebrow: {
    color: COLORS.maybe,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  loveTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  loveDescription: {
    color: COLORS.textSub,
    fontSize: 12,
    lineHeight: 17,
  },
  loveMark: {
    color: COLORS.pink,
    fontSize: 28,
    lineHeight: 31,
  },
  loveResultRow: {
    flexDirection: 'row',
    gap: 8,
  },
  loveResultBlock: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  loveResultLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loveResultValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  lovePartner: {
    color: COLORS.textSub,
    fontSize: 11,
    fontWeight: '700',
  },
  loveActions: {
    flexDirection: 'row',
    gap: 9,
  },
  lovePrimaryPress: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  lovePrimaryButton: {
    minHeight: 38,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  lovePrimaryText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  lovePromptButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  lovePromptButtonActive: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.28)',
  },
  lovePromptText: {
    color: COLORS.textSub,
    fontSize: 12,
    fontWeight: '800',
  },
  lovePromptTextActive: {
    color: COLORS.maybe,
  },
  categoryRow: {
    paddingBottom: 2,
  },
  categoryList: {
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryPress: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryActive: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  categoryActiveText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryInactive: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  categoryInactiveText: {
    color: 'rgba(255,255,255,0.37)',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  questionCount: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  questionText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
  },
  tipText: {
    color: 'rgba(255,255,255,0.31)',
    fontSize: 12,
    lineHeight: 18,
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
    color: 'rgba(255,45,146,0.5)',
    fontSize: 11,
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
