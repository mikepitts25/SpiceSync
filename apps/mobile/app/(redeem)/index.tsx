import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { usePremiumStore } from '../../src/stores/premium';
import { GIFT_CONSTANTS } from '../../lib/pricing';

export default function RedeemScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { code: paramCode } = useLocalSearchParams<{ code?: string }>();
  
  const { redeemGiftCode, validateGiftCode, isPremium } = usePremiumStore();
  
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  
  // Auto-fill code from URL parameter
  useEffect(() => {
    if (paramCode) {
      setCode(paramCode.toUpperCase());
    }
  }, [paramCode]);

  const handleRedeem = async () => {
    const trimmedCode = code.trim().toUpperCase();
    
    if (!trimmedCode) {
      Alert.alert('Enter a Code', 'Please enter a gift code to redeem.');
      return;
    }
    
    if (!validateGiftCode(trimmedCode)) {
      Alert.alert(
        'Invalid Code', 
        `Gift codes should start with ${GIFT_CONSTANTS.CODE_PREFIX} and be ${GIFT_CONSTANTS.CODE_LENGTH + GIFT_CONSTANTS.CODE_PREFIX.length} characters long.`
      );
      return;
    }
    
    setIsRedeeming(true);
    
    try {
      const success = await redeemGiftCode(trimmedCode);
      
      if (success) {
        setRedeemed(true);
      } else {
        Alert.alert('Invalid Code', 'This gift code is invalid or has already been redeemed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  // If already premium, show message
  if (isPremium() && !redeemed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Already Premium</Text>
          <Text style={styles.message}>
            You already have Premium access! You can share this gift code with someone else.
          </Text>
          <Pressable style={styles.button} onPress={handleGoHome}>
            <Text style={styles.buttonText}>Go Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Success state
  if (redeemed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
          <Text style={styles.title}>Welcome to Premium!</Text>
          <Text style={styles.message}>
            Your gift code has been redeemed successfully. You now have lifetime access to all premium features!
          </Text>
          
          <View style={styles.featuresList}>
            <Text style={styles.featuresTitle}>You now have:</Text>
            {[
              'All premium activities',
              'All 3 activity packs',
              'Unlimited profiles',
              'Advanced insights',
              'Custom activities',
            ].map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          
          <Pressable style={[styles.button, styles.successButton]} onPress={handleGoHome}>
            <Text style={styles.buttonText}>Start Exploring</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.emoji}>🎁</Text>
        <Text style={styles.title}>Redeem Gift</Text>
        <Text style={styles.subtitle}>
          Enter your gift code to unlock SpiceSync Premium
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Gift Code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            placeholder={`${GIFT_CONSTANTS.CODE_PREFIX}XXXXXX`}
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            editable={!isRedeeming}
          />
          <Text style={styles.inputHint}>
            Codes start with {GIFT_CONSTANTS.CODE_PREFIX}
          </Text>
        </View>

        <Pressable 
          style={[styles.button, isRedeeming && styles.buttonDisabled]}
          onPress={handleRedeem}
          disabled={isRedeeming}
        >
          {isRedeeming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Redeem Gift</Text>
          )}
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={handleGoHome}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What is this?</Text>
          <Text style={styles.infoText}>
            Someone purchased SpiceSync Premium as a gift for you. Enter the code they 
            shared to unlock lifetime access to all premium features and activity packs.
          </Text>
        </View>
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: SIZES.padding * 2,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 3,
  },
  inputContainer: {
    width: '100%',
    marginBottom: SIZES.padding * 2,
  },
  inputLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding / 2,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  inputHint: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SIZES.padding / 2,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    paddingHorizontal: SIZES.padding * 3,
    borderRadius: SIZES.radius,
    width: '100%',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  successButton: {
    backgroundColor: COLORS.success,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: SIZES.padding,
  },
  cancelText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  infoSection: {
    marginTop: SIZES.padding * 3,
    padding: SIZES.padding * 1.5,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    width: '100%',
  },
  infoTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding / 2,
  },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  successEmoji: {
    fontSize: 48,
  },
  message: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
    lineHeight: 22,
  },
  featuresList: {
    width: '100%',
    backgroundColor: COLORS.card,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding * 2,
  },
  featuresTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureCheck: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: 'bold',
    marginRight: 12,
  },
  featureText: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
});
