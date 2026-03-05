import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function GameComplete() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Card Completed!</Text>
        <Text style={styles.subtitle}>
          Great job completing the challenge
        </Text>

        <View style={styles.actions}>
          <Pressable 
            style={styles.button}
            onPress={() => router.push('/(game)/draw')}
          >
            <Text style={styles.buttonText}>Draw Another Card</Text>
          </Pressable>
          
          <Pressable 
            style={styles.secondaryButton}
            onPress={() => router.push('/(game)')}
          >
            <Text style={styles.secondaryButtonText}>Back to Game Hub</Text>
          </Pressable>
          
          <Pressable 
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/categories')}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  emoji: {
    fontSize: 80,
    marginBottom: SIZES.padding * 2,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding * 4,
  },
  actions: {
    width: '100%',
    gap: SIZES.padding,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
});
