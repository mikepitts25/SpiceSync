// apps/mobile/app/(tabs)/matches.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';

export default function MatchesScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View>
        <Text style={styles.h1}>Matches</Text>
        <Text style={styles.p}>Your mutual YES items will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: '#0b0f14' },
  h1: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 8 },
  p: { color: '#94a3b8' },
});
