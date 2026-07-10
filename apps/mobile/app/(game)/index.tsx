import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { AppHeader, AppTabBar } from '../../components/app-chrome';
import {
  GameSetupPanel,
  type GameSetupMode as GameMode,
} from '../../components/game/GameSetupPanel';
import {
  GamePlayerMatchup,
  GameSessionHeader,
} from '../../components/game/GameSessionChrome';
import { GameRoundPanel } from '../../components/game/GameRoundPanel';
import { ScreenTour } from '../../components/ScreenTour';
import {
  type GameCard,
  type GameCardType,
  getCardsByLanguage,
} from '../../data/gameCards';
import {
  getGameCardDisplayContent,
  type GameCardDisplayLanguage,
} from '../../data/gameCardTranslations';
import {
  filterCardsBySelectedLevels,
  type GameIntensityLevel,
} from '../../lib/gameLevelFilter';
import {
  createShuffledGameDeck,
  selectGameCardsForCustomMode,
  type GameCustomDeckMode,
} from '../../lib/gameDeck';
import { interpolate, useTranslation } from '../../lib/i18n';
import {
  formatGameCardTimerEstimate,
  parseGameCardTimerSeconds,
} from '../../lib/gameTimer';
import {
  DEFAULT_GAME_PLAYER_NAMES,
  type GameConsequence,
  type GameTurn,
  getGameTurn,
  normalizeGamePlayerCount,
  normalizeGamePlayers,
  resolveGameRoundOutcome,
} from '../../lib/gameSession';
import {
  clearPersistedGameSession,
  createPersistedGameSession,
  loadPersistedGameSession,
  savePersistedGameSession,
} from '../../lib/gameSessionPersistence';
import { playGameSound, unloadGameSounds } from '../../lib/gameSounds';
import { hasPremiumFeatureAccess } from '../../lib/purchases/access';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useCustomGameCardsStore } from '../../src/stores/customGameCards';
import { COLORS, SHADOWS } from '../../constants/theme';

type VisibleGameScene = 'intro' | 'game';
type GameRoundPhase = 'ready' | 'spinning' | 'revealed';

const GAME_SCENE_TRANSITION_MS = 240;
const GAME_ROULETTE_DURATION_MS = 1200;
const GAME_ROULETTE_TICK_MS = 85;

const GAME_MODE_LEVELS: Record<GameMode, GameIntensityLevel[]> = {
  normal: [1, 2, 3],
  intense: [4, 5],
};

type CardLanguageCopy = {
  gameNight: string;
  gameModes: Record<GameMode, string>;
  endGame: string;
  endGameConfirmTitle: string;
  endGameConfirmBody: string;
  cancel: string;
  playerUp: string;
  drinking: string;
  playerOf: (turnNumber: number, playerCount: number) => string;
  target: string;
  readyPrompt: (player: string) => string;
  spinningPrompt: (player: string) => string;
  revealedPrompt: (player: string) => string;
  mysteryCard: string;
  tapDraw: string;
  hiddenCardBody: string;
  rouletteSpinning: string;
  level: (intensity: GameCard['intensity']) => string;
  done: string;
  passRisk: string;
  consequence: string;
  acknowledgeConsequence: string;
  ok: string;
  noCardsForLevels: string;
  chooseDifferentLevels: string;
  noTimeLimit: string;
  timesUp: string;
  startTimer: string;
  pauseTimer: string;
  resetTimer: string;
  titles: Record<GameCardType | 'fallback', string>;
};

const CARD_LANGUAGE_COPY: Record<GameCardDisplayLanguage, CardLanguageCopy> = {
  en: {
    gameNight: 'Game Night',
    gameModes: {
      normal: 'Normal',
      intense: 'Intense',
    },
    endGame: 'End Game',
    endGameConfirmTitle: 'End game?',
    endGameConfirmBody: 'This clears the current game session.',
    cancel: 'Cancel',
    playerUp: 'Player up',
    drinking: 'Drinking',
    playerOf: (turnNumber, playerCount) =>
      `Player ${turnNumber} of ${playerCount}`,
    target: 'Target',
    readyPrompt: (player) => `${player}, tap the card to spin.`,
    spinningPrompt: (player) => `${player}, the deck is choosing...`,
    revealedPrompt: (player) => `${player}, resolve this card.`,
    mysteryCard: 'Mystery card',
    tapDraw: 'Tap to Spin',
    hiddenCardBody: 'The next card stays hidden until the roulette lands.',
    rouletteSpinning: 'Roulette is spinning',
    level: (intensity) => `Level ${intensity}`,
    done: 'Done',
    passRisk: 'Pass / Risk',
    consequence: 'Consequence',
    acknowledgeConsequence: 'Acknowledge consequence',
    ok: 'OK',
    noCardsForLevels: 'No cards for these levels',
    chooseDifferentLevels:
      'Choose a different level combination to keep playing.',
    noTimeLimit: 'No time limit',
    timesUp: "Time's Up!",
    startTimer: 'Start',
    pauseTimer: 'Pause',
    resetTimer: 'Reset',
    titles: {
      truth: 'Truth Seeker',
      dare: 'Dare Drop',
      challenge: 'Challenge Round',
      fantasy: 'Fantasy Spark',
      roleplay: 'Role Play',
      fallback: 'Game Card',
    },
  },
  es: {
    gameNight: 'Noche de juego',
    gameModes: {
      normal: 'Normal',
      intense: 'Intenso',
    },
    endGame: 'Terminar juego',
    endGameConfirmTitle: '¿Terminar juego?',
    endGameConfirmBody: 'Esto borra la partida actual.',
    cancel: 'Cancelar',
    playerUp: 'Jugador activo',
    drinking: 'Bebiendo',
    playerOf: (turnNumber, playerCount) =>
      `Jugador ${turnNumber} de ${playerCount}`,
    target: 'Objetivo',
    readyPrompt: (player) => `${player}, toca la carta para girar.`,
    spinningPrompt: (player) => `${player}, el mazo está eligiendo...`,
    revealedPrompt: (player) => `${player}, resuelve esta carta.`,
    mysteryCard: 'Carta misteriosa',
    tapDraw: 'Toca para girar',
    hiddenCardBody:
      'La próxima carta se mantiene oculta hasta que termine la ruleta.',
    rouletteSpinning: 'La ruleta gira',
    level: (intensity) => `Nivel ${intensity}`,
    done: 'Listo',
    passRisk: 'Pasar / Riesgo',
    consequence: 'Consecuencia',
    acknowledgeConsequence: 'Aceptar consecuencia',
    ok: 'Aceptar',
    noCardsForLevels: 'No hay cartas para estos niveles',
    chooseDifferentLevels:
      'Elige otra combinación de niveles para seguir jugando.',
    noTimeLimit: 'Sin límite de tiempo',
    timesUp: '¡Se acabó el tiempo!',
    startTimer: 'Iniciar',
    pauseTimer: 'Pausar',
    resetTimer: 'Reiniciar',
    titles: {
      truth: 'Buscador de verdad',
      dare: 'Reto sorpresa',
      challenge: 'Ronda de desafío',
      fantasy: 'Chispa de fantasía',
      roleplay: 'Juego de roles',
      fallback: 'Carta de juego',
    },
  },
};

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
  const [cardLanguage, setCardLanguage] = useState<GameCardDisplayLanguage>(
    language === 'es' ? 'es' : 'en'
  );
  const [customDeckMode, setCustomDeckMode] =
    useState<GameCustomDeckMode>('include');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>([
    ...DEFAULT_GAME_PLAYER_NAMES,
  ]);
  const [activePlayers, setActivePlayers] = useState<string[]>(
    normalizeGamePlayers(DEFAULT_GAME_PLAYER_NAMES, 2)
  );
  const [turnIndex, setTurnIndex] = useState(0);
  const [lastConsequence, setLastConsequence] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [visibleGameScene, setVisibleGameScene] =
    useState<VisibleGameScene>('intro');
  const [roundPhase, setRoundPhase] = useState<GameRoundPhase>('ready');
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null);
  const [deckOrder, setDeckOrder] = useState<GameCard[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [lastDrawnCardId, setLastDrawnCardId] = useState<string | null>(null);
  const [roulettePreviewIndex, setRoulettePreviewIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const gameTransitionProgress = useRef(new Animated.Value(0)).current;
  const rouletteSpinProgress = useRef(new Animated.Value(0)).current;
  const rouletteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastDeckOrderIdsRef = useRef<Record<GameMode, string[]>>({
    normal: [],
    intense: [],
  });
  const hasLoadedPersistedSessionRef = useRef(false);
  const skipNextTimerResetRef = useRef(false);

  const baseCards = useMemo(
    () => getCardsByLanguage('en', unlocked),
    [unlocked]
  );
  const cards = useMemo(
    () => selectGameCardsForCustomMode(baseCards, customCards, customDeckMode),
    [baseCards, customCards, customDeckMode]
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
  const cardCopy = CARD_LANGUAGE_COPY[cardLanguage];
  const selectedCardModeLabel = cardCopy.gameModes[selectedMode];

  const levelCards = useMemo(
    () => filterCardsBySelectedLevels(cards, selectedLevels),
    [cards, selectedLevels]
  );

  const totalTimerSeconds = useMemo(
    () => parseGameCardTimerSeconds(currentCard?.estimatedTime ?? ''),
    [currentCard]
  );

  const timerEstimateText =
    totalTimerSeconds > 0
      ? formatCardLanguageTimerEstimate(totalTimerSeconds, cardLanguage)
      : cardCopy.noTimeLimit;
  const displayedCardContent = currentCard
    ? getGameCardDisplayContent(currentCard, cardLanguage)
    : cardCopy.chooseDifferentLevels;
  const isCardRevealed = roundPhase === 'revealed' && currentCard !== null;
  const roulettePreviewCard =
    levelCards.length > 0
      ? levelCards[roulettePreviewIndex % levelCards.length]
      : null;
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

  const rouletteCardStyle = useMemo(
    () => ({
      opacity: rouletteSpinProgress.interpolate({
        inputRange: [0, 0.2, 0.82, 1],
        outputRange: [0.68, 1, 1, 0.88],
      }),
      transform: [
        {
          scale: rouletteSpinProgress.interpolate({
            inputRange: [0, 0.7, 1],
            outputRange: [0.96, 1.04, 1],
          }),
        },
        {
          rotate: rouletteSpinProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ['-2deg', '2deg'],
          }),
        },
      ],
    }),
    [rouletteSpinProgress]
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
      setDeckIndex(0);
      setCurrentCard(null);

      return nextDeck;
    },
    [levelCards, selectedMode]
  );

  const clearRouletteInterval = useCallback(() => {
    if (rouletteIntervalRef.current) {
      clearInterval(rouletteIntervalRef.current);
      rouletteIntervalRef.current = null;
    }
  }, []);

  const moveToReadyForTurn = useCallback((nextTurnIndex: number) => {
    setTurnIndex(nextTurnIndex);
    setCurrentCard(null);
    setRoundPhase('ready');
    setTimerSeconds(0);
    setIsTimerRunning(false);
  }, []);

  const revealNextCard = useCallback(() => {
    let nextCard = deckOrder[deckIndex] ?? null;
    let nextDeckIndex = deckIndex + 1;

    if (!nextCard) {
      const nextDeck = dealNewDeck(lastDrawnCardId);
      nextCard = nextDeck[0] ?? null;
      nextDeckIndex = nextCard ? 1 : 0;
    }

    setCurrentCard(nextCard);
    setDeckIndex(nextDeckIndex);
    setLastDrawnCardId(nextCard?.id ?? lastDrawnCardId);
    setRoundPhase(nextCard ? 'revealed' : 'ready');
    if (nextCard) {
      playGameSound('cardFlip');
    }
  }, [dealNewDeck, deckIndex, deckOrder, lastDrawnCardId]);

  const resetGameSession = useCallback(() => {
    clearRouletteInterval();
    rouletteSpinProgress.stopAnimation();
    rouletteSpinProgress.setValue(0);
    setCurrentCard(null);
    setDeckOrder([]);
    setDeckIndex(0);
    setLastDrawnCardId(null);
    setRoulettePreviewIndex(0);
    setRoundPhase('ready');
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setTurnIndex(0);
    setLastConsequence(null);
  }, [clearRouletteInterval, rouletteSpinProgress]);

  useEffect(() => {
    return () => {
      clearRouletteInterval();
      rouletteSpinProgress.stopAnimation();
      unloadGameSounds().catch(() => {
        // Releasing audio is best-effort on unmount.
      });
    };
  }, [clearRouletteInterval, rouletteSpinProgress]);

  useEffect(() => {
    let cancelled = false;

    loadPersistedGameSession()
      .then((session) => {
        if (cancelled || !session) return;

        setSelectedMode(session.selectedMode);
        setCustomDeckMode(session.customDeckMode);
        setPlayerCount(session.playerCount);
        setPlayerNames(session.playerNames);
        setActivePlayers(session.activePlayers);
        setTurnIndex(session.turnIndex);
        setLastConsequence(session.lastConsequence);
        setDeckOrder(session.deckOrder);
        setDeckIndex(session.deckIndex);
        skipNextTimerResetRef.current = session.currentCard !== null;
        setCurrentCard(session.currentCard);
        setLastDrawnCardId(session.currentCard?.id ?? null);
        setRoundPhase(session.currentCard ? 'revealed' : 'ready');
        rouletteSpinProgress.setValue(0);
        setTimerSeconds(session.timerSeconds);
        setIsTimerRunning(session.isTimerRunning);
        setDrinkingMode(session.drinkingMode);
        setVisibleGameScene('game');
        setHasStarted(true);
        gameTransitionProgress.setValue(1);
      })
      .finally(() => {
        if (!cancelled) {
          hasLoadedPersistedSessionRef.current = true;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gameTransitionProgress, rouletteSpinProgress, setDrinkingMode]);

  useEffect(() => {
    if (!hasLoadedPersistedSessionRef.current || !hasStarted) return;

    const session = createPersistedGameSession({
      selectedMode,
      customDeckMode,
      playerCount,
      playerNames,
      activePlayers,
      turnIndex,
      lastConsequence,
      deckOrder,
      deckIndex,
      currentCard,
      timerSeconds,
      isTimerRunning,
      drinkingMode,
    });

    savePersistedGameSession(session).catch(() => {
      // Active game state can continue if local persistence is unavailable.
    });
  }, [
    activePlayers,
    currentCard,
    customDeckMode,
    deckIndex,
    deckOrder,
    drinkingMode,
    hasStarted,
    isTimerRunning,
    lastConsequence,
    playerCount,
    playerNames,
    selectedMode,
    timerSeconds,
    turnIndex,
  ]);

  useEffect(() => {
    if (!hasStarted) {
      setCardLanguage(language === 'es' ? 'es' : 'en');
    }
  }, [hasStarted, language]);

  useEffect(() => {
    if (
      !hasStarted &&
      customDeckMode === 'customOnly' &&
      customCards.length === 0
    ) {
      setCustomDeckMode('include');
    }
  }, [customCards.length, customDeckMode, hasStarted]);

  useEffect(() => {
    if (skipNextTimerResetRef.current) {
      skipNextTimerResetRef.current = false;
      return;
    }

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
          playGameSound('timerEnd');
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
    setLastConsequence(null);
    setLastDrawnCardId(null);
    setRoundPhase('ready');
    setTimerSeconds(0);
    setIsTimerRunning(false);
    rouletteSpinProgress.setValue(0);
    dealNewDeck();
    gameTransitionProgress.stopAnimation();
    setVisibleGameScene('game');
    setHasStarted(true);
    Animated.timing(gameTransitionProgress, {
      toValue: 1,
      duration: GAME_SCENE_TRANSITION_MS,
      useNativeDriver: true,
    }).start();
  }, [
    dealNewDeck,
    gameTransitionProgress,
    levelCards.length,
    rouletteSpinProgress,
    setupPlayers,
  ]);

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

  const startRouletteDraw = useCallback(() => {
    if (!hasStarted) {
      startGame();
      return;
    }

    if (roundPhase !== 'ready' || levelCards.length === 0) return;

    clearRouletteInterval();
    setCurrentCard(null);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setRoundPhase('spinning');
    playGameSound('rouletteSpin');
    rouletteSpinProgress.setValue(0);
    setRoulettePreviewIndex((index) => (index + 1) % levelCards.length);

    rouletteIntervalRef.current = setInterval(() => {
      setRoulettePreviewIndex((index) => (index + 1) % levelCards.length);
    }, GAME_ROULETTE_TICK_MS);

    Animated.timing(rouletteSpinProgress, {
      toValue: 1,
      duration: GAME_ROULETTE_DURATION_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      clearRouletteInterval();
      rouletteSpinProgress.setValue(0);

      if (finished) {
        revealNextCard();
      } else {
        setRoundPhase('ready');
      }
    });
  }, [
    clearRouletteInterval,
    hasStarted,
    levelCards.length,
    revealNextCard,
    rouletteSpinProgress,
    roundPhase,
    startGame,
  ]);

  const finishRevealedCard = useCallback(
    (passed: boolean) => {
      if (!isCardRevealed) return;

      setIsTimerRunning(false);
      playGameSound(passed ? 'success' : 'consequence');

      const outcome = resolveGameRoundOutcome({
        turnIndex,
        playerCount: activePlayers.length,
        turn: currentTurn,
        passed,
        drinkingMode,
      });

      if (outcome.requiresAcknowledgement && outcome.consequence) {
        setLastConsequence(
          formatGameConsequenceText(
            outcome.consequence,
            currentTurn,
            cardLanguage
          )
        );
        return;
      }

      setLastConsequence(null);
      moveToReadyForTurn(outcome.nextTurnIndex);
    },
    [
      activePlayers.length,
      cardLanguage,
      currentTurn,
      drinkingMode,
      isCardRevealed,
      moveToReadyForTurn,
      turnIndex,
    ]
  );

  const acknowledgeConsequence = useCallback(() => {
    const outcome = resolveGameRoundOutcome({
      turnIndex,
      playerCount: activePlayers.length,
      turn: currentTurn,
      passed: false,
      drinkingMode,
    });

    setLastConsequence(null);
    moveToReadyForTurn(outcome.nextTurnIndex);
  }, [
    activePlayers.length,
    currentTurn,
    drinkingMode,
    moveToReadyForTurn,
    turnIndex,
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

  const finishEndGame = useCallback(() => {
    clearPersistedGameSession().catch(() => {
      // Ending the session should still return to setup if storage fails.
    });
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

  const confirmEndGame = useCallback(() => {
    Alert.alert(cardCopy.endGameConfirmTitle, cardCopy.endGameConfirmBody, [
      { text: cardCopy.cancel, style: 'cancel' },
      {
        text: cardCopy.endGame,
        style: 'destructive',
        onPress: finishEndGame,
      },
    ]);
  }, [cardCopy, finishEndGame]);

  const changeGameMode = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
  }, []);

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

        {hasStarted ? (
          <GameSessionHeader
            gameNightLabel={cardCopy.gameNight.toUpperCase()}
            modeLabel={selectedCardModeLabel}
            drinkingLabel={drinkingMode ? cardCopy.drinking : undefined}
            endGameLabel={cardCopy.endGame}
            onEndGame={confirmEndGame}
          />
        ) : null}

        <View style={styles.transitionStage}>
          <Animated.View
            pointerEvents={visibleGameScene === 'intro' ? 'auto' : 'none'}
            accessibilityElementsHidden={visibleGameScene !== 'intro'}
            importantForAccessibility={
              visibleGameScene === 'intro' ? 'auto' : 'no-hide-descendants'
            }
            style={[styles.sceneLayer, introSceneStyle]}
          >
            <GameSetupPanel
              gameNightLabel={t.game.gameNight.toUpperCase()}
              introTitle={t.game.introTitle}
              introBody={interpolate(t.game.introBody, {
                count: levelCards.length,
                mode: selectedModeLabel,
              })}
              badgeLabels={[t.game.truth, t.game.dare, t.game.challenge].map(
                (label) => label.toUpperCase()
              )}
              mode={selectedMode}
              modeOptions={(['normal', 'intense'] as const).map((value) => ({
                value,
                label: t.game.gameModes[value],
              }))}
              onModeChange={changeGameMode}
              intenseDisclaimer={
                selectedMode === 'intense'
                  ? t.game.intenseDisclaimer
                  : undefined
              }
              playerCount={playerCount}
              playerNames={playerNames}
              onPlayerCountChange={changePlayerCount}
              onPlayerNameChange={updatePlayerName}
              drinkingMode={drinkingMode}
              onDrinkingModeChange={setDrinkingMode}
              cardLanguage={cardLanguage}
              onCardLanguageChange={setCardLanguage}
              customCardsAvailable={customCards.length > 0}
              customDeckMode={customDeckMode}
              onCustomDeckModeChange={setCustomDeckMode}
              onOpenCustomDeck={() => router.push('/(game)/custom-deck')}
              startLabel={t.game.startPlaying}
              onStart={startGame}
              startDisabled={levelCards.length === 0}
            />
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
              <GamePlayerMatchup
                playerLabel={cardCopy.playerUp.toUpperCase()}
                playerName={currentTurn.player}
                targetLabel={cardCopy.target.toUpperCase()}
                targetName={currentTurn.target}
              />
              <GameRoundPanel
                phase={roundPhase}
                language={cardLanguage}
                onLanguageChange={setCardLanguage}
                drawDisabled={levelCards.length === 0}
                onDraw={startRouletteDraw}
                mysteryLabel={cardCopy.mysteryCard}
                drawLabel={cardCopy.tapDraw}
                hiddenBody={cardCopy.hiddenCardBody}
                spinningLabel={cardCopy.rouletteSpinning}
                spinningTitle={
                  roulettePreviewCard
                    ? titleForCard(roulettePreviewCard, cardCopy.titles)
                    : cardCopy.tapDraw
                }
                spinningMeta={
                  roulettePreviewCard
                    ? cardCopy.level(roulettePreviewCard.intensity)
                    : selectedCardModeLabel
                }
                revealedTitle={
                  currentCard
                    ? titleForCard(currentCard, cardCopy.titles)
                    : cardCopy.noCardsForLevels
                }
                revealedBody={displayedCardContent}
                timerEstimate={timerEstimateText}
                timer={
                  isCardRevealed && totalTimerSeconds > 0
                    ? {
                        totalSeconds: totalTimerSeconds,
                        remainingSeconds: timerSeconds,
                        running: isTimerRunning,
                        timesUpLabel: cardCopy.timesUp,
                        startLabel: cardCopy.startTimer,
                        pauseLabel: cardCopy.pauseTimer,
                        resetLabel: cardCopy.resetTimer,
                        onStart: startTimer,
                        onPause: pauseTimer,
                        onReset: resetTimer,
                      }
                    : undefined
                }
                rouletteStyle={rouletteCardStyle}
                passRiskLabel={cardCopy.passRisk.toUpperCase()}
                doneLabel={cardCopy.done.toUpperCase()}
                onPassRisk={() => finishRevealedCard(true)}
                onDone={() => finishRevealedCard(false)}
              />
            </View>
          </Animated.View>
        </View>
      </View>

      <Modal
        visible={lastConsequence !== null}
        transparent
        animationType="fade"
        onRequestClose={acknowledgeConsequence}
      >
        <View style={styles.consequenceModalBackdrop}>
          <View style={styles.consequenceModalCard}>
            <Text style={styles.consequenceEyebrow}>
              {cardCopy.consequence}
            </Text>
            <Text style={styles.consequenceTitle}>{cardCopy.passRisk}</Text>
            <Text style={styles.consequenceBody}>{lastConsequence}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cardCopy.acknowledgeConsequence}
              onPress={acknowledgeConsequence}
              style={styles.consequenceButton}
            >
              <Text style={styles.consequenceButtonText}>{cardCopy.ok}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AppTabBar active="game" />
    </SafeAreaView>
  );
}

function titleForCard(
  card: GameCard,
  titles: Record<GameCardType | 'fallback', string>
) {
  return titles[card.type] ?? titles.fallback;
}

function formatCardLanguageTimerEstimate(
  totalSeconds: number,
  language: GameCardDisplayLanguage
) {
  if (language !== 'es') {
    return formatGameCardTimerEstimate(totalSeconds);
  }

  if (totalSeconds < 60) {
    return `${totalSeconds} seg`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds} seg`;
}

function formatGameConsequenceText(
  consequence: GameConsequence,
  turn: GameTurn,
  language: GameCardDisplayLanguage
) {
  if (language !== 'es') {
    return consequence.text;
  }

  switch (consequence.id) {
    case 'no-passes':
      return `${turn.player} no puede pasar durante los próximos 2 turnos.`;
    case 'clothing':
      return `${turn.player} se quita una prenda.`;
    case 'embarrassing-truth':
      return `${turn.player} le cuenta a ${turn.target} un secreto vergonzoso.`;
    case 'pet-role':
      return `${turn.player} es la mascota de ${turn.target} durante los próximos 5 minutos.`;
    case 'target-command':
      return `${turn.target} le da a ${turn.player} una orden inofensiva.`;
    case 'drink':
      return `${turn.player} toma un trago.`;
    case 'target-picks-drink':
      return `${turn.target} elige un trago para ${turn.player}.`;
    case 'shot':
      return `${turn.player} toma un shot.`;
    default:
      return consequence.text;
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
    gap: 9,
  },
  transitionStage: {
    flex: 1,
    position: 'relative',
  },
  sceneLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gameScene: {
    flex: 1,
    gap: 8,
  },
  consequenceModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,5,10,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  consequenceModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,176,0,0.34)',
    backgroundColor: COLORS.card,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.card,
  },
  consequenceEyebrow: {
    color: COLORS.maybe,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  consequenceTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
    textAlign: 'center',
  },
  consequenceBody: {
    color: COLORS.textSub,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  consequenceButton: {
    minHeight: 50,
    minWidth: 150,
    borderRadius: 25,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    marginTop: 4,
  },
  consequenceButtonText: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
});
