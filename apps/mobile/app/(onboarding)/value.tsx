import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';

interface ValuePropScreenProps {
  onNext: () => void;
}

const VALUES = [
  {
    emoji: '💕',
    title: 'Swipe Together',
    description: 'Discover what you both enjoy in a fun, private way.',
  },
  {
    emoji: '🔒',
    title: 'Privacy First',
    description: 'Your data stays on your device. Always.',
  },
  {
    emoji: '✨',
    title: 'Match & Connect',
    description: 'Find new experiences you both want to try.',
  },
];

export default function ValuePropScreen({ onNext }: ValuePropScreenProps) {
  const insets = useSafeAreaInsets();
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
        <Text style={styles.header}>Welcome to SpiceSync</Text>
        <Text style={styles.subheader}>
          The most private way for couples to explore together
        </Text>

        <View style={styles.valuesList}>
          {VALUES.map((value, index) => (
            <View key={index} style={styles.valueCard}>
              <Text style={styles.valueEmoji}>{value.emoji}</Text>
              <View style={styles.valueText}>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.footer, 
          { 
            opacity: fadeAnim,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '40%' }]} />
        </View>
        <Pressable style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
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
    padding: SIZES.padding * 2,
    paddingTop: 40,
  },
  header: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  subheader: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 3,
  },
  valuesList: {
    gap: SIZES.padding * 1.5,
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  valueEmoji: {
    fontSize: 40,
    marginRight: SIZES.padding,
  },
  valueText: {
    flex: 1,
  },
  valueTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 4,
  },
  valueDescription: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: SIZES.padding * 2,
    paddingTop: 0,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SIZES.padding * 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
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
});
