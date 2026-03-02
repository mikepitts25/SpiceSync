import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../lib/i18n';

type Props = {
  onReset: () => void;
  onViewMatches: () => void;
};

export default function EndOfDeck({ onReset, onViewMatches }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.title}>{t.deck.endOfDeck}</Text>
      <Text style={styles.subtitle}>
        {t.deck.endOfDeckDesc}
      </Text>

      <Pressable
        style={[styles.button, styles.secondary]}
        accessibilityRole="button"
        onPress={onReset}
      >
        <Text style={[styles.buttonLabel, styles.secondaryLabel]}>
          {t.deck.resetCategory}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.primary]}
        accessibilityRole="button"
        onPress={onViewMatches}
      >
        <Text style={[styles.buttonLabel, styles.primaryLabel]}>
          {t.deck.viewMatches}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#0b0f14',
    gap: 16,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: { color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  button: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonLabel: { fontWeight: '700', fontSize: 16 },
  secondary: {
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: 'transparent',
  },
  secondaryLabel: { color: '#e2e8f0' },
  primary: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryLabel: { color: 'white' },
});
