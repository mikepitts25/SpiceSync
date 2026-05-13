import React, { useMemo, useState } from 'react';
import {
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
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyRound, LockKeyhole } from 'lucide-react-native';

import { BackHeader, CardAccentTop } from '../../../components/app-chrome';
import { useProfilesStore } from '../../../lib/state/profiles';
import {
  getProfilePinActionLabel,
  validatePinUpdate,
} from '../../../lib/profile-management';
import { COLORS, GRADIENTS, SHADOWS } from '../../../constants/theme';

const PIN_LENGTH = 4;

function toPinDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, PIN_LENGTH);
}

export default function ProfilePinScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();
  const profiles = useProfilesStore((state) => state.profiles);
  const setPin = useProfilesStore((state) => state.setPin);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const profile = useMemo(
    () => profiles.find((item) => item.id === profileId) ?? null,
    [profileId, profiles]
  );

  if (!profile) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" />
        <BackHeader title="Profile PIN" />
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>Profile not found</Text>
          <Text style={styles.missingCopy}>
            This profile may have already been deleted.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasExistingPin = !!profile.pin;
  const title = getProfilePinActionLabel(hasExistingPin);
  const canSave =
    (!hasExistingPin || currentPin.length === PIN_LENGTH) &&
    newPin.length === PIN_LENGTH &&
    confirmPin.length === PIN_LENGTH;

  const savePin = () => {
    const result = validatePinUpdate({
      currentPin,
      newPin,
      confirmPin,
      existingPin: profile.pin,
    });

    if (!result.ok) {
      setPinError(result.error);
      return;
    }

    setPin(profile.id, newPin);
    router.back();
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
        <StatusBar style="light" />
        <BackHeader
          title={title}
          subtitle={profile.displayName ?? profile.name}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <CardAccentTop />
            <View style={styles.formInner}>
              <View style={styles.iconHeader}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.iconBubble}
                >
                  {hasExistingPin ? (
                    <LockKeyhole size={26} color={COLORS.textPrimary} />
                  ) : (
                    <KeyRound size={26} color={COLORS.textPrimary} />
                  )}
                </LinearGradient>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.subtitle}>
                    {hasExistingPin
                      ? 'Enter the current PIN, then choose a new 4-digit PIN.'
                      : 'Choose a 4-digit PIN for switching to this profile.'}
                  </Text>
                </View>
              </View>

              {hasExistingPin ? (
                <View style={styles.section}>
                  <Text style={styles.label}>Current PIN</Text>
                  <TextInput
                    style={styles.pinInput}
                    value={currentPin}
                    onChangeText={(value) => {
                      setCurrentPin(toPinDigits(value));
                      setPinError(null);
                    }}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={PIN_LENGTH}
                    placeholder="0000"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.label}>New PIN</Text>
                <TextInput
                  style={styles.pinInput}
                  value={newPin}
                  onChangeText={(value) => {
                    setNewPin(toPinDigits(value));
                    setPinError(null);
                  }}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={PIN_LENGTH}
                  placeholder="0000"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Confirm PIN</Text>
                <TextInput
                  style={styles.pinInput}
                  value={confirmPin}
                  onChangeText={(value) => {
                    setConfirmPin(toPinDigits(value));
                    setPinError(null);
                  }}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={PIN_LENGTH}
                  placeholder="0000"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              {pinError ? <Text style={styles.error}>{pinError}</Text> : null}
            </View>
          </View>

          <Pressable
            style={[styles.primaryPress, !canSave && styles.primaryDisabled]}
            onPress={savePin}
            disabled={!canSave}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryText}>Save PIN</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 16,
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
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 5,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 19,
  },
  section: { gap: 12 },
  label: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
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
  error: {
    color: COLORS.no,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
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
  missingState: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  missingTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  missingCopy: {
    color: COLORS.textSub,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
