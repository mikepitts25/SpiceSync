import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { SafeAreaView } from '../../components/SafeAreaView';
import { BackHeader } from '../../components/app-chrome';
import { GameButton, GameSurface } from '../../components/game/GameControls';
import { CoupleDiceIntensityPicker } from '../../components/game/CoupleDiceIntensityPicker';
import {
  CoupleDicePromptCard,
  CoupleDiceSlots,
} from '../../components/game/CoupleDiceDisplay';
import { CoupleDiceSavedList } from '../../components/game/CoupleDiceSavedList';
import { COLORS } from '../../constants/theme';
import { useTranslation } from '../../lib/i18n';
import { useProfilesStore } from '../../lib/state/profiles';
import {
  DEFAULT_INTENSITY_RANGE,
  normalizeIntensityRange,
  rollDice,
  type DiceIntensity,
  type DiceRoll,
} from '../../lib/coupleDice';
import { useCoupleDiceStore } from '../../lib/state/coupleDice';

const ROLL_ANIMATION_TICKS = 6;
const ROLL_ANIMATION_TICK_MS = 90;

export default function CoupleDiceScreen() {
  const { t, language } = useTranslation();
  const activeProfileId = useProfilesStore((state) =>
    state.getActiveProfileId()
  );
  const diceLanguage = language === 'es' ? 'es' : 'en';

  const [intensityLevels, setIntensityLevels] = useState<DiceIntensity[]>(
    DEFAULT_INTENSITY_RANGE
  );
  const [roll, setRoll] = useState<DiceRoll | null>(null);
  const [rolling, setRolling] = useState(false);
  const [savedRollId, setSavedRollId] = useState<string | null>(null);
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const diceStore = useCoupleDiceStore();
  const savedRolls = activeProfileId ? diceStore.getSaved(activeProfileId) : [];

  const toggleIntensity = useCallback((level: DiceIntensity) => {
    setIntensityLevels((current) => {
      const next = current.includes(level)
        ? current.filter((item) => item !== level)
        : [...current, level].sort((a, b) => a - b);
      return next.length ? next : current;
    });
  }, []);

  const performRoll = useCallback(() => {
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }

    setRolling(true);
    setSavedRollId(null);
    Haptics.selectionAsync().catch(() => {});

    let ticks = 0;
    rollIntervalRef.current = setInterval(() => {
      ticks += 1;
      setRoll(
        rollDice({
          allowedIntensities: normalizeIntensityRange(intensityLevels),
          language: diceLanguage,
        })
      );

      if (ticks >= ROLL_ANIMATION_TICKS) {
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }
        setRolling(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    }, ROLL_ANIMATION_TICK_MS);
  }, [intensityLevels, diceLanguage]);

  const skipRoll = useCallback(() => {
    performRoll();
  }, [performRoll]);

  const saveRoll = useCallback(() => {
    if (!activeProfileId || !roll || rolling) return;
    diceStore.saveRoll(activeProfileId, roll);
    setSavedRollId(roll.prompt);
  }, [activeProfileId, roll, rolling, diceStore]);

  const deleteSaved = useCallback(
    (id: string) => {
      if (!activeProfileId) return;
      diceStore.deleteSaved(activeProfileId, id);
    },
    [activeProfileId, diceStore]
  );

  const moodLabel = roll ? t.coupleDice.moods[roll.mood] : '?';
  const actionLabel = roll ? t.coupleDice.actions[roll.action] : '?';
  const momentLabel = roll ? t.coupleDice.moments[roll.moment] : '?';

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title={t.coupleDice.title} subtitle={t.coupleDice.subtitle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <GameSurface elevated style={styles.setupCard}>
          <CoupleDiceIntensityPicker
            label={t.coupleDice.intensityLabel}
            selectedLevels={intensityLevels}
            onToggleLevel={toggleIntensity}
          />
        </GameSurface>

        <CoupleDiceSlots
          moodLabel={t.coupleDice.moodLabel}
          actionLabel={t.coupleDice.actionLabel}
          momentLabel={t.coupleDice.momentLabel}
          moodValue={moodLabel}
          actionValue={actionLabel}
          momentValue={momentLabel}
          rolling={rolling}
          rollingLabel={t.coupleDice.rolling}
        />

        {!roll ? (
          <GameButton label={t.coupleDice.roll} onPress={performRoll} />
        ) : (
          <CoupleDicePromptCard
            prompt={roll.prompt}
            safetyNote={t.coupleDice.safetyNote}
            rollAgainLabel={t.coupleDice.rollAgain}
            saveLabel={t.coupleDice.saveForLater}
            skipLabel={t.coupleDice.skip}
            savedConfirmationLabel={t.coupleDice.savedConfirmation}
            isSaved={savedRollId === roll.prompt}
            onRollAgain={performRoll}
            onSave={saveRoll}
            onSkip={skipRoll}
          />
        )}

        {activeProfileId ? (
          <CoupleDiceSavedList
            title={t.coupleDice.savedTitle}
            emptyLabel={t.coupleDice.savedEmpty}
            deleteLabel={t.coupleDice.delete}
            entries={savedRolls}
            onDelete={deleteSaved}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  setupCard: {
    padding: 16,
  },
});
