import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { ChevronLeft, ClipboardList, MessageCircle } from 'lucide-react-native';

import { AppHeader, CardAccentTop } from '../../components/app-chrome';
import {
  LOVE_LANGUAGE_PROMPT_CATEGORY,
  LOVE_LANGUAGE_QUIZ_ROUTE,
  getLoveLanguageModuleCopy,
} from '../../lib/conversationExperience';
import { useProfilesStore } from '../../lib/state/profiles';
import { useLoveLanguagesStore } from '../../src/stores/loveLanguages';
import { COLORS, GRADIENTS, SHADOWS } from '../../constants/theme';

const MAIN_TOPIC_FONT_SIZE = 24;
const MAIN_TOPIC_LINE_HEIGHT = 31;
const NORMAL_FONT_SIZE = 16;
const NORMAL_LINE_HEIGHT = 23;

export default function LoveLanguagesHubScreen() {
  const router = useRouter();
  const { activeId, profiles } = useProfilesStore(
    useShallow((state) => ({
      activeId: state.getActiveProfileId(),
      profiles: state.getProfiles(),
    }))
  );
  const loveLanguageResults = useLoveLanguagesStore((state) => state.results);

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

  const promptRoute = `/(conversation)/topic/${LOVE_LANGUAGE_PROMPT_CATEGORY}`;

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
          <Text style={styles.eyebrow}>{loveLanguageCopy.eyebrow}</Text>
          <Text style={styles.title}>Love Languages</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <CardAccentTop />
          <View style={styles.summaryInner}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryTitle}>
                  {loveLanguageCopy.title}
                </Text>
                <Text style={styles.summaryDescription}>
                  {loveLanguageCopy.description}
                </Text>
              </View>
              <Text style={styles.summaryMark}>♡</Text>
            </View>

            {loveLanguageCopy.activePrimary ? (
              <View style={styles.resultRow}>
                <View style={styles.resultBlock}>
                  <Text style={styles.resultLabel}>PRIMARY</Text>
                  <Text style={styles.resultValue}>
                    {loveLanguageCopy.activePrimary}
                  </Text>
                </View>
                {loveLanguageCopy.activeSecondary ? (
                  <View style={styles.resultBlock}>
                    <Text style={styles.resultLabel}>SECONDARY</Text>
                    <Text style={styles.resultValue}>
                      {loveLanguageCopy.activeSecondary}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {loveLanguageCopy.partnerSummary ? (
              <Text style={styles.partnerSummary}>
                {loveLanguageCopy.partnerSummary}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.optionStack}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use Love Languages prompts"
            onPress={() => router.push(promptRoute as never)}
            style={styles.optionPress}
          >
            <View style={styles.optionCard}>
              <MessageCircle size={24} color={COLORS.pink} />
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Use prompts</Text>
                <Text style={styles.optionText}>
                  Open guided questions for turning your results into a real
                  conversation.
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={loveLanguageCopy.ctaLabel}
            onPress={() => router.push(LOVE_LANGUAGE_QUIZ_ROUTE as never)}
            style={styles.optionPress}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.quizCard}
            >
              <ClipboardList size={24} color={COLORS.textPrimary} />
              <View style={styles.optionCopy}>
                <Text style={styles.quizTitle}>
                  {loveLanguageCopy.ctaLabel}
                </Text>
                <Text style={styles.quizText}>
                  Complete the quiz or revisit your current result.
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 14,
  },
  summaryCard: {
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  summaryInner: {
    padding: 16,
    gap: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCopy: {
    flex: 1,
    gap: 6,
  },
  summaryTitle: {
    color: COLORS.textPrimary,
    fontSize: MAIN_TOPIC_FONT_SIZE,
    lineHeight: MAIN_TOPIC_LINE_HEIGHT,
    fontWeight: '800',
  },
  summaryDescription: {
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
  },
  summaryMark: {
    color: COLORS.pink,
    fontSize: MAIN_TOPIC_FONT_SIZE,
    lineHeight: MAIN_TOPIC_LINE_HEIGHT,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resultBlock: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  resultLabel: {
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '800',
    letterSpacing: 0,
  },
  resultValue: {
    color: COLORS.textPrimary,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '700',
  },
  partnerSummary: {
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '700',
  },
  optionStack: {
    gap: 12,
  },
  optionPress: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  optionCard: {
    minHeight: 92,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quizCard: {
    minHeight: 92,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  optionText: {
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
  },
  quizTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  quizText: {
    color: COLORS.textPrimary,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    opacity: 0.86,
  },
});
