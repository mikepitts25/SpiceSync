import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Profile } from '../src/stores/profiles';

type VerifyResult = { success: true } | { success: false; error?: string };

type PinVerifyModalProps = {
  open: boolean;
  profiles: Profile[];
  onClose: () => void;
  onSuccess: () => void;
  onVerifyProfile: (profile: Profile, pin: string) => VerifyResult;
};

export default function PinVerifyModal({
  open,
  profiles,
  onClose,
  onSuccess,
  onVerifyProfile,
}: PinVerifyModalProps) {
  const [step, setStep] = useState(0);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setPin('');
      setError(null);
    }
  }, [open, profiles]);

  const currentProfile = useMemo(
    () => profiles[step] ?? null,
    [profiles, step]
  );

  const handleChange = (value: string) => {
    setPin(value.replace(/\D/g, '').slice(0, 4));
    if (error) setError(null);
  };

  const handleSubmit = () => {
    if (!currentProfile) {
      onSuccess();
      return;
    }

    if (!pin || pin.length !== 4) {
      setError('Enter the 4-digit PIN');
      return;
    }

    const result = onVerifyProfile(currentProfile, pin);
    if (!result.success) {
      setError(result.error ?? 'Incorrect PIN');
      return;
    }

    if (step >= profiles.length - 1) {
      setPin('');
      setError(null);
      setStep(0);
      onSuccess();
    } else {
      setPin('');
      setError(null);
      setStep(step + 1);
    }
  };

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify PIN</Text>
            {currentProfile ? (
              <>
                <Text style={styles.modalSubtitle}>
                  Enter the PIN for{' '}
                  {currentProfile.displayName ?? currentProfile.name}
                </Text>
                <TextInput
                  value={pin}
                  onChangeText={handleChange}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  style={styles.pinInput}
                  placeholder="••••"
                  placeholderTextColor="#64748b"
                />
                {error ? <Text style={styles.pinError}>{error}</Text> : null}
                <View style={styles.modalActions}>
                  <Pressable
                    onPress={onClose}
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.modalButtonSecondaryLabel}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSubmit}
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.modalButtonPrimaryLabel}>Confirm</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>No profile to verify.</Text>
                <Pressable
                  onPress={onClose}
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalButtonPrimaryLabel}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: { width: '100%' },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 14,
  },
  modalTitle: {
    color: 'white',
    fontWeight: '900',
    fontSize: 20,
    textAlign: 'center',
  },
  modalSubtitle: { color: '#94a3b8', textAlign: 'center' },
  pinInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: 'white',
    fontSize: 20,
    letterSpacing: 10,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  pinError: { color: '#f87171', textAlign: 'center', fontWeight: '600' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: { backgroundColor: '#1f2937' },
  modalButtonPrimary: { backgroundColor: '#2563eb' },
  modalButtonSecondaryLabel: { color: '#cbd5e1', fontWeight: '700' },
  modalButtonPrimaryLabel: { color: 'white', fontWeight: '800' },
});
