import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Check } from 'lucide-react-native';

import { AccentBar, BackHeader } from '../../components/app-chrome';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useTranslation } from '../../lib/i18n';
import { COLORS, GRADIENTS } from '../../constants/theme';

const OPTIONS = [
  {
    code: 'en' as const,
    flag: '🇺🇸',
    nameKey: 'english' as const,
    native: 'English',
  },
  {
    code: 'es' as const,
    flag: '🇪🇸',
    nameKey: 'spanishName' as const,
    native: 'Español',
  },
];

export default function LanguageScreen() {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const { t } = useTranslation();

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title={t.settings.language} />

      <View style={styles.content}>
        {OPTIONS.map((option) => {
          const active = option.code === language;
          return (
            <Pressable
              key={option.code}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setLanguage(option.code)}
              style={[styles.optionCard, active && styles.optionCardActive]}
            >
              {active ? <AccentBar style={styles.leftAccent} /> : null}
              <Text style={styles.flag}>{option.flag}</Text>
              <View style={styles.optionCopy}>
                <Text style={styles.optionName}>
                  {t.settings[option.nameKey]}
                </Text>
                <Text style={styles.optionNative}>{option.native}</Text>
              </View>
              {active ? (
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.checkBadge}
                >
                  <Check size={17} color={COLORS.textPrimary} />
                </LinearGradient>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  optionCard: {
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  optionCardActive: {
    borderColor: COLORS.border,
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    height: '100%',
    borderRadius: 0,
  },
  flag: {
    fontSize: 28,
  },
  optionCopy: {
    flex: 1,
  },
  optionName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  optionNative: {
    color: COLORS.textSub,
    fontSize: 16,
    marginTop: 3,
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
