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
  ScrollView,
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
  CheckCircle,
  Pause,
  PlusCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Timer,
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
  formatGameCardTimerSeconds,
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
import { hasPremiumFeatureAccess } from '../../lib/purchases/access';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useCustomGameCardsStore } from '../../src/stores/customGameCards';
import { COLORS, GRADIENTS, RADII, SHADOWS } from '../../constants/theme';

type GameMode = 'normal' | 'intense';
type VisibleGameScene = 'intro' | 'game';
type GameRoundPhase = 'ready' | 'spinning' | 'revealed';

const GAME_SCENE_TRANSITION_MS = 240;
const GAME_ROULETTE_DURATION_MS = 1200;
const GAME_ROULETTE_TICK_MS = 85;

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
const CUSTOM_DECK_MODE_OPTIONS = [
  { value: 'include', label: 'Include Custom' },
  { value: 'customOnly', label: 'Custom Only' },
] as const;
const CARD_LANGUAGE_OPTIONS: {
  value: GameCardDisplayLanguage;
  label: string;
}[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
];
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
  draw: string;
  choosing: string;
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
    readyPrompt: (player) => `${player}, tap Draw when ready.`,
    spinningPrompt: (player) => `${player}, the deck is choosing...`,
    revealedPrompt: (player) => `${player}, resolve this card.`,
    mysteryCard: 'Mystery card',
    tapDraw: 'Tap Draw',
    hiddenCardBody: 'The next card stays hidden until the roulette lands.',
    rouletteSpinning: 'Roulette is spinning',
    level: (intensity) => `Level ${intensity}`,
    draw: 'Draw',
    choosing: 'Choosing',
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
    readyPrompt: (player) => `${player}, toca Sacar cuando estés listo.`,
    spinningPrompt: (player) => `${player}, el mazo está eligiendo...`,
    revealedPrompt: (player) => `${player}, resuelve esta carta.`,
    mysteryCard: 'Carta misteriosa',
    tapDraw: 'Saca carta',
    hiddenCardBody:
      'La próxima carta se mantiene oculta hasta que termine la ruleta.',
    rouletteSpinning: 'La ruleta gira',
    level: (intensity) => `Nivel ${intensity}`,
    draw: 'Sacar',
    choosing: 'Eligiendo',
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

  const timerProgress =
    totalTimerSeconds > 0 ? timerSeconds / totalTimerSeconds : 1;

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
  const turnPrompt =
    roundPhase === 'ready'
      ? cardCopy.readyPrompt(currentTurn.player)
      : roundPhase === 'spinning'
        ? cardCopy.spinningPrompt(currentTurn.player)
        : cardCopy.revealedPrompt(currentTurn.player);

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

  const renderModeSelector = () => (
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
  );

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
          <View style={styles.activeGameHeader}>
            <View style={styles.activeGameTitleRow}>
              <View style={styles.activeGameTitleCopy}>
                <Text style={styles.activeGameEyebrow}>
                  {cardCopy.gameNight.toUpperCase()}
                </Text>
                <Text style={styles.activeGameTitle}>
                  {selectedCardModeLabel}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={cardCopy.endGame}
                onPress={confirmEndGame}
                style={styles.endGameButton}
              >
                <Text style={styles.endGameText}>{cardCopy.endGame}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.headingRow}>
              <Text style={styles.heading}>
                {t.game.gameNight.toUpperCase()}
              </Text>
            </View>
            <View style={styles.modeGroup}>
              {renderModeSelector()}
              {selectedMode === 'intense' ? (
                <Text style={styles.intenseDisclaimer}>
                  {t.game.intenseDisclaimer}
                </Text>
              ) : null}
            </View>
          </>
        )}

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
                        Adds drinks and shots to pass consequences.
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

                  {customCards.length > 0 ? (
                    <View style={styles.customDeckModeGroup}>
                      <Text style={styles.setupLabel}>Deck Mix</Text>
                      <View style={styles.customDeckModeRow}>
                        {CUSTOM_DECK_MODE_OPTIONS.map((mode) => {
                          const active = customDeckMode === mode.value;
                          return (
                            <Pressable
                              key={mode.value}
                              accessibilityRole="button"
                              accessibilityState={{ selected: active }}
                              onPress={() => setCustomDeckMode(mode.value)}
                              style={[
                                styles.customDeckModeButton,
                                active && styles.customDeckModeButtonActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.customDeckModeText,
                                  active && styles.customDeckModeTextActive,
                                ]}
                              >
                                {mode.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open custom deck"
                  onPress={() => router.push('/(game)/custom-deck')}
                  style={styles.customDeckButton}
                >
                  <PlusCircle size={18} color={COLORS.pink} />
                  <Text style={styles.customDeckButtonText}>Custom Deck</Text>
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
              <View style={styles.gameCard}>
                <CardAccentTop />
                <View style={styles.cardInner}>
                  <View style={styles.cardTurnPanel}>
                    <View style={styles.cardTurnMetaRow}>
                      <Text style={styles.cardTurnCounter}>
                        {cardCopy.playerUp}
                      </Text>
                      {drinkingMode ? (
                        <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>
                            {cardCopy.drinking}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.cardTurnRoute}>
                      <View style={styles.cardTurnPersonBlock}>
                        <Text style={styles.cardTurnPersonLabel}>
                          {cardCopy.playerOf(
                            currentTurn.turnNumber,
                            activePlayers.length
                          )}
                        </Text>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.82}
                          style={styles.cardTurnName}
                        >
                          {currentTurn.player}
                        </Text>
                      </View>
                      <Text style={styles.cardTurnArrow}>→</Text>
                      <View
                        style={[
                          styles.cardTurnPersonBlock,
                          styles.cardTurnTargetBlock,
                        ]}
                      >
                        <Text style={styles.cardTurnPersonLabel}>
                          {cardCopy.target}
                        </Text>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.82}
                          style={[
                            styles.cardTurnName,
                            styles.cardTurnTargetName,
                          ]}
                        >
                          {currentTurn.target}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardTurnPrompt}>{turnPrompt}</Text>
                  </View>

                  <View style={styles.cardLanguageToggle}>
                    {CARD_LANGUAGE_OPTIONS.map((option) => {
                      const isActive = cardLanguage === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isActive }}
                          accessibilityLabel={`Show card in ${option.label}`}
                          onPress={() => setCardLanguage(option.value)}
                          style={[
                            styles.cardLanguageButton,
                            isActive && styles.cardLanguageButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.cardLanguageText,
                              isActive && styles.cardLanguageTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.cardMainContent}>
                    {roundPhase === 'ready' ? (
                      <View style={styles.cardBackPanel}>
                        <AccentBar />
                        <Text style={styles.cardBackKicker}>
                          {cardCopy.mysteryCard}
                        </Text>
                        <Text style={styles.cardBackTitle}>
                          {cardCopy.tapDraw}
                        </Text>
                        <Text style={styles.cardBackBody}>
                          {cardCopy.hiddenCardBody}
                        </Text>
                      </View>
                    ) : roundPhase === 'spinning' ? (
                      <Animated.View
                        style={[
                          styles.cardBackPanel,
                          styles.roulettePanel,
                          rouletteCardStyle,
                        ]}
                      >
                        <AccentBar />
                        <Text style={styles.cardBackKicker}>
                          {cardCopy.rouletteSpinning}
                        </Text>
                        <Text style={styles.cardBackTitle}>
                          {roulettePreviewCard
                            ? titleForCard(roulettePreviewCard, cardCopy.titles)
                            : cardCopy.draw}
                        </Text>
                        <Text style={styles.rouletteMeta}>
                          {roulettePreviewCard
                            ? cardCopy.level(roulettePreviewCard.intensity)
                            : selectedCardModeLabel}
                        </Text>
                      </Animated.View>
                    ) : (
                      <>
                        <AccentBar />

                        <Text style={styles.cardTitle}>
                          {currentCard
                            ? titleForCard(currentCard, cardCopy.titles)
                            : cardCopy.noCardsForLevels}
                        </Text>
                        <Text style={styles.cardBody}>
                          {displayedCardContent}
                        </Text>

                        <View style={styles.timerBadge}>
                          <Timer size={14} color={COLORS.maybe} />
                          <Text style={styles.timerText}>
                            {timerEstimateText}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  {isCardRevealed && totalTimerSeconds > 0 ? (
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
                              ? cardCopy.timesUp
                              : timerEstimateText}
                          </Text>
                        </View>
                        <View style={styles.timerButtonRow}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={
                              isTimerRunning
                                ? cardCopy.pauseTimer
                                : cardCopy.startTimer
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
                                ? cardCopy.pauseTimer
                                : cardCopy.startTimer}
                            </Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={cardCopy.resetTimer}
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
                {isCardRevealed ? (
                  <>
                    <ActionCircle
                      label={cardCopy.passRisk.toUpperCase()}
                      icon={X}
                      color={COLORS.no}
                      onPress={() => finishRevealedCard(true)}
                    />
                    <ActionCircle
                      label={cardCopy.done.toUpperCase()}
                      icon={CheckCircle}
                      variant="gradient"
                      color={COLORS.pink}
                      size={66}
                      iconSize={28}
                      onPress={() => finishRevealedCard(false)}
                    />
                  </>
                ) : (
                  <ActionCircle
                    label={
                      roundPhase === 'spinning'
                        ? cardCopy.choosing.toUpperCase()
                        : cardCopy.draw.toUpperCase()
                    }
                    icon={RefreshCw}
                    variant="gradient"
                    color={COLORS.pink}
                    size={66}
                    iconSize={28}
                    onPress={
                      roundPhase === 'ready' ? startRouletteDraw : undefined
                    }
                  />
                )}
              </View>
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
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  activeGameHeader: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activeGameTitleRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activeGameTitleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  activeGameEyebrow: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '800',
  },
  activeGameTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  endGameButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
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
  customDeckModeGroup: {
    gap: 8,
  },
  customDeckModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customDeckModeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  customDeckModeButtonActive: {
    borderColor: COLORS.pink,
    backgroundColor: 'rgba(255,47,146,0.18)',
  },
  customDeckModeText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  customDeckModeTextActive: {
    color: COLORS.textPrimary,
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
    gap: 8,
  },
  cardTurnPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  cardTurnMetaRow: {
    minHeight: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTurnCounter: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,47,146,0.26)',
    backgroundColor: 'rgba(255,47,146,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusPillText: {
    color: COLORS.pink,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  cardTurnRoute: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTurnPersonBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  cardTurnTargetBlock: {
    alignItems: 'flex-end',
  },
  cardTurnPersonLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  cardTurnName: {
    color: COLORS.textPrimary,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
  },
  cardTurnTargetName: {
    textAlign: 'right',
  },
  cardTurnArrow: {
    width: 28,
    color: COLORS.pink,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardTurnPrompt: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
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
    paddingVertical: 14,
    gap: 10,
  },
  cardLanguageToggle: {
    alignSelf: 'center',
    minHeight: 34,
    flexDirection: 'row',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  cardLanguageButton: {
    width: 52,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLanguageButtonActive: {
    backgroundColor: 'rgba(255,47,146,0.24)',
  },
  cardLanguageText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardLanguageTextActive: {
    color: COLORS.textPrimary,
  },
  cardMainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  cardBackPanel: {
    width: '100%',
    minHeight: 230,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 22,
    gap: 10,
  },
  roulettePanel: {
    borderColor: 'rgba(255,47,146,0.35)',
    backgroundColor: 'rgba(255,47,146,0.09)',
  },
  cardBackKicker: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cardBackTitle: {
    color: COLORS.textPrimary,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardBackBody: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'center',
  },
  rouletteMeta: {
    color: COLORS.pink,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
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
