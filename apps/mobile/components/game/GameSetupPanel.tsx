import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Play, PlusCircle } from 'lucide-react-native';

import { COLORS } from '../../constants/theme';
import { interpolate, useTranslation } from '../../lib/i18n';
import type { GameCardDisplayLanguage } from '../../data/gameCardTranslations';
import type { GameCardType } from '../../data/gameCards';
import type { GameCustomDeckMode } from '../../lib/gameDeck';
import type { GameIntensityLevel } from '../../lib/gameLevelFilter';
import { CardAccentTop } from '../app-chrome';
import {
  GameButton,
  GamePill,
  GameSegmentedControl,
  GameSurface,
  type GameSegmentOption,
} from './GameControls';

export type GameSetupMode = 'normal' | 'intense';

export type GameSetupPanelProps = {
  gameNightLabel: string;
  introTitle: string;
  introBody: string;
  badgeLabels: string[];
  mode: GameSetupMode;
  modeOptions: readonly GameSegmentOption<GameSetupMode>[];
  onModeChange: (mode: GameSetupMode) => void;
  intenseDisclaimer?: string;
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
  introTitle,
  introBody,
  badgeLabels,
  mode,
  modeOptions,
  onModeChange,
  intenseDisclaimer,
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
  // Solo sessions skip consequences and use their own card pool, so the
  // drinking and custom-deck controls don't apply.
  const solo = playerCount === 1;
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{gameNightLabel}</Text>
        <GameSegmentedControl
          accessibilityLabel={t.game.gameModeA11y}
          value={mode}
          options={modeOptions}
          onChange={onModeChange}
        />
        {intenseDisclaimer ? (
          <Text style={styles.disclaimer}>{intenseDisclaimer}</Text>
        ) : null}
      </View>

      <GameSurface elevated style={styles.setupCard}>
        <CardAccentTop />
        <View style={styles.setupInner}>
          <View style={styles.badges}>
            {badgeLabels.map((label) => (
              <GamePill key={label} label={label} />
            ))}
          </View>
          <Text style={styles.title}>{introTitle}</Text>
          <Text style={styles.body}>{introBody}</Text>
          <Text style={styles.sectionLabel}>{t.game.numberOfPlayers}</Text>
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
                <Text style={styles.playerCountText}>{count}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.nameGrid}>
            {playerNames.slice(0, playerCount).map((name, index) => (
              <TextInput
                key={index}
                accessibilityLabel={interpolate(t.game.playerNameA11y, {
                  number: index + 1,
                })}
                value={name}
                onChangeText={(value) => onPlayerNameChange(index, value)}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                style={styles.nameInput}
              />
            ))}
          </View>
          {solo ? null : (
            <View style={styles.optionRow}>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>{t.game.drinkingGame}</Text>
                <Text style={styles.optionBody}>{t.game.drinkingGameDesc}</Text>
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
          <View style={styles.languageRow}>
            <Text style={styles.sectionLabel}>{t.game.levelsLabel}</Text>
            <View style={styles.chipRow}>
              {([1, 2, 3, 4, 5] as GameIntensityLevel[]).map((level) => {
                const active = selectedLevels.includes(level);
                return (
                  <Pressable
                    key={level}
                    accessibilityRole="button"
                    accessibilityLabel={interpolate(t.game.levelOf, { level })}
                    accessibilityState={{ selected: active }}
                    onPress={() => onToggleLevel(level)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {interpolate(t.game.levelShort, { level })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.languageRow}>
            <Text style={styles.sectionLabel}>{t.game.cardTypesLabel}</Text>
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
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {t.game[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.languageRow}>
            <Text style={styles.sectionLabel}>{t.game.cardLanguage}</Text>
            <GameSegmentedControl
              accessibilityLabel={t.game.cardLanguage}
              value={cardLanguage}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'es', label: 'ES' },
              ]}
              onChange={onCardLanguageChange}
            />
          </View>
          {customCardsAvailable && !solo ? (
            <View style={styles.languageRow}>
              <Text style={styles.sectionLabel}>{t.game.deckMix}</Text>
              <GameSegmentedControl
                accessibilityLabel={t.game.deckMix}
                value={customDeckMode}
                options={[
                  { value: 'include', label: t.game.includeCustom },
                  { value: 'customOnly', label: t.game.customOnly },
                ]}
                onChange={onCustomDeckModeChange}
              />
            </View>
          ) : null}
          {solo ? null : (
            <GameButton
              label={t.game.customDeck}
              variant="secondary"
              icon={<PlusCircle size={18} color={COLORS.pink} />}
              onPress={onOpenCustomDeck}
            />
          )}
          <GameButton
            label={startLabel}
            icon={<Play size={20} color={COLORS.textPrimary} fill="white" />}
            onPress={onStart}
            disabled={startDisabled}
          />
        </View>
      </GameSurface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    paddingBottom: 18,
  },
  hero: {
    gap: 12,
  },
  eyebrow: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  disclaimer: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  setupCard: {
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  setupInner: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 14,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: COLORS.textSub,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  playerCountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  playerCount: {
    minWidth: 52,
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
    backgroundColor: 'rgba(255,47,146,0.18)',
  },
  playerCountText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  nameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nameInput: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 120,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,47,146,0.22)',
    backgroundColor: COLORS.cardAlt,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  optionBody: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  switch: {
    minWidth: 44,
    minHeight: 44,
  },
  languageRow: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    minWidth: 52,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: COLORS.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  chipActive: {
    borderColor: COLORS.pink,
    backgroundColor: 'rgba(255,47,146,0.18)',
  },
  chipText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
  },
  chipTextActive: {
    color: COLORS.textPrimary,
  },
});
