import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';

import { COLORS, GRADIENTS, RADII } from '../../constants/theme';
import { GameButton, GamePill, GameSurface } from './GameControls';

export function GameSessionHeader({
  gameNightLabel,
  modeLabel,
  drinkingLabel,
  endGameLabel,
  onEndGame,
}: {
  gameNightLabel: string;
  modeLabel: string;
  drinkingLabel?: string;
  endGameLabel: string;
  onEndGame: () => void;
}) {
  return (
    <GameSurface style={styles.header}>
      <View style={styles.headerZone}>
        <Text numberOfLines={1} style={styles.eyebrow}>
          {gameNightLabel}
        </Text>
        <Text numberOfLines={1} style={styles.mode}>
          {modeLabel}
        </Text>
      </View>
      <View style={[styles.headerZone, styles.headerCenter]}>
        {drinkingLabel ? (
          <GamePill label={drinkingLabel} tone="accent" />
        ) : null}
      </View>
      <View style={[styles.headerZone, styles.headerAction]}>
        <GameButton
          label={endGameLabel}
          variant="secondary"
          onPress={onEndGame}
        />
      </View>
    </GameSurface>
  );
}

export function GamePlayerMatchup({
  playerLabel,
  playerName,
  targetLabel,
  targetName,
}: {
  playerLabel: string;
  playerName: string;
  targetLabel: string;
  targetName: string;
}) {
  const person = (label: string, name: string, target: boolean) => (
    <View style={[styles.person, target ? styles.target : styles.player]}>
      <Text style={[styles.role, target && styles.targetText]}>{label}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={[styles.name, target && styles.targetText]}
      >
        {name}
      </Text>
    </View>
  );

  return (
    <GameSurface style={styles.matchup}>
      {person(playerLabel, playerName, false)}
      <LinearGradient colors={GRADIENTS.primary} style={styles.arrow}>
        <ArrowRight size={28} color={COLORS.textPrimary} strokeWidth={3} />
      </LinearGradient>
      {person(targetLabel, targetName, true)}
    </GameSurface>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerZone: {
    flex: 1,
    minWidth: 0,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerAction: {
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  eyebrow: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mode: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  person: {
    flex: 1,
    minWidth: 0,
    minHeight: 92,
    justifyContent: 'center',
    borderRadius: RADII.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  player: {
    backgroundColor: 'rgba(255,45,146,0.14)',
  },
  target: {
    backgroundColor: 'rgba(65,92,120,0.18)',
  },
  role: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 5,
  },
  targetText: {
    textAlign: 'right',
  },
  arrow: {
    width: 52,
    height: 52,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    shadowColor: COLORS.pink,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
});
