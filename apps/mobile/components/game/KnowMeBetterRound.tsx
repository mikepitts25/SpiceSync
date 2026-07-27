import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GameButton, GamePill, GameSurface } from './GameControls';
import { COLORS } from '../../constants/theme';

export function KnowMeBetterOptionPicker({
  eyebrow,
  hint,
  prompt,
  options,
  onSelect,
}: {
  eyebrow: string;
  hint: string;
  prompt: string;
  options: readonly string[];
  onSelect: (option: string) => void;
}) {
  return (
    <GameSurface elevated style={styles.wrap}>
      <GamePill label={eyebrow.toUpperCase()} tone="accent" />
      <Text style={styles.hint}>{hint}</Text>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.options}>
        {options.map((option) => (
          <GameButton
            key={option}
            label={option}
            onPress={() => onSelect(option)}
            variant="secondary"
          />
        ))}
      </View>
    </GameSurface>
  );
}

export function KnowMeBetterReveal({
  prompt,
  answererLabel,
  answererOption,
  guesserLabel,
  guesserOption,
  resultTitle,
  resultBody,
  isMatch,
  nextLabel,
  endLabel,
  onNext,
  onEnd,
  isLastRound,
}: {
  prompt: string;
  answererLabel: string;
  answererOption: string;
  guesserLabel: string;
  guesserOption: string;
  resultTitle: string;
  resultBody: string;
  isMatch: boolean;
  nextLabel: string;
  endLabel: string;
  onNext: () => void;
  onEnd: () => void;
  isLastRound: boolean;
}) {
  return (
    <GameSurface elevated style={styles.wrap}>
      <Text style={styles.prompt}>{prompt}</Text>

      <View style={styles.answerRow}>
        <Text style={styles.answerLabel}>{answererLabel}</Text>
        <Text style={styles.answerValue}>{answererOption}</Text>
      </View>
      <View style={styles.answerRow}>
        <Text style={styles.answerLabel}>{guesserLabel}</Text>
        <Text style={styles.answerValue}>{guesserOption}</Text>
      </View>

      <View
        style={[
          styles.resultBanner,
          {
            backgroundColor: isMatch
              ? 'rgba(34,197,94,0.14)'
              : 'rgba(245,158,11,0.12)',
          },
        ]}
      >
        <Text
          style={[
            styles.resultTitle,
            { color: isMatch ? COLORS.yes : COLORS.maybe },
          ]}
        >
          {resultTitle}
        </Text>
        <Text style={styles.resultBody}>{resultBody}</Text>
      </View>

      <GameButton
        label={isLastRound ? endLabel : nextLabel}
        onPress={isLastRound ? onEnd : onNext}
      />
    </GameSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    gap: 14,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  prompt: {
    color: COLORS.textPrimary,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '800',
  },
  options: {
    gap: 10,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  answerValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  resultBanner: {
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  resultBody: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 21,
  },
});
