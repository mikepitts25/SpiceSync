import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, Lock, Plus } from 'lucide-react-native';

import {
  setActiveProfile,
  useProfilesStore,
  type Profile,
} from '../../../lib/state/profiles';
import { BackHeader } from '../../../components/app-chrome';
import ProfileAvatarIcon from '../../../components/ProfileAvatarIcon';
import { useTranslation, interpolate } from '../../../lib/i18n';
import { getProfileManageDestination } from '../../../lib/profile-management';
import { COLORS, GRADIENTS } from '../../../constants/theme';

const DOT_COLORS = [
  COLORS.pink,
  COLORS.purple,
  COLORS.yes,
  COLORS.maybe,
  COLORS.no,
];

type PinPrompt = {
  profile: Profile;
} | null;

export default function ProfilesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profiles, activeProfileId, verifyPin, deleteProfile } =
    useProfilesStore();
  const [pinPrompt, setPinPrompt] = useState<PinPrompt>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const closePinPrompt = () => {
    setPinPrompt(null);
    setEnteredPin('');
    setPinError(null);
  };

  const activateProfile = (profile: Profile) => {
    if (profile.id === activeProfileId) return;
    if (profile.pin) {
      setPinPrompt({ profile });
      setEnteredPin('');
      setPinError(null);
      return;
    }
    setActiveProfile(profile.id);
  };

  const unlockProfile = () => {
    if (!pinPrompt) return;
    if (enteredPin.length !== 4) {
      setPinError(t.profiles.enterPin);
      return;
    }
    if (!verifyPin(pinPrompt.profile.id, enteredPin)) {
      setPinError(t.profiles.incorrectPin);
      return;
    }
    setActiveProfile(pinPrompt.profile.id);
    closePinPrompt();
  };

  const confirmDelete = (profile: Profile) => {
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

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <BackHeader title="Profiles" />

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item, index }) => {
          const active = item.id === activeProfileId;
          const dotColor = item.color ?? DOT_COLORS[index % DOT_COLORS.length];
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => activateProfile(item)}
              onLongPress={() => confirmDelete(item)}
              style={[styles.profileCard, active && styles.profileCardActive]}
            >
              <ProfileAvatarIcon
                avatar={item.emoji}
                size={44}
                selected={active}
              />

              <View style={styles.profileCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>
                    {item.displayName ?? item.name}
                  </Text>
                  {item.pin ? (
                    <Lock size={13} color={COLORS.textMuted} />
                  ) : null}
                </View>
                <View style={styles.metaRow}>
                  <View
                    style={[styles.colorDot, { backgroundColor: dotColor }]}
                  />
                  {active ? (
                    <View style={styles.activePill}>
                      <Check size={11} color={COLORS.pink} />
                      <Text style={styles.activePillText}>Active</Text>
                    </View>
                  ) : (
                    <Text style={styles.profileHint}>Tap to switch</Text>
                  )}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Manage ${item.displayName ?? item.name}`}
                hitSlop={10}
                onPress={(event) => {
                  event.stopPropagation();
                  router.push(getProfileManageDestination(item.id));
                }}
                style={styles.manageButton}
              >
                <ChevronRight size={18} color={COLORS.textMuted} />
              </Pressable>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(settings)/profiles/new')}
            style={styles.addButton}
          >
            <Plus size={18} color={COLORS.pink} />
            <Text style={styles.addButtonText}>Add Profile</Text>
          </Pressable>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t.profiles.noProfiles}</Text>
            <Text style={styles.emptyCopy}>{t.profiles.createProfile}</Text>
          </View>
        }
      />

      <Modal
        visible={!!pinPrompt}
        transparent
        animationType="fade"
        onRequestClose={closePinPrompt}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.profiles.enterPin}</Text>
            <Text style={styles.modalCopy}>
              {pinPrompt
                ? interpolate(t.profiles.unlockProfile, {
                    name: pinPrompt.profile.name,
                  })
                : ''}
            </Text>
            <TextInput
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
              style={styles.pinInput}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={closePinPrompt}>
                <Text style={styles.modalCancelText}>{t.common.cancel}</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmPress}
                onPress={unlockProfile}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.modalConfirm}
                >
                  <Text style={styles.modalConfirmText}>Unlock</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  profileCard: {
    minHeight: 78,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileCardActive: {
    borderColor: COLORS.border,
  },
  profileCopy: {
    flex: 1,
    gap: 7,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activePill: {
    borderRadius: 12,
    backgroundColor: 'rgba(194,24,91,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activePillText: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '700',
  },
  profileHint: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  manageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCopy: {
    color: COLORS.textSub,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalCopy: {
    color: COLORS.textSub,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  pinInput: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: COLORS.cardAlt,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
  },
  pinError: {
    color: COLORS.no,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  modalConfirmPress: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  modalConfirm: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
});
