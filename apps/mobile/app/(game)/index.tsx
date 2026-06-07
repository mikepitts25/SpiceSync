import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Share2,
  Timer,
  X,
} from 'lucide-react-native';

import {
  AccentBar,
  ActionCircle,
  AppHeader,
  AppTabBar,
  CardAccentTop,
  IntensityDots,
} from '../../components/app-chrome';
import { ScreenTour } from '../../components/ScreenTour';
import { type GameCard, getCardsByLanguage } from '../../data/gameCards';
import {
  filterCardsBySelectedLevels,
  type GameIntensityLevel,
} from '../../lib/gameLevelFilter';
import { createShuffledGameDeck } from '../../lib/gameDeck';
import { interpolate, useTranslation } from '../../lib/i18n';
import {
  formatGameCardTimerEstimate,
  formatGameCardTimerSeconds,
  parseGameCardTimerSeconds,
} from '../../lib/gameTimer';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { COLORS, GRADIENTS, RADII, SHADOWS } from '../../constants/theme';

type GameMode = 'normal' | 'intense';

const GAME_MODE_LEVELS: Record<GameMode, GameIntensityLevel[]> = {
  normal: [1, 2, 3],
  intense: [4, 5],
};

export default function GameHub() {
  const { t } = useTranslation();
  const unlocked = useSettingsStore((state) => state.unlocked);
  const language = useSettingsStore((state) => state.language);
  const [selectedMode, setSelectedMode] = useState<GameMode>('normal');
  const [hasStarted, setHasStarted] = useState(false);
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null);
  const [deckOrder, setDeckOrder] = useState<GameCard[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const lastDeckOrderIdsRef = useRef<Record<GameMode, string[]>>({
    normal: [],
    intense: [],
  });

  const cards = useMemo(
    () => getCardsByLanguage(language, unlocked),
    [language, unlocked]
  );

  const selectedLevels = GAME_MODE_LEVELS[selectedMode];
  const selectedModeLabel = t.game.gameModes[selectedMode];

  const levelCards = useMemo(
    () => filterCardsBySelectedLevels(cards, selectedLevels),
    [cards, selectedLevels]
  );

  const totalTimerSeconds = useMemo(
    () => parseGameCardTimerSeconds(currentCard?.estimatedTime ?? ''),
    [currentCard]
  );

  const timerProgress =
    totalTimerSeconds > 0 ? timerSeconds / totalTimerSeconds : 1;

  const timerEstimateText =
    totalTimerSeconds > 0
      ? formatGameCardTimerEstimate(totalTimerSeconds)
      : t.game.noTimeLimit;

  const dealNewDeck = useCallback(
    (avoidFirstCardId?: string | null) => {
      const nextDeck = createShuffledGameDeck(levelCards, {
        previousOrderIds: lastDeckOrderIdsRef.current[selectedMode],
        avoidFirstCardId,
      });

      lastDeckOrderIdsRef.current[selectedMode] = nextDeck.map(
        (card) => card.id
      );
      setDeckOrder(nextDeck);
      setDeckIndex(nextDeck.length > 0 ? 1 : 0);
      setCurrentCard(nextDeck[0] ?? null);
    },
    [levelCards, selectedMode]
  );

  useEffect(() => {
    if (!hasStarted) {
      setCurrentCard(null);
      setDeckOrder([]);
      setDeckIndex(0);
      return;
    }

    dealNewDeck();
  }, [dealNewDeck, hasStarted]);

  useEffect(() => {
    setTimerSeconds(totalTimerSeconds);
    setIsTimerRunning(false);
  }, [totalTimerSeconds]);

  useEffect(() => {
    if (!isTimerRunning || timerSeconds <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTimerSeconds((seconds) => {
        if (seconds <= 1) {
          setIsTimerRunning(false);
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const startGame = useCallback(() => {
    setHasStarted(true);
  }, []);

  const drawCard = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
      return;
    }

    if (deckIndex < deckOrder.length) {
      setCurrentCard(deckOrder[deckIndex]);
      setDeckIndex((index) => index + 1);
      return;
    }

    dealNewDeck(currentCard?.id);
  }, [currentCard, dealNewDeck, deckIndex, deckOrder, hasStarted]);

  const startTimer = useCallback(() => {
    if (totalTimerSeconds <= 0 || timerSeconds <= 0) return;
    setIsTimerRunning(true);
  }, [timerSeconds, totalTimerSeconds]);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimerSeconds(totalTimerSeconds);
  }, [totalTimerSeconds]);

  const endGame = useCallback(() => {
    setHasStarted(false);
    setCurrentCard(null);
    setDeckOrder([]);
    setDeckIndex(0);
    setTimerSeconds(0);
    setIsTimerRunning(false);
  }, []);

  const changeGameMode = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
  }, []);

  const handleShare = useCallback(async () => {
    if (!currentCard) return;
    try {
      await Share.share({
        message: interpolate(t.game.shareMessage, {
          content: currentCard.content,
        }),
      });
    } catch {
      // Native share cancellation does not need UI.
    }
  }, [currentCard, t.game.shareMessage]);

  const typeLabel = currentCard?.type
    ? t.game[currentCard.type].toUpperCase()
    : t.game.fallbackType.toUpperCase();

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <View style={styles.content}>
        <ScreenTour
          screenId="game"
          screenLabel={t.tabs.game}
          steps={t.tours.game}
        />

        <View style={styles.headingRow}>
          <Text style={styles.heading}>{t.game.gameNight.toUpperCase()}</Text>
          {hasStarted ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.game.endGame}
              onPress={endGame}
              style={styles.endGameButton}
            >
              <Text style={styles.endGameText}>{t.game.endGame}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.modeGroup}>
          <View style={styles.levelRow}>
            {(['normal', 'intense'] as const).map((mode) => {
              const active = selectedMode === mode;
              const label = t.game.gameModes[mode];
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => changeGameMode(mode)}
                  style={styles.levelPress}
                >
                  {active ? (
                    <LinearGradient
                      colors={GRADIENTS.primary}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.levelActive}
                    >
                      <Text style={styles.levelActiveText}>{label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.levelInactive}>
                      <Text style={styles.levelInactiveText}>{label}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          {selectedMode === 'intense' ? (
            <Text style={styles.intenseDisclaimer}>
              {t.game.intenseDisclaimer}
            </Text>
          ) : null}
        </View>

        {!hasStarted ? (
          <View style={styles.introCard}>
            <CardAccentTop />
            <View style={styles.introInner}>
              <View style={styles.introBadgeRow}>
                {[t.game.truth, t.game.dare, t.game.challenge].map((label) => (
                  <View key={label} style={styles.introBadge}>
                    <Text style={styles.introBadgeText}>
                      {label.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.introTitle}>{t.game.introTitle}</Text>
              <Text style={styles.introBody}>
                {interpolate(t.game.introBody, {
                  count: levelCards.length,
                  mode: selectedModeLabel,
                })}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.game.startPlaying}
                disabled={!levelCards.length}
                onPress={startGame}
                style={styles.startPress}
              >
                <LinearGradient
                  colors={
                    levelCards.length ? GRADIENTS.primary : GRADIENTS.card
                  }
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.startButton}
                >
                  <Play size={22} color={COLORS.textPrimary} fill="white" />
                  <Text style={styles.startButtonText}>
                    {t.game.startPlaying}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.gameCard}>
              <CardAccentTop />
              <View style={styles.cardInner}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.categoryLabel}>{typeLabel}</Text>
                  <IntensityDots
                    value={
                      currentCard?.intensity ??
                      selectedLevels[selectedLevels.length - 1]
                    }
                    max={5}
                  />
                </View>
                <View style={styles.cardMainContent}>
                  <AccentBar />

                  <Text style={styles.cardTitle}>
                    {currentCard
                      ? titleForCard(currentCard, t.game.titles)
                      : t.game.noCardsForLevels}
                  </Text>
                  <Text style={styles.cardBody}>
                    {currentCard?.content ?? t.game.chooseDifferentLevels}
                  </Text>

                  <View style={styles.timerBadge}>
                    <Timer size={14} color={COLORS.maybe} />
                    <Text style={styles.timerText}>{timerEstimateText}</Text>
                  </View>
                </View>

                {totalTimerSeconds > 0 ? (
                  <View style={styles.timerPanel}>
                    <View style={styles.timerProgressTrack}>
                      <View
                        style={[
                          styles.timerProgressFill,
                          {
                            width: `${timerProgress * 100}%`,
                            backgroundColor:
                              timerSeconds <= 10 ? COLORS.no : COLORS.pink,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.timerPanelRow}>
                      <View>
                        <Text
                          style={[
                            styles.timerCountdown,
                            timerSeconds <= 10 && styles.timerCountdownUrgent,
                          ]}
                        >
                          {formatGameCardTimerSeconds(timerSeconds)}
                        </Text>
                        <Text style={styles.timerStatus}>
                          {timerSeconds === 0
                            ? t.game.timesUp
                            : timerEstimateText}
                        </Text>
                      </View>
                      <View style={styles.timerButtonRow}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            isTimerRunning
                              ? t.game.pauseTimer
                              : t.game.startTimer
                          }
                          onPress={isTimerRunning ? pauseTimer : startTimer}
                          style={styles.timerControlButton}
                        >
                          {isTimerRunning ? (
                            <Pause size={16} color={COLORS.textPrimary} />
                          ) : (
                            <Play size={16} color={COLORS.textPrimary} />
                          )}
                          <Text style={styles.timerControlText}>
                            {isTimerRunning
                              ? t.game.pauseTimer
                              : t.game.startTimer}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t.game.resetTimer}
                          onPress={resetTimer}
                          style={styles.timerIconButton}
                        >
                          <RotateCcw size={17} color={COLORS.textPrimary} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.actionRow}>
              <ActionCircle
                label={t.game.skip.toUpperCase()}
                icon={X}
                color={COLORS.no}
                onPress={drawCard}
              />
              <ActionCircle
                label={t.game.draw.toUpperCase()}
                icon={RefreshCw}
                variant="gradient"
                color={COLORS.pink}
                size={66}
                iconSize={28}
                onPress={drawCard}
              />
              <ActionCircle
                label={t.game.share.toUpperCase()}
                icon={Share2}
                color={COLORS.maybe}
                onPress={handleShare}
              />
            </View>
          </>
        )}
      </View>

      <AppTabBar active="game" />
    </SafeAreaView>
  );
}

function titleForCard(
  card: GameCard,
  titles: ReturnType<typeof useTranslation>['t']['game']['titles']
) {
  switch (card.type) {
    case 'truth':
      return titles.truth;
    case 'dare':
      return titles.dare;
    case 'challenge':
      return titles.challenge;
    case 'fantasy':
      return titles.fantasy;
    case 'roleplay':
      return titles.roleplay;
    default:
      return titles.fallback;
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  endGameButton: {
    position: 'absolute',
    right: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  endGameText: {
    color: COLORS.textSub,
    fontSize: 15,
    fontWeight: '800',
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  modeGroup: {
    alignItems: 'center',
    gap: 7,
  },
  levelPress: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  levelActive: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  levelActiveText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  levelInactive: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  levelInactiveText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  intenseDisclaimer: {
    color: COLORS.maybe,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  introCard: {
    flex: 1,
    borderRadius: RADII.card,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  introInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 18,
  },
  introBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  introBadge: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  introBadgeText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  introTitle: {
    color: COLORS.textPrimary,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
    textAlign: 'center',
  },
  introBody: {
    color: COLORS.textSub,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  startPress: {
    alignSelf: 'stretch',
    borderRadius: RADII.pill,
    overflow: 'hidden',
    marginTop: 4,
  },
  startButton: {
    minHeight: 58,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  startButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  gameCard: {
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
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  categoryLabel: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  cardMainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardBody: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  timerBadge: {
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  timerPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: COLORS.cardAlt,
    padding: 12,
    gap: 12,
  },
  timerProgressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  timerPanelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  timerCountdown: {
    color: COLORS.textPrimary,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  timerCountdownUrgent: {
    color: COLORS.no,
  },
  timerStatus: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  timerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerControlButton: {
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.pink,
  },
  timerControlText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  timerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
});
