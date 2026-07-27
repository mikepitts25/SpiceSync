import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GameButton, GameSurface } from './GameControls';
import { COLORS } from '../../constants/theme';
import type { RoundCount } from '../../lib/knowMeBetter';

export function KnowMeBetterSetup({
  title,
  subtitle,
  roundOptions,
  selectedRounds,
  onSelectRounds,
  startLabel,
  onStart,
}: {
  title: string;
  subtitle: string;
  roundOptions: { value: RoundCount; label: string }[];
  selectedRounds: RoundCount;
  onSelectRounds: (rounds: RoundCount) => void;
  startLabel: string;
  onStart: () => void;
}) {
  return (
    <GameSurface elevated style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.optionsRow}>
        {roundOptions.map((option) => {
          const selected = option.value === selectedRounds;
          return (
            <GameButton
              key={option.value}
              label={option.label}
              onPress={() => onSelectRounds(option.value)}
              variant={selected ? 'primary' : 'secondary'}
              compact
            />
          );
        })}
      </View>

      <GameButton label={startLabel} onPress={onStart} />
    </GameSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    gap: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 22,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
