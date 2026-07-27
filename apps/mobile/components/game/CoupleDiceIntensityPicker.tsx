import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../constants/theme';
import type { DiceIntensity } from '../../lib/coupleDice';
import { ALL_INTENSITY_LEVELS } from '../../lib/coupleDice';

export function CoupleDiceIntensityPicker({
  label,
  selectedLevels,
  onToggleLevel,
}: {
  label: string;
  selectedLevels: readonly DiceIntensity[];
  onToggleLevel: (level: DiceIntensity) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {ALL_INTENSITY_LEVELS.map((level) => {
          const selected = selectedLevels.includes(level);
          return (
            <Pressable
              key={level}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${level}`}
              accessibilityState={{ selected }}
              onPress={() => onToggleLevel(level)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: 'rgba(255,45,146,0.24)',
    borderColor: 'rgba(255,45,146,0.36)',
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: COLORS.textPrimary,
  },
});
