import React, { useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle,
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { AccentBar, CardAccentTop } from '../app-chrome';
import { COLORS, GRADIENTS, RADII } from '../../constants/theme';
import type { GameCardDisplayLanguage } from '../../data/gameCardTranslations';
import { formatGameCardTimerSeconds } from '../../lib/gameTimer';
import {
  GAME_CONTROL_MIN_SIZE,
  GamePill,
  GameSegmentedControl,
  GameSurface,
} from './GameControls';

export type GameRoundPhase = 'ready' | 'spinning' | 'revealed';

export type GameTimerDisplay = {
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  timesUpLabel: string;
  startLabel: string;
  pauseLabel: string;
  resetLabel: string;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};

export type GameRoundPanelProps = {
  phase: GameRoundPhase;
  language: GameCardDisplayLanguage;
  onLanguageChange: (language: GameCardDisplayLanguage) => void;
  drawDisabled: boolean;
  onDraw: () => void;
  mysteryLabel: string;
  drawLabel: string;
  hiddenBody: string;
  spinningLabel: string;
  spinningTitle: string;
  spinningMeta: string;
  revealedTitle: string;
  revealedBody: string;
  timerEstimate: string;
  timer?: GameTimerDisplay;
  passRiskLabel: string;
  doneLabel: string;
  onPassRisk: () => void;
  onDone: () => void;
  rouletteStyle?: StyleProp<ViewStyle>;
};

const SCROLL_END_TOLERANCE = 8;

export function GameRoundPanel({
  phase,
  language,
  onLanguageChange,
  drawDisabled,
  onDraw,
  mysteryLabel,
  drawLabel,
  hiddenBody,
  spinningLabel,
  spinningTitle,
  spinningMeta,
  revealedTitle,
  revealedBody,
  timerEstimate,
  timer,
  passRiskLabel,
  doneLabel,
  onPassRisk,
  onDone,
  rouletteStyle,
}: GameRoundPanelProps) {
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const showScrollCue =
    phase === 'revealed' &&
    viewportHeight > 0 &&
    contentHeight > viewportHeight + SCROLL_END_TOLERANCE &&
    scrollOffset + viewportHeight < contentHeight - SCROLL_END_TOLERANCE;

  return (
    <View style={styles.stage}>
      <GameSurface elevated style={styles.card}>
        <CardAccentTop />
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onLayout={(event) =>
            setViewportHeight(event.nativeEvent.layout.height)
          }
          onScroll={(event) =>
            setScrollOffset(event.nativeEvent.contentOffset.y)
          }
          contentContainerStyle={styles.cardContent}
        >
          <View style={styles.languageControlRow}>
            <GameSegmentedControl
              compact
              accessibilityLabel="Card language"
              value={language}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'es', label: 'ES' },
              ]}
              onChange={onLanguageChange}
            />
          </View>
          {phase === 'ready' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={drawLabel}
              accessibilityHint={hiddenBody}
              accessibilityState={{ disabled: drawDisabled }}
              disabled={drawDisabled}
              onPress={onDraw}
              style={({ pressed }) => [
                styles.cardBack,
                pressed && styles.pressed,
              ]}
            >
              <AccentBar />
              <Text style={styles.kicker}>{mysteryLabel}</Text>
              <Text style={styles.title}>{drawLabel}</Text>
              <Text style={styles.body}>{hiddenBody}</Text>
            </Pressable>
          ) : phase === 'spinning' ? (
            <Animated.View
              style={[styles.cardBack, styles.spinning, rouletteStyle]}
            >
              <AccentBar />
              <Text style={styles.kicker}>{spinningLabel}</Text>
              <Text style={styles.title}>{spinningTitle}</Text>
              <Text style={styles.spinningMeta}>{spinningMeta}</Text>
            </Animated.View>
          ) : (
            <View style={styles.challenge}>
              <AccentBar />
              <Text style={styles.title}>{revealedTitle}</Text>
              <Text style={styles.body}>{revealedBody}</Text>
              {timer ? null : <GamePill label={timerEstimate} tone="warning" />}
            </View>
          )}
          {phase === 'revealed' && timer ? (
            <TimerPanel timer={timer} timerEstimate={timerEstimate} />
          ) : null}
        </ScrollView>
        {showScrollCue ? (
          <LinearGradient
            testID="game-round-scroll-cue"
            accessible={false}
            pointerEvents="none"
            colors={['rgba(13,0,6,0)', COLORS.card]}
            style={styles.scrollCue}
          >
            <ChevronDown size={18} color={COLORS.textSub} strokeWidth={2.5} />
          </LinearGradient>
        ) : null}
      </GameSurface>
      {phase === 'revealed' ? (
        <View style={styles.outcomes}>
          <OutcomeAction
            label={passRiskLabel}
            icon={X}
            color={COLORS.no}
            onPress={onPassRisk}
          />
          <OutcomeAction
            label={doneLabel}
            icon={CheckCircle}
            color={COLORS.pink}
            primary
            onPress={onDone}
          />
        </View>
      ) : null}
    </View>
  );
}

function TimerPanel({
  timer,
  timerEstimate,
}: {
  timer: GameTimerDisplay;
  timerEstimate: string;
}) {
  const progress = Math.min(
    1,
    Math.max(
      0,
      timer.totalSeconds > 0 ? timer.remainingSeconds / timer.totalSeconds : 0
    )
  );
  const urgent = timer.remainingSeconds <= 10;
  const timeExpired = timer.remainingSeconds <= 0;
  const activeLabel = timer.running ? timer.pauseLabel : timer.startLabel;
  const activeAction = timer.running ? timer.onPause : timer.onStart;
  const ActiveIcon = timer.running ? Pause : Play;
  const progressWidth = `${progress * 100}%` as `${number}%`;
  const formattedTime = formatGameCardTimerSeconds(timer.remainingSeconds);

  return (
    <View testID="game-timer-strip" style={styles.timerPanel}>
      <View style={styles.timerMainRow}>
        <View style={styles.timerReadout}>
          <Text
            numberOfLines={1}
            style={[styles.timerEstimate, timeExpired && styles.timesUp]}
          >
            {timeExpired ? timer.timesUpLabel : timerEstimate}
          </Text>
          <Text
            accessibilityLabel={timeExpired ? timer.timesUpLabel : undefined}
            accessibilityLiveRegion={timeExpired ? 'polite' : undefined}
            style={[styles.timerValue, urgent && styles.timerUrgent]}
          >
            {formattedTime}
          </Text>
        </View>
        <View style={styles.timerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={activeLabel}
            onPress={activeAction}
            style={({ pressed }) => [
              styles.timerAction,
              styles.timerActionPrimary,
              pressed && styles.pressed,
            ]}
          >
            <ActiveIcon size={19} color={COLORS.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={timer.resetLabel}
            onPress={timer.onReset}
            style={({ pressed }) => [
              styles.timerAction,
              pressed && styles.pressed,
            ]}
          >
            <RotateCcw size={18} color={COLORS.textSub} />
          </Pressable>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: progressWidth },
            urgent && styles.progressUrgent,
          ]}
        />
      </View>
    </View>
  );
}

function OutcomeAction({
  label,
  icon: Icon,
  color,
  primary = false,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  color: string;
  primary?: boolean;
  onPress: () => void;
}) {
  const icon = (
    <Icon
      size={primary ? 30 : 24}
      color={primary ? COLORS.textPrimary : color}
      strokeWidth={2.6}
    />
  );

  return (
    <View style={styles.outcomeAction}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.outcomePress,
          pressed && styles.pressed,
        ]}
      >
        {primary ? (
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.outcomeCircle, styles.outcomeCirclePrimary]}
          >
            {icon}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.outcomeCircle,
              styles.outcomeCircleSecondary,
              { borderColor: `${color}70` },
            ]}
          >
            {icon}
          </View>
        )}
      </Pressable>
      <Text style={[styles.outcomeLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    gap: 12,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  scrollCue: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 54,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 7,
  },
  languageControlRow: {
    alignItems: 'flex-end',
  },
  cardBack: {
    minHeight: 220,
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: COLORS.cardAlt,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  spinning: {
    borderColor: COLORS.border,
    backgroundColor: 'rgba(194,24,91,0.12)',
  },
  challenge: {
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  kicker: {
    color: COLORS.pink,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  body: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 22,
  },
  spinningMeta: {
    color: COLORS.maybe,
    fontSize: 17,
    fontWeight: '800',
  },
  timerPanel: {
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  timerMainRow: {
    minHeight: GAME_CONTROL_MIN_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  timerReadout: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 9,
  },
  timerEstimate: {
    flexShrink: 1,
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  timerValue: {
    color: COLORS.pink,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {
    color: COLORS.no,
  },
  timesUp: {
    color: COLORS.no,
  },
  progressTrack: {
    height: 5,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.pink,
  },
  progressUrgent: {
    backgroundColor: COLORS.no,
  },
  timerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  timerAction: {
    minWidth: GAME_CONTROL_MIN_SIZE,
    minHeight: GAME_CONTROL_MIN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  timerActionPrimary: {
    borderColor: 'rgba(255,45,146,0.38)',
    backgroundColor: 'rgba(255,45,146,0.16)',
  },
  outcomes: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  outcomeAction: {
    minWidth: 100,
    alignItems: 'center',
    gap: 5,
  },
  outcomePress: {
    minWidth: GAME_CONTROL_MIN_SIZE,
    minHeight: GAME_CONTROL_MIN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeCirclePrimary: {
    minWidth: 66,
    minHeight: 66,
    borderRadius: 33,
    shadowColor: COLORS.pink,
    shadowOpacity: 0.34,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  outcomeCircleSecondary: {
    minWidth: 52,
    minHeight: 52,
    borderRadius: 26,
    borderWidth: 1,
    backgroundColor: COLORS.cardAlt,
  },
  outcomeLabel: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
});
