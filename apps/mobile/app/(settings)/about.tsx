import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { BackHeader, SpiceSyncLogo } from '../../components/app-chrome';
import { COLORS } from '../../constants/theme';

const ROWS: { label: string; route: string }[] = [
  { label: 'Privacy Policy', route: '/(settings)/privacy-policy' },
  { label: 'Terms of Service', route: '/(settings)/terms-of-service' },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title="About" />

      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <SpiceSyncLogo width={258} height={96} />
          <View style={styles.versionPill}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          {ROWS.map(({ label, route }, index) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              onPress={() => router.push(route as never)}
              style={[
                styles.infoRow,
                index !== ROWS.length - 1 && styles.infoRowBorder,
              ]}
            >
              <Text style={styles.infoText}>{label}</Text>
              <ChevronRight size={18} color={COLORS.textMuted} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.madeWith}>Made with 🌶️ for curious couples</Text>
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
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 22,
  },
  logoBlock: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 20,
  },
  versionPill: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.cardAlt,
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.19)',
    overflow: 'hidden',
  },
  infoRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  infoText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  madeWith: {
    marginTop: 'auto',
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
