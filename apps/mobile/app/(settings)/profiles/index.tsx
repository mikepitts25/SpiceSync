import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  ToastAndroid,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Users,
  Plus,
  Lock,
  Trash2,
  X,
  ChevronLeft,
  Check,
} from 'lucide-react-native';

import {
  setActiveProfile,
  useProfilesStore,
  type Profile,
} from '../../../lib/state/profiles';
import { useTranslation, interpolate } from '../../../lib/i18n';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../../constants/theme';

type PinModalState = {
  id: string;
  name: string;
  pin: string;
} | null;

type SetPinModalState = {
  id: string;
  name: string;
  hasPin: boolean;
} | null;

export default function ProfilesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profiles, activeProfileId, updateProfile, deleteProfile, verifyPin, setPin, clearPin } =
    useProfilesStore();

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );

  const [pinPrompt, setPinPrompt] = useState<PinModalState>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [addPinModal, setAddPinModal] = useState<SetPinModalState>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [addPinError, setAddPinError] = useState<string | null>(null);
  const [addPinStep, setAddPinStep] = useState<'new' | 'confirm'>('new');

  const notifySwitch = (name: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${name} is now active`, ToastAndroid.SHORT);
    } else {
      Alert.alert(t.profiles.profileSwitched, interpolate(t.profiles.nowActive, { name }));
    }
  };

  const openPinPrompt = (profile: Profile) => {
    setPinPrompt({
      id: profile.id,
      name: profile.name,
      pin: profile.pin ?? '',
    });
    setEnteredPin('');
    setPinError(null);
  };

  const closePinPrompt = () => {
    setPinPrompt(null);
    setEnteredPin('');
    setPinError(null);
  };

  const openAddPinModal = (profile: Profile) => {
    setAddPinModal({
      id: profile.id,
      name: profile.name,
      hasPin: !!profile.pin,
    });
    setNewPin('');
    setConfirmPin('');
    setAddPinError(null);
    setAddPinStep('new');
  };

  const closeAddPinModal = () => {
    setAddPinModal(null);
    setNewPin('');
    setConfirmPin('');
    setAddPinError(null);
    setAddPinStep('new');
  };

  const handleSetPin = () => {
    if (!addPinModal) return;

    if (addPinStep === 'new') {
      if (newPin.length !== 4) {
        setAddPinError(t.profiles.pinLength);
        return;
      }
      setAddPinStep('confirm');
      setAddPinError(null);
      return;
    }

    if (newPin !== confirmPin) {
      setAddPinError(t.profiles.pinMismatch);
      return;
    }

    setPin(addPinModal.id, newPin);
    closeAddPinModal();

    if (Platform.OS === 'android') {
      ToastAndroid.show('PIN set successfully', ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', 'PIN has been set for this profile');
    }
  };

  const handleClearPin = () => {
    if (!addPinModal) return;

    Alert.alert(
      'Remove PIN?',
      'This will remove PIN protection from this profile.',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            clearPin(addPinModal.id);
            closeAddPinModal();
            if (Platform.OS === 'android') {
              ToastAndroid.show('PIN removed', ToastAndroid.SHORT);
            }
          },
        },
      ]
    );
  };

  const handleSwitch = (profile: Profile) => {
    if (profile.id === activeProfileId) return;
    if (profile.pin) {
      openPinPrompt(profile);
      return;
    }
    setActiveProfile(profile.id);
    notifySwitch(profile.name);
  };

  const handleUnlock = () => {
    if (!pinPrompt) return;
    if (enteredPin.length !== 4) {
      setPinError(t.profiles.enterPin);
      return;
    }
    if (verifyPin(pinPrompt.id, enteredPin)) {
      setActiveProfile(pinPrompt.id);
      notifySwitch(pinPrompt.name);
      closePinPrompt();
    } else {
      setPinError(t.profiles.incorrectPin);
    }
  };

  const handleDelete = (profile: Profile) => {
    Alert.alert(
      t.profiles.deleteProfile,
      interpolate(t.profiles.deleteProfileDesc, { name: profile.name }),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => deleteProfile(profile.id),
        },
      ]
    );
  };

  const renderProfile = ({ item, index }: { item: Profile; index: number }) => {
    const isActive = item.id === activeProfileId;
    return (
      <Animated.View entering={FadeInUp.delay(100 + index * 100)}>
        <Pressable
          style={[styles.profileCard, isActive && styles.profileCardActive]}
          onPress={() => handleSwitch(item)}
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileEmojiContainer}>
              <Text style={styles.profileEmoji}>{item.emoji}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{item.name}</Text>
              <View style={styles.profileMetaRow}>
                {item.pin && (
                  <View style={styles.pinBadge}>
                    <Lock size={12} color={COLORS.textMuted} />
                    <Text style={styles.pinBadgeText}>PIN</Text>
                  </View>
                )}
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Check size={12} color="#fff" />
                    <Text style={styles.activeBadgeText}>{t.profiles.active}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.profileActions}>
            <TextInput
              style={styles.nameInput}
              value={item.name}
              onChangeText={(value) => updateProfile?.(item.id, { name: value })}
              placeholder={t.profiles.nameLabel}
              placeholderTextColor={COLORS.textMuted}
            />
            <Pressable
              style={[styles.iconButton, item.pin && styles.iconButtonActive]}
              onPress={() => openAddPinModal(item)}
            >
              <Lock size={18} color={item.pin ? COLORS.primary : COLORS.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.iconButton, styles.iconButtonDanger]}
              onPress={() => handleDelete(item)}
            >
              <Trash2 size={18} color="#fff" />
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={28} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Users size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.headerTitle}>{t.profiles.title}</Text>
          <Text style={styles.headerSubtitle}>{t.profiles.tapToSwitch}</Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/(settings)/profiles/new')}
        >
          <Plus size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Profiles List */}
      {profiles.length > 0 ? (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={renderProfile}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Users size={48} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>{t.profiles.noProfiles}</Text>
          <Text style={styles.emptyBody}>{t.profiles.createProfile}</Text>
        </View>
      )}

      {/* PIN Prompt Modal */}
      <Modal
        visible={!!pinPrompt}
        transparent
        animationType="fade"
        onRequestClose={closePinPrompt}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Lock size={32} color={COLORS.primary} />
              <Text style={styles.modalTitle}>{t.profiles.enterPin}</Text>
              <Text style={styles.modalSubtitle}>
                {pinPrompt ? interpolate(t.profiles.unlockProfile, { name: pinPrompt.name }) : ''}
              </Text>
            </View>

            <TextInput
              style={styles.pinInput}
              value={enteredPin}
              onChangeText={(value) => {
                setEnteredPin(value.replace(/\D/g, '').slice(0, 4));
                setPinError(null);
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="••••"
              placeholderTextColor={COLORS.textMuted}
            />

            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable style={styles.modalButtonSecondary} onPress={closePinPrompt}>
                <Text style={styles.modalButtonSecondaryText}>{t.common.cancel}</Text>
              </Pressable>
              <Pressable style={styles.modalButtonPrimary} onPress={handleUnlock}>
                <Text style={styles.modalButtonPrimaryText}>{t.profiles.unlock}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set PIN Modal */}
      <Modal
        visible={!!addPinModal}
        transparent
        animationType="fade"
        onRequestClose={closeAddPinModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Lock size={32} color={COLORS.primary} />
              <Text style={styles.modalTitle}>
                {addPinModal?.hasPin ? 'Change PIN' : 'Set PIN'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {addPinStep === 'new'
                  ? `Enter a 4-digit PIN for ${addPinModal?.name}`
                  : 'Confirm your PIN'}
              </Text>
            </View>

            <TextInput
              style={styles.pinInput}
              value={addPinStep === 'new' ? newPin : confirmPin}
              onChangeText={(value) => {
                const cleaned = value.replace(/\D/g, '').slice(0, 4);
                if (addPinStep === 'new') {
                  setNewPin(cleaned);
                } else {
                  setConfirmPin(cleaned);
                }
                setAddPinError(null);
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="••••"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />

            {addPinError ? <Text style={styles.pinError}>{addPinError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable style={styles.modalButtonSecondary} onPress={closeAddPinModal}>
                <Text style={styles.modalButtonSecondaryText}>{t.common.cancel}</Text>
              </Pressable>
              {addPinModal?.hasPin && addPinStep === 'new' && (
                <Pressable
                  style={[styles.modalButtonSecondary, styles.modalButtonDanger]}
                  onPress={handleClearPin}
                >
                  <Text style={styles.modalButtonSecondaryText}>Remove</Text>
                </Pressable>
              )}
              <Pressable style={styles.modalButtonPrimary} onPress={handleSetPin}>
                <Text style={styles.modalButtonPrimaryText}>
                  {addPinStep === 'new' ? 'Next' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.paddingLarge,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerContent: {
    flex: 1,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h2,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  
  // List
  listContent: {
    padding: SIZES.paddingLarge,
    paddingTop: 0,
  },
  
  // Profile Card
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  profileCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  profileEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h4,
    color: COLORS.text,
    marginBottom: 6,
  },
  profileMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pinBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#fff',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontSize: SIZES.body,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconButtonActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  iconButtonDanger: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.paddingLarge * 2,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusXL,
    padding: SIZES.paddingLarge * 1.5,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.h3,
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  pinInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: SIZES.radiusLarge,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: COLORS.text,
    fontSize: 32,
    letterSpacing: 16,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  pinError: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtonSecondaryText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  modalButtonDanger: {
    backgroundColor: `${COLORS.danger}20`,
    borderColor: COLORS.danger,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  modalButtonPrimaryText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.body,
    color: '#fff',
  },
});
