import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  Pause,
  PlusCircle,
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
import {
  appendCustomGameCards,
  createShuffledGameDeck,
} from '../../lib/gameDeck';
import { interpolate, useTranslation } from '../../lib/i18n';
import {
  formatGameCardTimerEstimate,
  formatGameCardTimerSeconds,
  parseGameCardTimerSeconds,
} from '../../lib/gameTimer';
import {
  DEFAULT_GAME_PLAYER_NAMES,
  advanceGameTurnIndex,
  buildDrinkConsequence,
  getGameTurn,
  normalizeGamePlayerCount,
  normalizeGamePlayers,
} from '../../lib/gameSession';
import { hasPremiumFeatureAccess } from '../../lib/purchases/access';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useCustomGameCardsStore } from '../../src/stores/customGameCards';
import { COLORS, GRADIENTS, RADII, SHADOWS } from '../../constants/theme';

type GameMode = 'normal' | 'intense';
type VisibleGameScene = 'intro' | 'game';

const GAME_SCENE_TRANSITION_MS = 240;

const GAME_MODE_LEVELS: Record<GameMode, GameIntensityLevel[]> = {
  normal: [1, 2, 3],
  intense: [4, 5],
};

const GAME_PLAYER_COUNT_OPTIONS = [2, 3, 4] as const;
const PLAYER_NAME_ACCESSIBILITY_LABELS = [
  'Player 1 name',
  'Player 2 name',
  'Player 3 name',
  'Player 4 name',
] as const;

export default function GameHub() {
  const router = useRouter();
  const { t } = useTranslation();
  const localUnlocked = useSettingsStore((state) => state.unlocked);
  const unlocked = hasPremiumFeatureAccess(localUnlocked);
  const language = useSettingsStore((state) => state.language);
  const drinkingMode = useSettingsStore((state) => state.drinkingMode);
  const setDrinkingMode = useSettingsStore((state) => state.setDrinkingMode);
  const customCards = useCustomGameCardsStore((state) => state.cards);
  const [selectedMode, setSelectedMode] = useState<GameMode>('normal');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>([
    ...DEFAULT_GAME_PLAYER_NAMES,
  ]);
  const [activePlayers, setActivePlayers] = useState<string[]>(
    normalizeGamePlayers(DEFAULT_GAME_PLAYER_NAMES, 2)
  );
  const [turnIndex, setTurnIndex] = useState(0);
  const [lastDrinkConsequence, setLastDrinkConsequence] = useState<
    string | null
  >(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [visibleGameScene, setVisibleGameScene] =
    useState<VisibleGameScene>('intro');
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null);
  const [deckOrder, setDeckOrder] = useState<GameCard[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const gameTransitionProgress = useRef(new Animated.Value(0)).current;
  const lastDeckOrderIdsRef = useRef<Record<GameMode, string[]>>({
    normal: [],
    intense: [],
  });

  const cards = useMemo(
    () =>
      appendCustomGameCards(getCardsByLanguage(language, unlocked), customCards),
    [customCards, language, unlocked]
  );

  const selectedLevels = GAME_MODE_LEVELS[selectedMode];
  const selectedModeLabel = t.game.gameModes[selectedMode];
  const setupPlayers = useMemo(
    () => normalizeGamePlayers(playerNames, playerCount),
    [playerCount, playerNames]
  );
  const currentTurn = useMemo(
    () => getGameTurn(activePlayers, turnIndex),
    [activePlayers, turnIndex]
  );
  const passActionLabel = drinkingMode ? 'Pass / Drink' : t.game.skip;

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

  const introSceneStyle = useMemo(
    () => ({
      opacity: gameTransitionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      transform: [
        {
          translateY: gameTransitionProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -8],
          }),
        },
      ],
    }),
    [gameTransitionProgress]
  );

  const gameSceneStyle = useMemo(
    () => ({
      opacity: gameTransitionProgress,
      transform: [
        {
          translateY: gameTransitionProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 0],
          }),
        },
      ],
    }),
    [gameTransitionProgress]
  );

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

  const resetGameSession = useCallback(() => {
    setCurrentCard(null);
    setDeckOrder([]);
    setDeckIndex(0);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setTurnIndex(0);
    setLastDrinkConsequence(null);
  }, []);

  useEffect(() => {
    if (!hasStarted) {
      resetGameSession();
      return;
    }

    dealNewDeck();
  }, [dealNewDeck, hasStarted, resetGameSession]);

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
    if (!levelCards.length) return;

    setActivePlayers(setupPlayers);
    setTurnIndex(0);
    setLastDrinkConsequence(null);
    gameTransitionProgress.stopAnimation();
    setVisibleGameScene('game');
    setHasStarted(true);
    Animated.timing(gameTransitionProgress, {
      toValue: 1,
      duration: GAME_SCENE_TRANSITION_MS,
      useNativeDriver: true,
    }).start();
  }, [gameTransitionProgress, levelCards.length, setupPlayers]);

  const updatePlayerName = useCallback((index: number, name: string) => {
    setPlayerNames((currentNames) =>
      currentNames.map((currentName, currentIndex) =>
        currentIndex === index ? name : currentName
      )
    );
  }, []);

  const changePlayerCount = useCallback((nextCount: number) => {
    setPlayerCount(normalizeGamePlayerCount(nextCount));
  }, []);

  const advanceTurn = useCallback(
    (passed: boolean) => {
      if (passed && drinkingMode) {
        setLastDrinkConsequence(buildDrinkConsequence(currentTurn.player));
      } else {
        setLastDrinkConsequence(null);
      }

      setTurnIndex((index) =>
        advanceGameTurnIndex(index, activePlayers.length)
      );
    },
    [activePlayers.length, currentTurn.player, drinkingMode]
  );

  const drawCard = useCallback((options: { passed?: boolean } = {}) => {
    if (!hasStarted) {
      startGame();
      return;
    }

    advanceTurn(options.passed === true);

    if (deckIndex < deckOrder.length) {
      setCurrentCard(deckOrder[deckIndex]);
      setDeckIndex((index) => index + 1);
      return;
    }

    dealNewDeck(currentCard?.id);
  }, [
    advanceTurn,
    currentCard,
    dealNewDeck,
    deckIndex,
    deckOrder,
    hasStarted,
    startGame,
  ]);

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
    gameTransitionProgress.stopAnimation();
    setVisibleGameScene('intro');
    setIsTimerRunning(false);
    Animated.timing(gameTransitionProgress, {
      toValue: 0,
      duration: GAME_SCENE_TRANSITION_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setHasStarted(false);
      resetGameSession();
    });
  }, [gameTransitionProgress, resetGameSession]);

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

        <View style={styles.transitionStage}>
          <Animated.View
            pointerEvents={visibleGameScene === 'intro' ? 'auto' : 'none'}
            accessibilityElementsHidden={visibleGameScene !== 'intro'}
            importantForAccessibility={
              visibleGameScene === 'intro' ? 'auto' : 'no-hide-descendants'
            }
            style={[styles.sceneLayer, introSceneStyle]}
          >
            <View style={styles.introCard}>
              <CardAccentTop />
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.introInner}
              >
                <View style={styles.introBadgeRow}>
                  {[t.game.truth, t.game.dare, t.game.challenge].map(
                    (label) => (
                      <View key={label} style={styles.introBadge}>
                        <Text style={styles.introBadgeText}>
                          {label.toUpperCase()}
                        </Text>
                      </View>
                    )
                  )}
                </View>
                <Text style={styles.introTitle}>{t.game.introTitle}</Text>
                <Text style={styles.introBody}>
                  {interpolate(t.game.introBody, {
                    count: levelCards.length,
                    mode: selectedModeLabel,
                  })}
                </Text>

                <View style={styles.setupSection}>
                  <Text style={styles.setupLabel}>Number of Players</Text>
                  <View style={styles.playerCountRow}>
                    {GAME_PLAYER_COUNT_OPTIONS.map((count) => {
                      const active = playerCount === count;
                      return (
                        <Pressable
                          key={count}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => changePlayerCount(count)}
                          style={[
                            styles.playerCountButton,
                            active && styles.playerCountButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.playerCountText,
                              active && styles.playerCountTextActive,
                            ]}
                          >
                            {count}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.playerNameGrid}>
                    {DEFAULT_GAME_PLAYER_NAMES.slice(0, playerCount).map(
                      (defaultName, index) => (
                        <TextInput
                          key={defaultName}
                          accessibilityLabel={
                            PLAYER_NAME_ACCESSIBILITY_LABELS[index]
                          }
                          value={playerNames[index]}
                          onChangeText={(name) => updatePlayerName(index, name)}
                          placeholder={defaultName}
                          placeholderTextColor={COLORS.textMuted}
                          autoCapitalize="words"
                          autoCorrect={false}
                          returnKeyType="done"
                          style={styles.playerNameInput}
                        />
                      )
                    )}
                  </View>

                  <View style={styles.drinkingToggleRow}>
                    <View style={styles.drinkingToggleCopy}>
                      <Text style={styles.drinkingToggleTitle}>
                        Drinking game
                      </Text>
                      <Text style={styles.drinkingToggleBody}>
                        Pass means the current player takes a drink.
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel="Drinking game"
                      value={drinkingMode}
                      onValueChange={setDrinkingMode}
                      trackColor={{
                        false: 'rgba(255,255,255,0.14)',
                        true: 'rgba(255,47,146,0.55)',
                      }}
                      thumbColor={COLORS.textPrimary}
                    />
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open custom deck"
                  onPress={() => router.push('/(game)/custom-deck')}
                  style={styles.customDeckButton}
                >
                  <PlusCircle size={18} color={COLORS.pink} />
                  <Text style={styles.customDeckButtonText}>
                    Custom Deck
                  </Text>
                </Pressable>

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
              </ScrollView>
            </View>
          </Animated.View>

          <Animated.View
            pointerEvents={visibleGameScene === 'game' ? 'auto' : 'none'}
            accessibilityElementsHidden={visibleGameScene !== 'game'}
            importantForAccessibility={
              visibleGameScene === 'game' ? 'auto' : 'no-hide-descendants'
            }
            style={[styles.sceneLayer, gameSceneStyle]}
          >
            <View style={styles.gameScene}>
              <View style={styles.turnBanner}>
                <View>
                  <Text style={styles.turnEyebrow}>
                    Turn {currentTurn.turnNumber}
                  </Text>
                  <Text style={styles.turnPlayer}>{currentTurn.player}</Text>
                </View>
                <View style={styles.turnTargetGroup}>
                  <Text style={styles.turnTargetLabel}>For</Text>
                  <Text style={styles.turnTarget}>{currentTurn.target}</Text>
                </View>
                {drinkingMode ? (
                  <Text style={styles.turnDrinkMode}>Drinking game on</Text>
                ) : null}
                {lastDrinkConsequence ? (
                  <Text style={styles.drinkConsequence}>
                    {lastDrinkConsequence}
                  </Text>
                ) : null}
              </View>

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
                              timerSeconds <= 10 &&
                                styles.timerCountdownUrgent,
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
                  label={passActionLabel.toUpperCase()}
                  icon={X}
                  color={COLORS.no}
                  onPress={() => drawCard({ passed: true })}
                />
                <ActionCircle
                  label={t.game.draw.toUpperCase()}
                  icon={RefreshCw}
                  variant="gradient"
                  color={COLORS.pink}
                  size={66}
                  iconSize={28}
                  onPress={() => drawCard()}
                />
                <ActionCircle
                  label={t.game.share.toUpperCase()}
                  icon={Share2}
                  color={COLORS.maybe}
                  onPress={handleShare}
                />
              </View>
            </View>
          </Animated.View>
        </View>
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  transitionStage: {
    flex: 1,
    position: 'relative',
  },
  sceneLayer: {
    ...StyleSheet.absoluteFillObject,
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
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 14,
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
    fontSize: 16,
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
  setupSection: {
    alignSelf: 'stretch',
    gap: 10,
  },
  setupLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  playerCountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  playerCountButton: {
    minWidth: 52,
    minHeight: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  playerCountButtonActive: {
    borderColor: COLORS.pink,
    backgroundColor: 'rgba(255,47,146,0.18)',
  },
  playerCountText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
  },
  playerCountTextActive: {
    color: COLORS.textPrimary,
  },
  playerNameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerNameInput: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  drinkingToggleRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  drinkingToggleCopy: {
    flex: 1,
    gap: 3,
  },
  drinkingToggleTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  drinkingToggleBody: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  customDeckButton: {
    minHeight: 44,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,47,146,0.35)',
    backgroundColor: 'rgba(255,47,146,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  customDeckButtonText: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
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
  gameScene: {
    flex: 1,
    gap: 10,
  },
  turnBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  turnEyebrow: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '800',
  },
  turnPlayer: {
    color: COLORS.textPrimary,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
  },
  turnTargetGroup: {
    alignItems: 'flex-end',
  },
  turnTargetLabel: {
    color: COLORS.maybe,
    fontSize: 16,
    fontWeight: '800',
  },
  turnTarget: {
    color: COLORS.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  turnDrinkMode: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
  },
  drinkConsequence: {
    width: '100%',
    color: COLORS.maybe,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
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
    fontSize: 16,
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
    fontSize: 16,
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
