import React, { useEffect, useMemo, useState } from 'react';
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
import { SafeAreaView } from '../../../components/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import EmojiMenu from '../../../components/EmojiMenu';
import ProfileAvatarIcon from '../../../components/ProfileAvatarIcon';
import { BackHeader, CardAccentTop } from '../../../components/app-chrome';
import { EMOJI_CHOICES } from '../../../src/constants/emojis';
import { useProfilesStore } from '../../../lib/state/profiles';
import { COLORS, GRADIENTS, SHADOWS } from '../../../constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId?: string }>();
  const profiles = useProfilesStore((state) => state.profiles);
  const updateProfile = useProfilesStore((state) => state.updateProfile);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string>(EMOJI_CHOICES[0]);
  const [menuVisible, setMenuVisible] = useState(false);

  const profile = useMemo(
    () => profiles.find((item) => item.id === profileId) ?? null,
    [profileId, profiles]
  );

  useEffect(() => {
    if (!profile) return;
    setName(profile.displayName ?? profile.name);
    setEmoji(profile.emoji);
  }, [profile]);

  const trimmedName = name.trim();
  const canSave = !!profile && trimmedName.length > 0;

  const saveProfile = () => {
    if (!profile || !canSave) return;

    try {
      updateProfile(profile.id, {
        name: trimmedName,
        emoji,
      });
      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not update profile', message);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <StatusBar style="light" />
        <BackHeader title="Edit Profile" />
        <View style={styles.missingState}>
          <Text style={styles.missingTitle}>Profile not found</Text>
          <Text style={styles.missingCopy}>
            This profile may have already been deleted.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          title="Edit Profile"
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
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Avatar</Text>
                <Pressable
                  style={styles.emojiSelector}
                  onPress={() => setMenuVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Choose avatar"
                >
                  <ProfileAvatarIcon avatar={emoji} size={48} />
                  <View style={styles.emojiCopy}>
                    <Text style={styles.emojiTitle}>Choose avatar</Text>
                    <Text style={styles.emojiHint}>Tap to change</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.primaryPress, !canSave && styles.primaryDisabled]}
            onPress={saveProfile}
            disabled={!canSave}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryText}>Save Profile</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <EmojiMenu
        visible={menuVisible}
        selected={emoji}
        onSelect={(value) => {
          setEmoji(value);
          setMenuVisible(false);
        }}
        onClose={() => setMenuVisible(false)}
      />
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
  section: { gap: 12 },
  label: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 16,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emojiCopy: {
    gap: 3,
  },
  emojiTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  emojiHint: { color: COLORS.textSub, fontSize: 16, fontWeight: '600' },
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
  primaryText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 16 },
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
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
});
