import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GameButton, GameSurface } from './GameControls';
import { COLORS } from '../../constants/theme';
import type { RoundCount } from '../../lib/knowMeBetter';

export function KnowMeBetterSetup({
  title,
  roundOptions,
  selectedRounds,
  onSelectRounds,
  startLabel,
  onStart,
}: {
  title: string;
  roundOptions: { value: RoundCount; label: string }[];
  selectedRounds: RoundCount;
  onSelectRounds: (rounds: RoundCount) => void;
  startLabel: string;
  onStart: () => void;
}) {
  return (
    <GameSurface style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.optionsRow}>
        {roundOptions.map((option) => {
          const selected = option.value === selectedRounds;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onSelectRounds(option.value)}
              style={[styles.roundChip, selected && styles.roundChipSelected]}
            >
              <Text
                style={[
                  styles.roundChipText,
                  selected && styles.roundChipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <GameButton label={startLabel} onPress={onStart} />
    </GameSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    gap: 14,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roundChip: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  roundChipSelected: {
    borderColor: COLORS.pink,
    backgroundColor: 'rgba(255,47,146,0.22)',
  },
  roundChipText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
  },
  roundChipTextSelected: {
    color: COLORS.textPrimary,
  },
});
