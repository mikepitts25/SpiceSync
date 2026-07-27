import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { GameButton, GameSurface } from './GameControls';
import { COLORS } from '../../constants/theme';

export function MatchMissionEmptyState({
  title,
  body,
  ctaLabel,
  onPressCta,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  onPressCta: () => void;
}) {
  return (
    <GameSurface elevated style={styles.wrap}>
      <Text style={styles.emoji}>💌</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <GameButton label={ctaLabel} onPress={onPressCta} variant="secondary" />
    </GameSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
});
