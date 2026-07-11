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
      <View style={[styles.headerZone, styles.headerLead]}>
        <Text numberOfLines={2} style={styles.eyebrow}>
          {gameNightLabel}
        </Text>
        <Text numberOfLines={2} style={styles.mode}>
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
          compact
          labelNumberOfLines={2}
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
      <Text numberOfLines={2} style={styles.role}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={styles.name}
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
    minWidth: 0,
    flexBasis: 0,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLead: {
    minWidth: 92,
    flexGrow: 1.15,
  },
  headerCenter: {
    minWidth: 100,
    flexGrow: 1,
  },
  headerAction: {
    minWidth: 96,
    minHeight: 44,
    flexGrow: 1.2,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  eyebrow: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  mode: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
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
    alignItems: 'center',
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
    textAlign: 'center',
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 5,
    textAlign: 'center',
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
