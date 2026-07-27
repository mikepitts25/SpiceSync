import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';

import { GameSurface } from './GameControls';
import { COLORS } from '../../constants/theme';
import type { SavedDiceRoll } from '../../lib/state/coupleDice';

export function CoupleDiceSavedList({
  title,
  emptyLabel,
  deleteLabel,
  entries,
  onDelete,
}: {
  title: string;
  emptyLabel: string;
  deleteLabel: string;
  entries: readonly SavedDiceRoll[];
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        entries.map((entry) => (
          <GameSurface key={entry.id} style={styles.row}>
            <Text style={styles.rowText} numberOfLines={3}>
              {entry.prompt}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${deleteLabel}: ${entry.prompt}`}
              onPress={() => onDelete(entry.id)}
              style={styles.deleteButton}
            >
              <Trash2 size={18} color={COLORS.textMuted} />
            </Pressable>
          </GameSurface>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  empty: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  rowText: {
    flex: 1,
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 21,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
