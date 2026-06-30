import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Flame,
  Heart,
  Layers,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react-native';

import { CardAccentTop, SpiceSyncLogo } from '../../../components/app-chrome';
import {
  COLORS,
  GRADIENTS,
  SHADOWS,
  type GradientTuple,
} from '../../../constants/theme';
import { COMFORT_DECK_OPTIONS, useFilters } from '../../../lib/state/filters';

type ComfortChoice = {
  id: string;
  title: string;
  label: string;
  body: string;
  tier: (typeof COMFORT_DECK_OPTIONS)[number]['tier'];
  icon: LucideIcon;
  gradient: GradientTuple;
};

const CHOICE_STYLE: Record<
  string,
  { icon: LucideIcon; gradient: GradientTuple }
> = {
  soft: { icon: Heart, gradient: GRADIENTS.soft },
  naughty: { icon: Flame, gradient: GRADIENTS.naughty },
  xxx: { icon: ShieldAlert, gradient: GRADIENTS.xxx },
  all: { icon: Layers, gradient: GRADIENTS.primary },
};

const CHOICES: ComfortChoice[] = COMFORT_DECK_OPTIONS.map((choice) => ({
  ...choice,
  ...CHOICE_STYLE[choice.id],
}));

export default function ProfileComfortScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{
    from?: string;
    profileId?: string;
  }>();
  const { setTier, clearTier } = useFilters();
  const [selectedId, setSelectedId] = useState<string>('soft');
  const fromWelcome = from === 'welcome';

  const selected = useMemo(
    () => CHOICES.find((choice) => choice.id === selectedId) ?? CHOICES[0],
    [selectedId]
  );

  const continueToDeck = () => {
    if (selected.tier) {
      setTier(selected.tier);
    } else {
      clearTier();
    }

    router.replace('/(tabs)/deck');
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.logoHeader}>
          <SpiceSyncLogo width={220} height={82} />
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>STARTING INTENSITY</Text>
          <Text style={styles.title}>Pick your first deck</Text>
          <Text style={styles.subtitle}>
            Choose the intensity that should appear when you start swiping.
          </Text>
        </View>

        <View style={styles.choiceList}>
          {CHOICES.map((choice) => {
            const active = choice.id === selected.id;
            const Icon = choice.icon;

            return (
              <Pressable
                key={choice.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setSelectedId(choice.id)}
                style={[styles.choiceCard, active && styles.choiceCardActive]}
              >
                <CardAccentTop />
                <View style={styles.choiceInner}>
                  <LinearGradient
                    colors={choice.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.choiceIcon}
                  >
                    <Icon
                      size={19}
                      color={COLORS.textPrimary}
                      strokeWidth={2.5}
                    />
                  </LinearGradient>

                  <View style={styles.choiceCopy}>
                    <View style={styles.choiceTitleRow}>
                      <Text style={styles.choiceTitle}>{choice.title}</Text>
                      <Text style={styles.choiceLabel}>{choice.label}</Text>
                    </View>
                    <Text style={styles.choiceBody}>{choice.body}</Text>
                  </View>

                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.primaryPress}
          onPress={continueToDeck}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>
              {fromWelcome ? 'Start Swiping' : 'Save Preference'}
            </Text>
          </LinearGradient>
        </Pressable>
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 18,
  },
  logoHeader: {
    alignItems: 'center',
  },
  heroCopy: {
    gap: 7,
  },
  eyebrow: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
  },
  choiceList: {
    gap: 12,
  },
  choiceCard: {
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    overflow: 'hidden',
  },
  choiceCardActive: {
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  choiceInner: {
    minHeight: 104,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  choiceIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCopy: {
    flex: 1,
    gap: 6,
  },
  choiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  choiceTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  choiceLabel: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  choiceBody: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: COLORS.pink,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.pink,
  },
  primaryPress: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 'auto',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
});
