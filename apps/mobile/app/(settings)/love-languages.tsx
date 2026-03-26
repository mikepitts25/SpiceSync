import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInRight, FadeInLeft, FadeInUp } from 'react-native-reanimated';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import {
  QUIZ_QUESTIONS,
  calculateResults,
  LoveLanguage,
  LOVE_LANGUAGE_NAMES,
  LOVE_LANGUAGE_EMOJIS,
  LOVE_LANGUAGE_DESCRIPTIONS,
  QuizResult,
} from '../../lib/loveLanguages';
import { useLoveLanguagesStore } from '../../src/stores/loveLanguages';
import { useProfilesStore } from '../../src/stores/profiles';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useTranslation } from '../../lib/i18n';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

export default function LoveLanguagesQuizScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  
  const { activeId, profiles } = useProfilesStore((state) => ({
    activeId: state.getActiveProfileId(),
    profiles: state.getProfiles(),
  }));
  
  const { setResult, getResult } = useLoveLanguagesStore();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<LoveLanguage[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [result, setResultState] = useState<QuizResult | null>(null);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>('right');

  const activeProfile = profiles.find((p) => p.id === activeId);
  const existingResult = activeId ? getResult(activeId) : undefined;

  const handleAnswer = useCallback((type: LoveLanguage) => {
    const newAnswers = [...answers, type];
    setAnswers(newAnswers);
    
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setAnimationDirection('left');
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setAnimationDirection('right');
      }, 100);
    } else {
      // Quiz complete
      const quizResult = calculateResults(newAnswers);
      setResultState(quizResult);
      if (activeId) {
        setResult(activeId, quizResult);
      }
      setShowResults(true);
    }
  }, [answers, currentQuestion, activeId, setResult]);

  const handleRestart = useCallback(() => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setResultState(null);
    setAnimationDirection('right');
  }, []);

  const handleBack = useCallback(() => {
    if (currentQuestion > 0 && !showResults) {
      setAnimationDirection('right');
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setAnswers(answers.slice(0, -1));
        setAnimationDirection('left');
      }, 100);
    } else {
      router.back();
    }
  }, [currentQuestion, answers, showResults, router]);

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;
  const question = QUIZ_QUESTIONS[currentQuestion];

  if (!activeProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noProfileContainer}>
          <Text style={styles.noProfileEmoji}>👤</Text>
          <Text style={styles.noProfileTitle}>No Active Profile</Text>
          <Text style={styles.noProfileText}>
            Please create a profile first to take the Love Languages quiz.
          </Text>
          <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (showResults && result) {
    const primaryName = LOVE_LANGUAGE_NAMES[result.primary];
    const primaryEmoji = LOVE_LANGUAGE_EMOJIS[result.primary];
    const primaryDesc = LOVE_LANGUAGE_DESCRIPTIONS[result.primary];
    const secondaryName = LOVE_LANGUAGE_NAMES[result.secondary];
    const secondaryEmoji = LOVE_LANGUAGE_EMOJIS[result.secondary];

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp} style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Your Love Language</Text>
            <Text style={styles.resultsProfile}>
              {activeProfile.emoji} {activeProfile.displayName || activeProfile.name}
            </Text>

            {/* Primary Love Language */}
            <View style={styles.primaryCard}>
              <Text style={styles.primaryEmoji}>{primaryEmoji}</Text>
              <Text style={styles.primaryLabel}>Your Primary Love Language</Text>
              <Text style={styles.primaryName}>{primaryName}</Text>
              <Text style={styles.primaryDesc}>{primaryDesc}</Text>
            </View>

            {/* Secondary Love Language */}
            <View style={styles.secondaryCard}>
              <Text style={styles.secondaryEmoji}>{secondaryEmoji}</Text>
              <Text style={styles.secondaryLabel}>Your Secondary Love Language</Text>
              <Text style={styles.secondaryName}>{secondaryName}</Text>
            </View>

            {/* Score Breakdown */}
            <View style={styles.scoresCard}>
              <Text style={styles.scoresTitle}>Your Scores</Text>
              {Object.entries(result.scores)
                .sort((a, b) => b[1] - a[1])
                .map(([type, score]) => (
                  <View key={type} style={styles.scoreRow}>
                    <Text style={styles.scoreEmoji}>{LOVE_LANGUAGE_EMOJIS[type as LoveLanguage]}</Text>
                    <Text style={styles.scoreName}>{LOVE_LANGUAGE_NAMES[type as LoveLanguage]}</Text>
                    <View style={styles.scoreBarContainer}>
                      <View
                        style={[
                          styles.scoreBar,
                          {
                            width: `${(score / QUIZ_QUESTIONS.length) * 200}%`,
                            backgroundColor:
                              type === result.primary
                                ? COLORS.primary
                                : type === result.secondary
                                ? COLORS.accent
                                : COLORS.border,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.scoreValue}>{score}</Text>
                  </View>
                ))}
            </View>

            {/* Partner Comparison */}
            {profiles.length > 1 && (
              <View style={styles.partnerCard}>
                <Text style={styles.partnerTitle}>Compare with Partner</Text>
                {profiles
                  .filter((p) => p.id !== activeId)
                  .map((partner) => {
                    const partnerResult = getResult(partner.id);
                    return (
                      <View key={partner.id} style={styles.partnerRow}>
                        <Text style={styles.partnerEmoji}>{partner.emoji}</Text>
                        <View style={styles.partnerInfo}>
                          <Text style={styles.partnerName}>
                            {partner.displayName || partner.name}
                          </Text>
                          {partnerResult ? (
                            <Text style={styles.partnerLoveLang}>
                              {LOVE_LANGUAGE_EMOJIS[partnerResult.result.primary]}{' '}
                              {LOVE_LANGUAGE_NAMES[partnerResult.result.primary]}
                            </Text>
                          ) : (
                            <Text style={styles.partnerNotTaken}>Not taken yet</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable style={styles.restartButton} onPress={handleRestart}>
                <RotateCcw size={20} color={COLORS.primary} />
                <Text style={styles.restartButtonText}>Retake Quiz</Text>
              </Pressable>
              <Pressable style={styles.doneButton} onPress={() => router.back()}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Love Languages</Text>
          <Text style={styles.headerProfile}>
            {activeProfile.emoji} {activeProfile.displayName || activeProfile.name}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentQuestion + 1} / {QUIZ_QUESTIONS.length}
        </Text>
      </View>

      {/* Question */}
      <ScrollView contentContainerStyle={styles.questionScroll} showsVerticalScrollIndicator={false}>
        <Animated.View
          key={currentQuestion}
          entering={animationDirection === 'right' ? FadeInRight : FadeInLeft}
          style={styles.questionContainer}
        >
          <Text style={styles.questionNumber}>Question {currentQuestion + 1}</Text>
          <Text style={styles.questionText}>Which would you prefer?</Text>

          <View style={styles.optionsContainer}>
            <Pressable
              style={styles.optionButton}
              onPress={() => handleAnswer(question.optionA.type)}
            >
              <Text style={styles.optionText}>{question.optionA.text}</Text>
            </Pressable>

            <Text style={styles.orText}>OR</Text>

            <Pressable
              style={styles.optionButton}
              onPress={() => handleAnswer(question.optionB.type)}
            >
              <Text style={styles.optionText}>{question.optionB.text}</Text>
            </Pressable>
          </View>
        </Animated.View>

        {existingResult && (
          <Pressable style={styles.viewResultsBtn} onPress={() => {
            setResultState(existingResult.result);
            setShowResults(true);
          }}>
            <Text style={styles.viewResultsText}>View Previous Results</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
  },
  headerProfile: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },

  // Question
  questionScroll: {
    flexGrow: 1,
    padding: SIZES.padding,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  questionNumber: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  questionText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  optionText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  orText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  viewResultsBtn: {
    marginTop: 32,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: SIZES.radius,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
  },
  viewResultsText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },

  // No Profile
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.paddingLarge,
  },
  noProfileEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noProfileTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: 8,
  },
  noProfileText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonLarge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: SIZES.radius,
  },
  backButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },

  // Results
  resultsScroll: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  resultsContainer: {
    alignItems: 'center',
  },
  resultsTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
    marginBottom: 4,
  },
  resultsProfile: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },

  // Primary Card
  primaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
    marginBottom: 16,
  },
  primaryEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  primaryLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  primaryName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryDesc: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Secondary Card
  secondaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  secondaryEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  secondaryLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.xs,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  secondaryName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
  },

  // Scores
  scoresCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    width: '100%',
    marginBottom: 16,
  },
  scoresTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreEmoji: {
    fontSize: 20,
    marginRight: 8,
    width: 28,
  },
  scoreName: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.text,
    width: 120,
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    width: 24,
    textAlign: 'right',
  },

  // Partner
  partnerCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding,
    width: '100%',
    marginBottom: 16,
  },
  partnerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 16,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  partnerLoveLang: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  partnerNotTaken: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  restartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  restartButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.primary,
  },
  doneButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
});
