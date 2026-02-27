import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { usePartnerStore } from '../../src/stores/partner';
import { useSettingsStore } from '../../src/stores/settingsStore';

const EMOJIS = ['💑', '❤️', '🔥', '✨', '🌹', '🥂', '🌙', '💫'];

export default function PartnerConnect() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { code: incomingCode } = useLocalSearchParams<{ code?: string }>();
  
  const { partner, acceptInvite, hasPartner } = usePartnerStore();
  const addProfile = useSettingsStore((state) => state.addProfile);
  const setActiveProfile = useSettingsStore((state) => state.setActiveProfile);
  
  const [code, setCode] = useState(incomingCode || '');
  const [partnerName, setPartnerName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [isConnecting, setIsConnecting] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // If already has partner, redirect
    if (hasPartner()) {
      router.replace('/(tabs)');
    }
  }, []);

  const handleConnect = async () => {
    if (!code.trim() || !partnerName.trim()) {
      Alert.alert('Missing Info', 'Please enter the invite code and your partner\'s name');
      return;
    }
    
    setIsConnecting(true);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = acceptInvite(code.trim().toUpperCase(), {
      name: partnerName.trim(),
      emoji: selectedEmoji,
    });
    
    if (success) {
      // Also add partner as a profile
      const profile = addProfile({
        name: partnerName.trim(),
        emoji: selectedEmoji,
      });
      setActiveProfile(profile.id);
      
      Alert.alert(
        'Connected! 💕',
        `You're now connected with ${partnerName}!`,
        [
          { 
            text: 'Start Exploring', 
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } else {
      Alert.alert('Invalid Code', 'The invite code is invalid or has expired.');
    }
    
    setIsConnecting(false);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip for Now?',
      'You can connect with a partner later from settings. Some features work best with a partner connected.',
      [
        { text: 'Go Back', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: () => router.replace('/(tabs)'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>💕</Text>
          <Text style={styles.title}>Connect with Your Partner</Text>
          <Text style={styles.subtitle}>
            Enter the invite code they shared with you
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Invite Code</Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            placeholder="XXX-XXX"
            placeholderTextColor={COLORS.textMuted}
            maxLength={7}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {/* Partner Info */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Partner's Name</Text>
          <TextInput
            style={styles.input}
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder="Enter their name"
            placeholderTextColor={COLORS.textMuted}
            maxLength={20}
            autoCapitalize="words"
          />
        </View>

        {/* Emoji Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Their Avatar</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={[
                  styles.emojiButton,
                  selectedEmoji === emoji && styles.emojiButtonSelected,
                ]}
                onPress={() => setSelectedEmoji(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoEmoji}>🔒</Text>
          <Text style={styles.infoText}>
            Your connection is private. Only you and your partner can see each other's activity.
          </Text>
        </View>
      </Animated.View>

      {/* Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable 
          style={[
            styles.connectButton,
            (!code.trim() || !partnerName.trim() || isConnecting) && styles.buttonDisabled,
          ]}
          onPress={handleConnect}
          disabled={!code.trim() || !partnerName.trim() || isConnecting}
        >
          <Text style={styles.connectButtonText}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Text>
        </Pressable>
        
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
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
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 3,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SIZES.padding,
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
  },
  inputSection: {
    marginBottom: SIZES.padding * 2,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  codeInput: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    color: COLORS.text,
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    textAlign: 'center',
    letterSpacing: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  emojiButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  emojiText: {
    fontSize: 28,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SIZES.padding,
  },
  infoEmoji: {
    fontSize: 24,
    marginRight: SIZES.padding,
  },
  infoText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: SIZES.padding * 2,
    paddingTop: 0,
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  connectButtonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
  },
  skipText: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
});
