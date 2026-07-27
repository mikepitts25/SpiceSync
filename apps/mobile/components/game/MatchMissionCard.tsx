import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GameButton, GamePill, GameSurface } from './GameControls';
import { COLORS } from '../../constants/theme';

export function MatchMissionDraftCard({
  eyebrow,
  hint,
  copy,
  startLabel,
  notYetLabel,
  onStart,
  onDrawAnother,
}: {
  eyebrow: string;
  hint: string;
  copy: string;
  startLabel: string;
  notYetLabel: string;
  onStart: () => void;
  onDrawAnother: () => void;
}) {
  return (
    <GameSurface elevated style={styles.wrap}>
      <GamePill label={eyebrow.toUpperCase()} tone="accent" />
      <Text style={styles.hint}>{hint}</Text>
      <Text style={styles.copy}>{copy}</Text>
      <View style={styles.actions}>
        <GameButton
          label={notYetLabel}
          onPress={onDrawAnother}
          variant="secondary"
        />
        <GameButton label={startLabel} onPress={onStart} />
      </View>
    </GameSurface>
  );
}

export function MatchMissionActiveCard({
  eyebrow,
  copy,
  timeRemainingLabel,
  expiredLabel,
  isExpired,
  completeLabel,
  skipLabel,
  onComplete,
  onSkip,
}: {
  eyebrow: string;
  copy: string;
  timeRemainingLabel: string;
  expiredLabel: string;
  isExpired: boolean;
  completeLabel: string;
  skipLabel: string;
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <GameSurface elevated style={styles.wrap}>
      <GamePill label={eyebrow.toUpperCase()} tone="warning" />
      <Text style={styles.copy}>{copy}</Text>
      <Text style={styles.timeRemaining}>
        {isExpired ? expiredLabel : timeRemainingLabel}
      </Text>
      <View style={styles.actions}>
        <GameButton label={skipLabel} onPress={onSkip} variant="secondary" />
        <GameButton label={completeLabel} onPress={onComplete} />
      </View>
    </GameSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    gap: 12,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  copy: {
    color: COLORS.textPrimary,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  timeRemaining: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
