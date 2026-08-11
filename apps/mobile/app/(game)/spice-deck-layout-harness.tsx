import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { AppHeader, AppTabBar } from '../../components/app-chrome';
import { GameSetupPanel } from '../../components/game/GameSetupPanel';
import { SafeAreaView } from '../../components/SafeAreaView';
import { COLORS } from '../../constants/theme';
import type { GameCardType } from '../../data/gameCards';
import { useTranslation } from '../../lib/i18n';
import { useSettingsStore } from '../../src/stores/settingsStore';

const ALL_CARD_TYPES: readonly GameCardType[] = [
  'truth',
  'dare',
  'challenge',
  'fantasy',
  'roleplay',
];

const NOOP = () => undefined;

function MaximumContentLayoutHarness() {
  const { t, language } = useTranslation();
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  useEffect(() => {
    setLanguage('es');
  }, [setLanguage]);

  if (language !== 'es') return null;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <View style={styles.content}>
        <View
          collapsable={false}
          testID="game-layout-stage"
          style={styles.stage}
        >
          <GameSetupPanel
            gameNightLabel={t.game.gameNight.toUpperCase()}
            mode="normal"
            modeOptions={[
              { value: 'normal', label: t.game.gameModes.normal },
              { value: 'intense', label: t.game.gameModes.intense },
            ]}
            onModeChange={NOOP}
            playerCount={4}
            playerNames={['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4']}
            onPlayerCountChange={NOOP}
            onPlayerNameChange={NOOP}
            selectedLevels={[1, 2, 3]}
            onToggleLevel={NOOP}
            enabledTypes={ALL_CARD_TYPES}
            onToggleType={NOOP}
            drinkingMode={false}
            onDrinkingModeChange={NOOP}
            cardLanguage="es"
            onCardLanguageChange={NOOP}
            customCardsAvailable
            customDeckMode="include"
            onCustomDeckModeChange={NOOP}
            onOpenCustomDeck={NOOP}
            startLabel={t.game.startPlaying}
            onStart={NOOP}
            startDisabled={false}
          />
        </View>
      </View>

      <View collapsable={false} testID="game-layout-tab-bar">
        <AppTabBar active="game" />
      </View>
    </SafeAreaView>
  );
}

export default function SpiceDeckLayoutHarnessScreen() {
  if (process.env.EXPO_PUBLIC_LAYOUT_E2E !== '1') {
    return <Redirect href="/(game)/spice-deck" />;
  }

  return <MaximumContentLayoutHarness />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 9,
  },
  stage: {
    flex: 1,
  },
});
