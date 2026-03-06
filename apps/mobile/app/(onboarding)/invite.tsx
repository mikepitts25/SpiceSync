import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface InviteScreenProps {
  onComplete: () => void;
}

// Generate a simple invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

export default function InviteScreen({ onComplete }: InviteScreenProps) {
  const insets = useSafeAreaInsets();
  const [inviteCode] = React.useState(generateInviteCode);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on SpiceSync! Use code: ${inviteCode}\n\nDownload the app and enter this code to connect.`,
        title: 'Join me on SpiceSync',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.emoji}>📲</Text>
        <Text style={styles.header}>Invite Your Partner</Text>
        <Text style={styles.subheader}>
          Share this code with your partner to connect
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Invite Code</Text>
          <Text style={styles.codeValue}>{inviteCode}</Text>
          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share Code</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.infoSteps}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>
                Share the code with your partner
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>
                They download SpiceSync and enter the code
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>
                Start discovering together!
              </Text>
            </View>
          </View>
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
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Pressable style={styles.button} onPress={onComplete}>
          <Text style={styles.buttonText}>Start Exploring</Text>
        </Pressable>
        <Pressable style={styles.skipButton} onPress={onComplete}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
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
    paddingHorizontal: SIZES.padding * 2,
    paddingTop: 40,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: SIZES.padding,
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
  codeCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.padding * 2,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding * 2,
  },
  codeLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  codeValue: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    color: COLORS.primary,
    letterSpacing: 4,
    marginBottom: SIZES.padding * 1.5,
  },
  shareButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  shareButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  infoSteps: {
    gap: SIZES.padding,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 28,
    marginRight: SIZES.padding,
  },
  stepText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: SIZES.padding * 2,
    paddingTop: 0,
    width: '100%',
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
    marginBottom: SIZES.padding,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
  },
  skipButtonText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
});
