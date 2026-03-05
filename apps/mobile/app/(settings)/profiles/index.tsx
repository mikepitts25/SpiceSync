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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  setActiveProfile,
  useProfilesStore,
  type Profile,
} from '../../../lib/state/profiles';
import { useTranslation, interpolate } from '../../../lib/i18n';

type FlatListProfile = Profile;

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

  const openPinPrompt = (profile: FlatListProfile) => {
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

  const openAddPinModal = (profile: FlatListProfile) => {
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

    // Confirm step
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

  const handleSwitch = (profile: FlatListProfile) => {
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

  const handleDelete = (profile: FlatListProfile) => {
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

  const renderProfile = ({ item }: { item: FlatListProfile }) => {
    const isActive = item.id === activeProfileId;
    return (
      <Pressable
        style={[styles.profileRow, isActive && styles.profileRowActive]}
        onPress={() => handleSwitch(item)}
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${item.name}`}
      >
        <View style={styles.profileHeader}>
          <Text style={styles.profileEmoji}>{item.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{item.name}</Text>
            <Text style={styles.profileMeta}>
              {item.pin ? t.profiles.pinRequired : t.profiles.noPin}
            </Text>
          </View>
          {isActive ? <Text style={styles.activeTag}>{t.profiles.active}</Text> : null}
        </View>

        <View style={styles.managementRow}>
          <TextInput
            style={styles.nameInput}
            value={item.name}
            onChangeText={(value) => updateProfile?.(item.id, { name: value })}
            placeholder={t.profiles.nameLabel}
            placeholderTextColor="#64748b"
          />
          <Pressable
            style={[styles.pinButton, item.pin && styles.pinButtonActive]}
            onPress={() => openAddPinModal(item)}
          >
            <Text style={[styles.pinButtonText, item.pin && styles.pinButtonTextActive]}>
              {item.pin ? '🔒 PIN' : '+ PIN'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.deleteText}>{t.common.delete}</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t.profiles.title}</Text>
        <Pressable
          style={styles.newButton}
          onPress={() => router.push('/(settings)/profiles/new')}
          accessibilityRole="button"
        >
          <Text style={styles.newButtonText}>{t.profiles.addProfile}</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>{t.profiles.tapToSwitch}</Text>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        renderItem={renderProfile}
        contentContainerStyle={
          profiles.length ? styles.listContent : styles.emptyListContent
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.profiles.noProfiles}</Text>
            <Text style={styles.emptyBody}>{t.profiles.createProfile}</Text>
          </View>
        }
      />

      <Modal
        visible={!!pinPrompt}
        transparent
        animationType="fade"
        onRequestClose={closePinPrompt}
      >
        <Pressable style={styles.modalBackdrop} onPress={closePinPrompt}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.profiles.enterPin}</Text>
            <Text style={styles.modalBody}>
              {pinPrompt ? interpolate(t.profiles.unlockProfile, { name: pinPrompt.name }) : t.profiles.pinRequired}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={enteredPin}
              onChangeText={(value) => {
                setEnteredPin(value.replace(/\D/g, '').slice(0, 4));
                setPinError(null);
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#475569"
            />
            {pinError ? (
              <Text style={styles.modalError}>{pinError}</Text>
            ) : null}
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonSecondary}
                onPress={closePinPrompt}
              >
                <Text style={styles.modalButtonText}>{t.common.cancel}</Text>
              </Pressable>
              <Pressable
                style={styles.modalButtonPrimary}
                onPress={handleUnlock}
              >
                <Text style={styles.modalButtonPrimaryText}>{t.profiles.unlock}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!addPinModal}
        transparent
        animationType="fade"
        onRequestClose={closeAddPinModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeAddPinModal}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {addPinModal?.hasPin ? 'Change PIN' : 'Set PIN'}
            </Text>
            <Text style={styles.modalBody}>
              {addPinStep === 'new'
                ? `Enter a 4-digit PIN for ${addPinModal?.name}`
                : 'Confirm your PIN'}
            </Text>
            <TextInput
              style={styles.modalInput}
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
              placeholderTextColor="#475569"
              autoFocus
            />
            {addPinError ? (
              <Text style={styles.modalError}>{addPinError}</Text>
            ) : null}
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalButtonSecondary}
                onPress={closeAddPinModal}
              >
                <Text style={styles.modalButtonText}>{t.common.cancel}</Text>
              </Pressable>
              {addPinModal?.hasPin && addPinStep === 'new' && (
                <Pressable
                  style={[styles.modalButtonSecondary, { backgroundColor: '#7f1d1d' }]}
                  onPress={handleClearPin}
                >
                  <Text style={styles.modalButtonText}>Remove</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.modalButtonPrimary}
                onPress={handleSetPin}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {addPinStep === 'new' ? 'Next' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: 'white' },
  subtitle: { paddingHorizontal: 16, color: '#94a3b8', marginBottom: 12 },
  newButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  newButtonText: { color: 'white', fontWeight: '800' },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', gap: 8 },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  emptyBody: { color: '#94a3b8' },
  profileRow: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 16,
    gap: 16,
  },
  profileRowActive: { borderColor: '#3b82f6' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileEmoji: { fontSize: 32 },
  profileName: { color: 'white', fontSize: 18, fontWeight: '700' },
  profileMeta: { color: '#94a3b8', fontSize: 12 },
  activeTag: { color: '#3b82f6', fontWeight: '700' },
  managementRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameInput: {
    flex: 1,
    backgroundColor: '#0b1423',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: 'white',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#b91c1c',
  },
  deleteText: { color: 'white', fontWeight: '700' },
  pinButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  pinButtonActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  pinButtonText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 12,
  },
  pinButtonTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalBody: { color: '#94a3b8', textAlign: 'center' },
  modalInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: 'white',
    fontSize: 24,
    letterSpacing: 12,
    textAlign: 'center',
  },
  modalError: { color: '#f87171', textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    alignItems: 'center',
  },
  modalButtonText: { color: 'white', fontWeight: '700' },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  modalButtonPrimaryText: { color: 'white', fontWeight: '800' },
});
