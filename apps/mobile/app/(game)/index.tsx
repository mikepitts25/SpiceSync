import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { SafeAreaView } from '../../components/SafeAreaView';
import { AppHeader, AppTabBar } from '../../components/app-chrome';
import { GameHubCard } from '../../components/game/GameHubCard';
import { COLORS, SPACING } from '../../constants/theme';
import { useTranslation } from '../../lib/i18n';
import { GAME_HUB_MODES } from '../../lib/gameHubModes';
import { usePremiumStore } from '../../src/stores/premium';
import { hasPremiumFeatureAccess } from '../../lib/purchases/access';
import { isPremiumGameMode } from '../../lib/purchases/premiumPolicy';

export default function GameHub() {
  const router = useRouter();
  const { t } = useTranslation();
  const locallyEntitled = usePremiumStore((state) => state.isPremium());
  const isPremium = hasPremiumFeatureAccess(locallyEntitled);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>{t.game.title}</Text>
          <Text style={styles.subtitle}>{t.game.moreWaysToPlay}</Text>
        </View>
        <View style={styles.cards}>
          {GAME_HUB_MODES.map((mode) => {
            const locked = isPremiumGameMode(mode.id) && !isPremium;
            return (
              <GameHubCard
                key={mode.id}
                title={t.game[mode.titleKey]}
                description={t.game[mode.descriptionKey]}
                icon={mode.icon}
                featured={mode.id === 'spice-deck'}
                available={mode.available}
                statusLabel={locked ? 'Premium' : t.game.playNow}
                onPress={() => router.push(locked ? '/(unlock)' : mode.route)}
              />
            );
          })}
        </View>
      </ScrollView>
      <AppTabBar active="game" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: SPACING.screenX,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 22,
  },
  heading: {
    gap: 5,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: COLORS.textSub,
    fontSize: 17,
    fontWeight: '700',
  },
  cards: {
    gap: 12,
  },
});
