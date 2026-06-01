import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import EmojiMenu from '../../../components/EmojiMenu';
import ProfileAvatarIcon from '../../../components/ProfileAvatarIcon';
import {
  BackHeader,
  CardAccentTop,
  SpiceSyncLogo,
} from '../../../components/app-chrome';
import { EMOJI_CHOICES } from '../../../src/constants/emojis';
import {
  createProfile as createProfileAction,
  useProfilesStore,
} from '../../../lib/state/profiles';
import { COLORS, GRADIENTS, SHADOWS } from '../../../constants/theme';
import { getProfileCreatedDestination } from '../../../lib/welcome/routing';

const PIN_LENGTH = 4;

export default function NewProfileScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromWelcome = from === 'welcome';
  const profileCount = useProfilesStore((state) => state.getProfiles().length);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string>(EMOJI_CHOICES[0]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const requiresPin = profileCount === 1;
  const [pinEnabled, setPinEnabled] = useState(requiresPin);

  const emojiLabel = useMemo(() => emoji || EMOJI_CHOICES[0], [emoji]);

  const onSelectEmoji = (value: string) => {
    setEmoji(value);
    setMenuVisible(false);
  };

  const onPinChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    if (confirmPin && confirmPin !== digits) {
      setPinError('PINs do not match');
    } else {
      setPinError(null);
    }
  };

  const onConfirmPinChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setConfirmPin(digits);
    if (pin && digits !== pin) {
      setPinError('PINs do not match');
    } else {
      setPinError(null);
    }
  };

  const pinActive = requiresPin || pinEnabled;
  const pinValid =
    !pinActive ||
    (pin.length === PIN_LENGTH && confirmPin === pin && !pinError);
  const nameValid = name.trim().length > 0;
  const canSubmit = nameValid && pinValid && !isSaving;

  const togglePin = () => {
    if (requiresPin) return;
    setPinEnabled((prev) => {
      const next = !prev;
      if (!next) {
        setPin('');
        setConfirmPin('');
        setPinError(null);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!canSubmit) return;

    try {
      setIsSaving(true);
      if (pinActive) {
        if (pin.length !== PIN_LENGTH) {
          setPinError('PIN must be 4 digits');
          setIsSaving(false);
          return;
        }
        if (pin !== confirmPin) {
          setPinError('PINs do not match');
          setIsSaving(false);
          return;
        }
      }

      const inputPin = pinActive ? pin : undefined;
      const profile = createProfileAction({
        name: name.trim(),
        emoji: emojiLabel,
        pin: inputPin,
      });
      if (fromWelcome) {
        const destination = getProfileCreatedDestination(
          fromWelcome,
          profile.id
        );
        router.replace(destination ?? '/(tabs)/deck');
      } else {
        router.back();
      }
    } catch (error) {
      console.error('create profile failed', error);
      const message =
        error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not create profile', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        {fromWelcome ? (
          <View style={styles.logoHeader}>
            <SpiceSyncLogo width={220} height={82} />
          </View>
        ) : (
          <BackHeader title="New Profile" />
        )}

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>PRIVATE PROFILE</Text>
            <Text style={styles.title}>Create your profile</Text>
            <Text style={styles.subtitle}>
              Choose how you appear locally before you start answering cards.
            </Text>
          </View>

          <View style={styles.formCard}>
            <CardAccentTop />
            <View style={styles.formInner}>
              <View style={styles.section}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter name"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <Text style={styles.hint}>Visible only inside this app.</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Avatar</Text>
                <Pressable
                  style={styles.emojiSelector}
                  onPress={() => setMenuVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Choose avatar"
                >
                  <ProfileAvatarIcon avatar={emojiLabel} size={48} />
                  <View style={styles.emojiCopy}>
                    <Text style={styles.emojiTitle}>Choose avatar</Text>
                    <Text style={styles.emojiHint}>Tap to change</Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.section}>
                <View style={styles.pinHeader}>
                  <Text style={styles.label}>
                    {requiresPin ? 'Set a 4-digit PIN' : 'PIN'}
                  </Text>
                  {!requiresPin ? (
                    <Pressable
                      style={styles.pinToggle}
                      onPress={togglePin}
                      accessibilityRole="button"
                    >
                      <Text style={styles.pinToggleText}>
                        {pinEnabled ? 'Remove PIN' : 'Optional'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {pinActive ? (
                  <View style={styles.pinFields}>
                    <TextInput
                      style={styles.pinInput}
                      value={pin}
                      onChangeText={onPinChange}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={PIN_LENGTH}
                      placeholder="0000"
                      placeholderTextColor={COLORS.textMuted}
                    />

                    <TextInput
                      style={styles.pinInput}
                      value={confirmPin}
                      onChangeText={onConfirmPinChange}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={PIN_LENGTH}
                      placeholder="0000"
                      placeholderTextColor={COLORS.textMuted}
                    />
                    <Text style={styles.hint}>
                      Digits only. You need this PIN to switch profiles.
                    </Text>
                    {pinError ? (
                      <Text style={styles.error}>{pinError}</Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.hint}>
                    Keep this profile open, or add a PIN later.
                  </Text>
                )}
              </View>
            </View>
          </View>

          <Pressable
            style={[
              styles.primaryPress,
              (!canSubmit || isSaving) && styles.primaryDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSubmit}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryText}>
                {requiresPin ? 'Create Profile & Set PIN' : 'Create Profile'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <EmojiMenu
        visible={menuVisible}
        selected={emojiLabel}
        onSelect={onSelectEmoji}
        onClose={() => setMenuVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.bg },
  logoHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  heroCopy: {
    gap: 6,
  },
  eyebrow: {
    color: COLORS.pink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  formInner: {
    padding: 16,
    gap: 18,
  },
  section: { gap: 12 },
  label: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  emojiSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emojiCopy: {
    gap: 3,
  },
  emojiTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  emojiHint: { color: COLORS.textSub, fontSize: 12, fontWeight: '600' },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pinToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(194,24,91,0.12)',
  },
  pinToggleText: { color: COLORS.pink, fontWeight: '800', fontSize: 12 },
  pinFields: { gap: 12 },
  pinInput: {
    backgroundColor: COLORS.cardAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 24,
    letterSpacing: 12,
    textAlign: 'center',
  },
  hint: { color: COLORS.textSub, fontSize: 12, lineHeight: 18 },
  error: { color: COLORS.no, fontWeight: '800', fontSize: 12 },
  primaryPress: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  primaryDisabled: { opacity: 0.4 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 15 },
});
