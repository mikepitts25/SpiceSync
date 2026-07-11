import React from 'react';
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
  return (
    <View style={styles.stage}>
      <GameSurface elevated style={styles.card}>
        <CardAccentTop />
        <ScrollView
          showsVerticalScrollIndicator={false}
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
              <GamePill label={timerEstimate} tone="warning" />
            </View>
          )}
          {phase === 'revealed' && timer ? (
            <TimerPanel timer={timer} timerEstimate={timerEstimate} />
          ) : null}
        </ScrollView>
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
    <View style={styles.timerPanel}>
      <View style={styles.timerHeading}>
        <View>
          <Text style={styles.timerEstimate}>{timerEstimate}</Text>
          <Text
            accessibilityLabel={timeExpired ? timer.timesUpLabel : undefined}
            accessibilityLiveRegion={timeExpired ? 'polite' : undefined}
            style={[styles.timerValue, urgent && styles.timerUrgent]}
          >
            {formattedTime}
          </Text>
        </View>
        {timeExpired ? (
          <Text style={styles.timesUp}>{timer.timesUpLabel}</Text>
        ) : null}
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
          <ActiveIcon size={18} color={COLORS.textPrimary} />
          <Text style={styles.timerActionText}>{activeLabel}</Text>
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
          <Text style={styles.timerActionText}>{timer.resetLabel}</Text>
        </Pressable>
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
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
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
    gap: 13,
    paddingHorizontal: 5,
    paddingVertical: 8,
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
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
  },
  body: {
    color: COLORS.textSub,
    fontSize: 17,
    lineHeight: 25,
  },
  spinningMeta: {
    color: COLORS.maybe,
    fontSize: 17,
    fontWeight: '800',
  },
  timerPanel: {
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    padding: 14,
  },
  timerHeading: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timerEstimate: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  timerValue: {
    color: COLORS.pink,
    fontSize: 34,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {
    color: COLORS.no,
  },
  timesUp: {
    flexShrink: 1,
    color: COLORS.no,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
  },
  progressTrack: {
    height: 7,
    overflow: 'hidden',
    borderRadius: 4,
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
    flexWrap: 'wrap',
    gap: 10,
  },
  timerAction: {
    minWidth: GAME_CONTROL_MIN_SIZE,
    minHeight: GAME_CONTROL_MIN_SIZE,
    flexBasis: 132,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    paddingHorizontal: 12,
  },
  timerActionPrimary: {
    borderColor: 'rgba(255,45,146,0.38)',
    backgroundColor: 'rgba(255,45,146,0.16)',
  },
  timerActionText: {
    flexShrink: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
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
