// apps/mobile/app/(deck)/DeckScreen.tsx
// Legacy route kept for compatibility. Redirect to the canonical tab deck.

import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function DeckScreen() {
  const router = useRouter();

  useEffect(() => {
    // Replace to avoid stacking legacy route in history.
    router.replace('/(tabs)/deck');
  }, [router]);

  return <View style={{ flex: 1, backgroundColor: '#0b0f14' }} />;
}
