import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { useSettingsStore } from '../../src/stores/settingsStore';

const EMOJIS = ['💑', '❤️', '🔥', '✨', '🌹', '🥂', '🌙', '💫', '🦋', '🌺'];

interface ProfileScreenProps {
  onNext: () => void;
}

export default function ProfileScreen({ onNext }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const addProfile = useSettingsStore((state) => state.addProfile);
  const setActiveProfile = useSettingsStore((state) => state.setActiveProfile);
  
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    if (name.trim()) {
      const profile = addProfile({
        name: name.trim(),
        emoji: selectedEmoji,
      });
      setActiveProfile(profile.id);
      onNext();
    }
  };

  const isValid = name.trim().length >= 2;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.header}>Create Your Profile</Text>
        <Text style={styles.subheader}>
          This is how you'll appear to your partner
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
            <Text style={styles.emojiLabel}>Choose your avatar</Text>
            
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

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textMuted}
              maxLength={20}
              autoCapitalize="words"
            />
            <Text style={styles.inputHint}>
              This will be visible to your partner
            </Text>
          </View>
        </ScrollView>
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
          <View style={[styles.progressFill, { width: '80%' }]} />
        </View>
        <Pressable 
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
        >
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
    paddingHorizontal: SIZES.padding * 2,
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 3,
  },
  selectedEmoji: {
    fontSize: 80,
    marginBottom: SIZES.padding,
  },
  emojiLabel: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  inputSection: {
    marginBottom: SIZES.padding * 2,
  },
  inputLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.padding,
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
  inputHint: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.caption,
    color: COLORS.textMuted,
    marginTop: 8,
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
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
});
