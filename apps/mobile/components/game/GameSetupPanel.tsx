import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Layers3, PlusCircle } from 'lucide-react-native';

import { COLORS } from '../../constants/theme';
import { interpolate, useTranslation } from '../../lib/i18n';
import type { GameCardDisplayLanguage } from '../../data/gameCardTranslations';
import type { GameCardType } from '../../data/gameCards';
import type { GameCustomDeckMode } from '../../lib/gameDeck';
import type { GameIntensityLevel } from '../../lib/gameLevelFilter';
import {
  GameButton,
  GameSegmentedControl,
  GameSurface,
  type GameSegmentOption,
} from './GameControls';

export type GameSetupMode = 'normal' | 'intense';

export type GameSetupPanelProps = {
  gameNightLabel: string;
  mode: GameSetupMode;
  modeOptions: readonly GameSegmentOption<GameSetupMode>[];
  onModeChange: (mode: GameSetupMode) => void;
  playerCount: number;
  playerNames: string[];
  onPlayerCountChange: (count: number) => void;
  onPlayerNameChange: (index: number, name: string) => void;
  selectedLevels: readonly GameIntensityLevel[];
  onToggleLevel: (level: GameIntensityLevel) => void;
  enabledTypes: readonly GameCardType[];
  onToggleType: (type: GameCardType) => void;
  drinkingMode: boolean;
  onDrinkingModeChange: (value: boolean) => void;
  cardLanguage: GameCardDisplayLanguage;
  onCardLanguageChange: (language: GameCardDisplayLanguage) => void;
  customCardsAvailable: boolean;
  customDeckMode: GameCustomDeckMode;
  onCustomDeckModeChange: (mode: GameCustomDeckMode) => void;
  onOpenCustomDeck: () => void;
  startLabel: string;
  onStart: () => void;
  startDisabled: boolean;
};

export function GameSetupPanel({
  gameNightLabel,
  mode,
  modeOptions,
  onModeChange,
  playerCount,
  playerNames,
  onPlayerCountChange,
  onPlayerNameChange,
  selectedLevels,
  onToggleLevel,
  enabledTypes,
  onToggleType,
  drinkingMode,
  onDrinkingModeChange,
  cardLanguage,
  onCardLanguageChange,
  customCardsAvailable,
  customDeckMode,
  onCustomDeckModeChange,
  onOpenCustomDeck,
  startLabel,
  onStart,
  startDisabled,
}: GameSetupPanelProps) {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const setupOpacity = useRef(new Animated.Value(0)).current;
  const setupTranslateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(setupOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(setupTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [setupOpacity, setupTranslateY]);

  // Solo sessions skip consequences and use their own card pool, so the
  // drinking and custom-deck controls don't apply.
  const solo = playerCount === 1;
  const usesLargeTextLayout = fontScale >= 1.3;
  const setupContent = (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{gameNightLabel}</Text>
      </View>

      <Animated.View
        style={[
          {
            opacity: setupOpacity,
            transform: [{ translateY: setupTranslateY }],
          },
        ]}
      >
        <GameSurface style={styles.setupCard}>
          <View testID="game-setup-inner" style={styles.setupInner}>
            <View
              testID="game-setup-primary-controls"
              style={styles.primaryControls}
            >
              <GameSegmentedControl
                accessibilityLabel={t.game.gameModeA11y}
                value={mode}
                options={modeOptions}
                onChange={onModeChange}
                compact
              />
              <GameSegmentedControl
                accessibilityLabel={t.game.cardLanguage}
                value={cardLanguage}
                options={[
                  {
                    value: 'en',
                    label: t.game.cardLanguageEnglish,
                    accessibilityLabel: 'EN',
                  },
                  {
                    value: 'es',
                    label: t.game.cardLanguageSpanish,
                    accessibilityLabel: 'ES',
                  },
                ]}
                onChange={onCardLanguageChange}
                compact
              />
            </View>

            <View testID="game-setup-players" style={styles.zone}>
              <Text style={styles.groupLabel}>{t.game.numberOfPlayers}</Text>
              <View style={styles.playerCountRow}>
                {[1, 2, 3, 4].map((count) => (
                  <Pressable
                    key={count}
                    accessibilityRole="button"
                    accessibilityLabel={
                      count === 1
                        ? t.game.soloPlayerA11y
                        : interpolate(t.game.playersCountA11y, { count })
                    }
                    accessibilityState={{ selected: playerCount === count }}
                    onPress={() => onPlayerCountChange(count)}
                    style={[
                      styles.playerCount,
                      playerCount === count && styles.playerCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.playerCountText,
                        playerCount === count && styles.playerCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View
                testID="game-setup-name-grid"
                style={[
                  styles.nameGrid,
                  playerCount >= 3 && styles.nameGridDense,
                ]}
              >
                {playerNames.slice(0, playerCount).map((name, index) => (
                  <View
                    key={index}
                    testID={`game-setup-player-slot-${index + 1}`}
                    style={[
                      styles.nameSlot,
                      playerCount >= 3 && styles.nameSlotDense,
                      playerCount === 3 && styles.nameSlotThree,
                      playerCount === 4 && styles.nameSlotFour,
                    ]}
                  >
                    <TextInput
                      accessibilityLabel={interpolate(t.game.playerNameA11y, {
                        number: index + 1,
                      })}
                      value={name}
                      onChangeText={(value) => onPlayerNameChange(index, value)}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                      style={[
                        styles.nameInput,
                        playerCount >= 3 && styles.nameInputDense,
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View testID="game-setup-deck" style={styles.zone}>
              {solo ? null : (
                <View style={styles.optionRow}>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionTitle}>
                      {t.game.drinkingGame}
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel={t.game.drinkingGame}
                    value={drinkingMode}
                    onValueChange={onDrinkingModeChange}
                    trackColor={{
                      false: 'rgba(255,255,255,0.14)',
                      true: 'rgba(255,47,146,0.55)',
                    }}
                    thumbColor={COLORS.textPrimary}
                    style={styles.switch}
                  />
                </View>
              )}
              <View testID="game-setup-level-row" style={styles.choiceGroup}>
                <Text
                  style={[
                    styles.groupLabel,
                    usesLargeTextLayout && styles.groupLabelLargeText,
                  ]}
                >
                  {t.game.levelsLabel}
                </Text>
                <View
                  testID="game-setup-level-controls"
                  style={[
                    styles.chipRow,
                    styles.levelChipRow,
                    usesLargeTextLayout && styles.levelChipRowLargeText,
                  ]}
                >
                  {([1, 2, 3, 4, 5] as GameIntensityLevel[]).map((level) => {
                    const active = selectedLevels.includes(level);
                    return (
                      <Pressable
                        key={level}
                        accessibilityRole="button"
                        accessibilityLabel={interpolate(t.game.levelOf, {
                          level,
                        })}
                        accessibilityState={{ selected: active }}
                        onPress={() => onToggleLevel(level)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {interpolate(t.game.levelShort, { level })}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.choiceGroup}>
                <Text style={styles.groupLabel}>{t.game.cardTypesLabel}</Text>
                <View style={styles.chipRow}>
                  {(
                    [
                      'truth',
                      'dare',
                      'challenge',
                      'fantasy',
                      'roleplay',
                    ] as GameCardType[]
                  ).map((type) => {
                    const active = enabledTypes.includes(type);
                    return (
                      <Pressable
                        key={type}
                        accessibilityRole="button"
                        accessibilityLabel={t.game[type]}
                        accessibilityState={{ selected: active }}
                        onPress={() => onToggleType(type)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {t.game[type]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {customCardsAvailable && !solo ? (
                <View
                  testID="game-setup-deck-mix"
                  style={styles.compactDeckRow}
                >
                  <Text
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={[
                      styles.groupLabel,
                      styles.rowSectionLabel,
                      styles.deckMixLabel,
                    ]}
                  >
                    {t.game.deckMix}
                  </Text>
                  <View style={styles.deckMixControl}>
                    <GameSegmentedControl
                      accessibilityLabel={t.game.deckMix}
                      value={customDeckMode}
                      options={[
                        { value: 'include', label: t.game.includeCustom },
                        { value: 'customOnly', label: t.game.customOnly },
                      ]}
                      onChange={onCustomDeckModeChange}
                      fill
                    />
                  </View>
                </View>
              ) : null}
            </View>

            <View testID="game-setup-actions" style={styles.actionsRow}>
              {solo ? null : (
                <View style={[styles.actionSlot, styles.customActionSlot]}>
                  <GameButton
                    label={t.game.customDeck}
                    variant="secondary"
                    icon={<PlusCircle size={18} color={COLORS.pink} />}
                    onPress={onOpenCustomDeck}
                    compact
                    labelNumberOfLines={2}
                  />
                </View>
              )}
              <View
                collapsable={false}
                testID="game-setup-start-action"
                style={[styles.actionSlot, styles.startActionSlot]}
              >
                <GameButton
                  label={startLabel}
                  icon={<Layers3 size={20} color={COLORS.textPrimary} />}
                  emphasis="game"
                  onPress={onStart}
                  disabled={startDisabled}
                  compact
                  labelNumberOfLines={2}
                />
              </View>
            </View>
          </View>
        </GameSurface>
      </Animated.View>
    </>
  );

  if (fontScale >= 1.3) {
    return (
      <ScrollView
        testID="game-setup-overflow-scroll"
        style={styles.overflowScroll}
        contentContainerStyle={styles.overflowContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        {setupContent}
      </ScrollView>
    );
  }

  return (
    <View testID="game-setup-bounded-panel" style={styles.content}>
      {setupContent}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    maxHeight: '100%',
    gap: 10,
    paddingBottom: 0,
  },
  overflowScroll: {
    flex: 1,
  },
  overflowContent: {
    gap: 10,
    paddingBottom: 24,
  },
  hero: {
    gap: 6,
  },
  eyebrow: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  setupCard: {
    backgroundColor: COLORS.card,
  },
  setupInner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  primaryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 2,
  },
  zone: {
    gap: 8,
  },
  groupLabel: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: 'left',
  },
  playerCountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  playerCount: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCountActive: {
    borderColor: COLORS.pink,
    backgroundColor: 'rgba(255,47,146,0.28)',
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  playerCountText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  playerCountTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '900',
  },
  nameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  nameGridDense: {
    flexWrap: 'nowrap',
  },
  nameSlot: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 120,
    minHeight: 44,
    position: 'relative',
  },
  nameSlotDense: {
    flexGrow: 0,
    flexBasis: 'auto',
    minWidth: 44,
  },
  nameSlotThree: {
    width: '31%',
  },
  nameSlotFour: {
    width: '23%',
  },
  nameInput: {
    width: '100%',
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,47,146,0.22)',
    backgroundColor: COLORS.cardAlt,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nameInputDense: {
    fontSize: 16,
    letterSpacing: -1.2,
    paddingHorizontal: 8,
  },
  optionRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCopy: { flex: 1 },
  optionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  switch: {
    minWidth: 44,
    minHeight: 44,
  },
  choiceGroup: {
    gap: 6,
  },
  compactDeckRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactDeckRowLargeText: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: 4,
  },
  rowSectionLabel: {
    flex: 1,
  },
  groupLabelLargeText: { alignSelf: 'stretch' },
  levelChipRow: {
    flexWrap: 'nowrap',
    gap: 4,
  },
  levelChipRowLargeText: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  deckMixControl: {
    flex: 2.35,
  },
  deckMixLabel: {
    fontSize: 16,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  chip: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  chipActive: {
    borderColor: COLORS.pink,
    backgroundColor: 'rgba(255,47,146,0.28)',
    shadowColor: COLORS.pink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  chipText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
  },
  chipTextActive: {
    color: COLORS.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionSlot: {
    flex: 1,
    minWidth: 0,
  },
  customActionSlot: {
    flex: 0.95,
  },
  startActionSlot: {
    flex: 1.55,
  },
});
