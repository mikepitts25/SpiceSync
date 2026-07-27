import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GameButton, GameSurface } from './GameControls';
import { COLORS } from '../../constants/theme';

export function CoupleDiceSlots({
  moodLabel,
  actionLabel,
  momentLabel,
  moodValue,
  actionValue,
  momentValue,
  rolling,
  rollingLabel,
}: {
  moodLabel: string;
  actionLabel: string;
  momentLabel: string;
  moodValue: string;
  actionValue: string;
  momentValue: string;
  rolling: boolean;
  rollingLabel: string;
}) {
  return (
    <View style={styles.slotsRow}>
      <DiceSlot label={moodLabel} value={rolling ? rollingLabel : moodValue} />
      <DiceSlot
        label={actionLabel}
        value={rolling ? rollingLabel : actionValue}
      />
      <DiceSlot
        label={momentLabel}
        value={rolling ? rollingLabel : momentValue}
      />
    </View>
  );
}

function DiceSlot({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.slot}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={styles.slotValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function CoupleDicePromptCard({
  prompt,
  safetyNote,
  rollAgainLabel,
  saveLabel,
  skipLabel,
  savedConfirmationLabel,
  isSaved,
  onRollAgain,
  onSave,
  onSkip,
}: {
  prompt: string;
  safetyNote: string;
  rollAgainLabel: string;
  saveLabel: string;
  skipLabel: string;
  savedConfirmationLabel: string;
  isSaved: boolean;
  onRollAgain: () => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  return (
    <GameSurface elevated style={styles.promptWrap}>
      <Text style={styles.prompt}>{prompt}</Text>
      <Text style={styles.safetyNote}>{safetyNote}</Text>
      <View style={styles.actionsRow}>
        <GameButton
          label={skipLabel}
          onPress={onSkip}
          variant="secondary"
          compact
        />
        <GameButton
          label={isSaved ? savedConfirmationLabel : saveLabel}
          onPress={onSave}
          variant="secondary"
          compact
          disabled={isSaved}
        />
        <GameButton label={rollAgainLabel} onPress={onRollAgain} compact />
      </View>
    </GameSurface>
  );
}

const styles = StyleSheet.create({
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slot: {
    flex: 1,
    minHeight: 84,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 6,
  },
  slotLabel: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  slotValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  promptWrap: {
    padding: 20,
    gap: 14,
  },
  prompt: {
    color: COLORS.textPrimary,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
  },
  safetyNote: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
