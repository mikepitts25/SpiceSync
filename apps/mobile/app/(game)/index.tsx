import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { RefreshCw, Share2, Timer, X } from 'lucide-react-native';

import {
  AccentBar,
  ActionCircle,
  AppHeader,
  AppTabBar,
  CardAccentTop,
  IntensityDots,
} from '../../components/app-chrome';
import { ScreenTour } from '../../components/ScreenTour';
import { type GameCard, getCardsByLanguage } from '../../data/gameCards';
import { interpolate, useTranslation } from '../../lib/i18n';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { COLORS, GRADIENTS, RADII, SHADOWS } from '../../constants/theme';

function pickRandom(cards: GameCard[]) {
  if (!cards.length) return null;
  return cards[Math.floor(Math.random() * cards.length)];
}

export default function GameHub() {
  const { t } = useTranslation();
  const unlocked = useSettingsStore((state) => state.unlocked);
  const language = useSettingsStore((state) => state.language);
  const [selectedLevel, setSelectedLevel] = useState(2);
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null);
  const [drawCount, setDrawCount] = useState(1);

  const cards = useMemo(
    () => getCardsByLanguage(language, unlocked),
    [language, unlocked]
  );

  const levelCards = useMemo(() => {
    const exact = cards.filter((card) => card.intensity === selectedLevel);
    return exact.length ? exact : cards;
  }, [cards, selectedLevel]);

  useEffect(() => {
    setCurrentCard(pickRandom(levelCards));
    setDrawCount(1);
  }, [levelCards]);

  const drawCard = useCallback(() => {
    setCurrentCard(pickRandom(levelCards));
    setDrawCount((count) =>
      Math.min(count + 1, Math.max(levelCards.length, 1))
    );
  }, [levelCards]);

  const handleShare = useCallback(async () => {
    if (!currentCard) return;
    try {
      await Share.share({
        message: interpolate(t.game.shareMessage, {
          content: currentCard.content,
        }),
      });
    } catch {
      // Native share cancellation does not need UI.
    }
  }, [currentCard, t.game.shareMessage]);

  const typeLabel = currentCard?.type
    ? t.game[currentCard.type].toUpperCase()
    : t.game.fallbackType.toUpperCase();

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <View style={styles.content}>
        <ScreenTour
          screenId="game"
          screenLabel={t.tabs.game}
          steps={t.tours.game}
        />

        <View style={styles.headingRow}>
          <Text style={styles.heading}>{t.game.gameNight.toUpperCase()}</Text>
          <Text style={styles.levelCopy}>
            {interpolate(t.game.levelOf, { level: selectedLevel })}
          </Text>
        </View>

        <View style={styles.levelRow}>
          {[1, 2, 3, 4, 5].map((level) => {
            const active = selectedLevel === level;
            return (
              <Pressable
                key={level}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedLevel(level)}
                style={styles.levelPress}
              >
                {active ? (
                  <LinearGradient
                    colors={GRADIENTS.primary}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.levelActive}
                  >
                    <Text style={styles.levelActiveText}>
                      {interpolate(t.game.levelShort, { level })}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.levelInactive}>
                    <Text style={styles.levelInactiveText}>
                      {interpolate(t.game.levelShort, { level })}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.gameCard}>
          <CardAccentTop />
          <View style={styles.cardInner}>
            <View style={styles.cardTopRow}>
              <Text style={styles.categoryLabel}>{typeLabel}</Text>
              <IntensityDots value={selectedLevel} max={5} />
            </View>
            <AccentBar />

            <Text style={styles.cardTitle}>
              {currentCard
                ? titleForCard(currentCard, t.game.titles)
                : t.game.titles.truth}
            </Text>
            <Text style={styles.cardBody}>
              {currentCard?.content ?? t.game.drawToBegin}
            </Text>

            <View style={styles.timerBadge}>
              <Timer size={14} color={COLORS.maybe} />
              <Text style={styles.timerText}>
                {currentCard?.estimatedTime &&
                currentCard.estimatedTime !== 'N/A'
                  ? currentCard.estimatedTime
                  : t.game.noTimeLimit}
              </Text>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                {interpolate(t.game.cardOf, {
                  current: Math.min(drawCount, Math.max(levelCards.length, 1)),
                  total: Math.max(levelCards.length, 1),
                })}
              </Text>
              <Text style={styles.footerText}>
                {interpolate(t.game.levelWithLabel, {
                  level: selectedLevel,
                  label: t.game.levels[selectedLevel - 1],
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <ActionCircle
            label={t.game.skip.toUpperCase()}
            icon={X}
            color={COLORS.no}
            onPress={drawCard}
          />
          <ActionCircle
            label={t.game.draw.toUpperCase()}
            icon={RefreshCw}
            variant="gradient"
            color={COLORS.pink}
            size={66}
            iconSize={28}
            onPress={drawCard}
          />
          <ActionCircle
            label={t.game.share.toUpperCase()}
            icon={Share2}
            color={COLORS.maybe}
            onPress={handleShare}
          />
        </View>
      </View>

      <AppTabBar active="game" />
    </SafeAreaView>
  );
}

function titleForCard(
  card: GameCard,
  titles: ReturnType<typeof useTranslation>['t']['game']['titles']
) {
  switch (card.type) {
    case 'truth':
      return titles.truth;
    case 'dare':
      return titles.dare;
    case 'challenge':
      return titles.challenge;
    case 'fantasy':
      return titles.fantasy;
    case 'roleplay':
      return titles.roleplay;
    default:
      return titles.fallback;
  }
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
    gap: 12,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  levelCopy: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelPress: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  levelActive: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  levelActiveText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  levelInactive: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  levelInactiveText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  gameCard: {
    flex: 1,
    borderRadius: RADII.card,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLabel: {
    color: COLORS.pink,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '800',
  },
  cardBody: {
    flex: 1,
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 20,
  },
  timerBadge: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    color: COLORS.textSub,
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
});
