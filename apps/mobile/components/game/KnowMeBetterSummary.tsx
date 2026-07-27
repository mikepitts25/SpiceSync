import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { GameButton, GameSurface } from './GameControls';
import { COLORS } from '../../constants/theme';

export function KnowMeBetterSummary({
  title,
  roundsLabel,
  matchesLabel,
  closingMessage,
  playAgainLabel,
  onPlayAgain,
}: {
  title: string;
  roundsLabel: string;
  matchesLabel: string;
  closingMessage: string;
  playAgainLabel: string;
  onPlayAgain: () => void;
}) {
  return (
    <GameSurface elevated style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.stat}>{roundsLabel}</Text>
      <Text style={styles.stat}>{matchesLabel}</Text>
      <Text style={styles.closing}>{closingMessage}</Text>
      <GameButton label={playAgainLabel} onPress={onPlayAgain} />
    </GameSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 22,
    gap: 12,
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  stat: {
    color: COLORS.textSub,
    fontSize: 17,
    fontWeight: '700',
  },
  closing: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 4,
  },
});
