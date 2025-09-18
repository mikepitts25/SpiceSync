// apps/mobile/app/(tabs)/settings.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View>
        <Text style={styles.h1}>Settings</Text>
        <Text style={styles.p}>Lock, language, theme, and more.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#0b0f14' },
  h1: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 8 },
  p: { color: '#94a3b8' },
});
