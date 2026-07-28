import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';

import { SafeAreaView } from '../../components/SafeAreaView';
import { BackHeader } from '../../components/app-chrome';
import { GameButton, GameSurface } from '../../components/game/GameControls';
import { KnowMeBetterSetup } from '../../components/game/KnowMeBetterSetup';
import {
  KnowMeBetterOptionPicker,
  KnowMeBetterReveal,
} from '../../components/game/KnowMeBetterRound';
import { KnowMeBetterSummary } from '../../components/game/KnowMeBetterSummary';
import { COLORS } from '../../constants/theme';
import { useTranslation, interpolate } from '../../lib/i18n';
import { useProfilesStore } from '../../lib/state/profiles';
import { useStreakStore } from '../../lib/achievements';
import {
  buildSessionQuestions,
  recordRound,
  summarizeSession,
  type RoundCount,
  type RoundResult,
} from '../../lib/knowMeBetter';
import type { KnowMeBetterQuestion } from '../../data/knowMeBetter';

type Phase =
  | 'setup'
  | 'choose_answerer'
  | 'answer'
  | 'guess'
  | 'reveal'
  | 'summary';

export default function KnowMeBetterScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();

  const { profiles, hasActiveProfile } = useProfilesStore(
    useShallow((state) => ({
      profiles: state.getProfiles(),
      hasActiveProfile: state.hasActiveProfile(),
    }))
  );

  const partnerA = profiles[0]?.name ?? t.knowMeBetter.partnerA;
  const partnerB = profiles[1]?.name ?? t.knowMeBetter.partnerB;

  const [phase, setPhase] = useState<Phase>('setup');
  const [roundCount, setRoundCount] = useState<RoundCount>(3);
  const [questions, setQuestions] = useState<KnowMeBetterQuestion[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [answerer, setAnswerer] = useState<string>(partnerA);
  const [answererOption, setAnswererOption] = useState<string | null>(null);
  const creditedMatchesRef = useRef(0);

  const currentQuestion = questions[roundIndex];
  const isLastRound = roundIndex >= questions.length - 1;

  const roundOptions = useMemo(
    () => [
      { value: 1 as RoundCount, label: t.knowMeBetter.rounds1 },
      { value: 3 as RoundCount, label: t.knowMeBetter.rounds3 },
      { value: 5 as RoundCount, label: t.knowMeBetter.rounds5 },
      { value: 10 as RoundCount, label: t.knowMeBetter.rounds10 },
    ],
    [t]
  );

  const startSession = useCallback(() => {
    const nextQuestions = buildSessionQuestions(
      roundCount,
      language === 'es' ? 'es' : 'en'
    );
    setQuestions(nextQuestions);
    setRoundIndex(0);
    setResults([]);
    setAnswerer(partnerA);
    setAnswererOption(null);
    creditedMatchesRef.current = 0;
    useStreakStore.getState().recordGamePlayed('know-me-better');
    setPhase('choose_answerer');
  }, [roundCount, language, partnerA]);

  const chooseAnswerer = useCallback((name: string) => {
    setAnswerer(name);
    setPhase('answer');
  }, []);

  const submitAnswer = useCallback((option: string) => {
    setAnswererOption(option);
    setPhase('guess');
  }, []);

  const submitGuess = useCallback(
    (guessOption: string) => {
      if (!currentQuestion || answererOption === null) return;
      const result = recordRound(currentQuestion, answererOption, guessOption);
      setResults((prev) => [...prev, result]);
      setPhase('reveal');
    },
    [currentQuestion, answererOption]
  );

  const goToNextRound = useCallback(() => {
    setRoundIndex((index) => index + 1);
    setAnswererOption(null);
    setAnswerer((current) => (current === partnerA ? partnerB : partnerA));
    setPhase('choose_answerer');
  }, [partnerA, partnerB]);

  const endSession = useCallback(() => {
    // Bank only the matches not yet credited: endSession is reachable from
    // both the reveal card and the always-visible End game button, and a
    // session can be ended more than once before starting a new one.
    const matches = results.filter((result) => result.isMatch).length;
    const uncredited = matches - creditedMatchesRef.current;
    if (uncredited > 0) {
      useStreakStore.getState().recordKnowMeBetterMatches(uncredited);
      creditedMatchesRef.current = matches;
    }
    setPhase('summary');
  }, [results]);

  const playAgain = useCallback(() => {
    creditedMatchesRef.current = 0;
    setPhase('setup');
  }, []);

  const guesser = answerer === partnerA ? partnerB : partnerA;
  const summary = useMemo(() => summarizeSession(results), [results]);
  const lastResult = results[results.length - 1];

  let body: React.ReactNode;

  if (!hasActiveProfile) {
    body = (
      <GameSurface elevated style={styles.emptyState}>
        <Text style={styles.emptyTitle}>{t.knowMeBetter.noProfileTitle}</Text>
        <Text style={styles.emptyBody}>{t.knowMeBetter.noProfileBody}</Text>
        <GameButton
          label={t.settings.manageProfiles}
          onPress={() => router.push('/(tabs)/profiles')}
          variant="secondary"
        />
      </GameSurface>
    );
  } else if (phase === 'setup') {
    body = (
      <KnowMeBetterSetup
        title={t.knowMeBetter.setupTitle}
        subtitle={t.knowMeBetter.setupSubtitle}
        roundOptions={roundOptions}
        selectedRounds={roundCount}
        onSelectRounds={setRoundCount}
        startLabel={t.knowMeBetter.startGame}
        onStart={startSession}
      />
    );
  } else if (phase === 'choose_answerer') {
    body = (
      <GameSurface elevated style={styles.chooseWrap}>
        <Text style={styles.chooseTitle}>
          {t.knowMeBetter.chooseWhoAnswers}
        </Text>
        <View style={styles.chooseActions}>
          <GameButton
            label={partnerA}
            onPress={() => chooseAnswerer(partnerA)}
            variant="secondary"
          />
          <GameButton
            label={partnerB}
            onPress={() => chooseAnswerer(partnerB)}
            variant="secondary"
          />
        </View>
      </GameSurface>
    );
  } else if (phase === 'answer' && currentQuestion) {
    body = (
      <KnowMeBetterOptionPicker
        eyebrow={interpolate(t.knowMeBetter.answeringFor, { name: answerer })}
        hint={t.knowMeBetter.passDevice}
        prompt={currentQuestion.prompt}
        options={currentQuestion.options}
        onSelect={submitAnswer}
      />
    );
  } else if (phase === 'guess' && currentQuestion) {
    body = (
      <KnowMeBetterOptionPicker
        eyebrow={interpolate(t.knowMeBetter.yourGuess, { name: guesser })}
        hint={t.knowMeBetter.passDevice}
        prompt={currentQuestion.prompt}
        options={currentQuestion.options}
        onSelect={submitGuess}
      />
    );
  } else if (phase === 'reveal' && currentQuestion && lastResult) {
    body = (
      <KnowMeBetterReveal
        prompt={currentQuestion.prompt}
        answererLabel={answerer}
        answererOption={lastResult.answererOption}
        guesserLabel={guesser}
        guesserOption={lastResult.guesserOption}
        resultTitle={
          lastResult.isMatch
            ? t.knowMeBetter.matchTitle
            : t.knowMeBetter.missTitle
        }
        resultBody={
          lastResult.isMatch
            ? t.knowMeBetter.matchBody
            : t.knowMeBetter.missBody
        }
        isMatch={lastResult.isMatch}
        nextLabel={t.knowMeBetter.nextRound}
        endLabel={t.knowMeBetter.endGame}
        onNext={goToNextRound}
        onEnd={endSession}
        isLastRound={isLastRound}
      />
    );
  } else if (phase === 'summary') {
    body = (
      <KnowMeBetterSummary
        title={t.knowMeBetter.summaryTitle}
        roundsLabel={interpolate(t.knowMeBetter.summaryRounds, {
          count: summary.roundsPlayed,
        })}
        matchesLabel={interpolate(t.knowMeBetter.summaryMatches, {
          count: summary.matches,
        })}
        closingMessage={t.knowMeBetter.summaryClosing}
        playAgainLabel={t.knowMeBetter.playAgain}
        onPlayAgain={playAgain}
      />
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader
        title={t.knowMeBetter.title}
        subtitle={t.knowMeBetter.subtitle}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {body}

        {phase !== 'setup' && phase !== 'summary' && hasActiveProfile ? (
          <GameButton
            label={t.knowMeBetter.endGame}
            onPress={endSession}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    padding: 22,
    gap: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  chooseWrap: {
    padding: 20,
    gap: 14,
  },
  chooseTitle: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  chooseActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
