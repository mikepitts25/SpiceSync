import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type VoteValue = 'yes' | 'maybe' | 'no';

type Props = {
  currentKinkId?: string | null;
  onVote: (value: VoteValue) => void;
  disabled?: boolean;
};

export default function VoteButtons({ currentKinkId, onVote, disabled = false }: Props) {
  const insets = useSafeAreaInsets();
  const isDisabled = disabled || !currentKinkId;

  const handlePress = (value: VoteValue) => {
    if (isDisabled) return;
    onVote(value);
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        style={[styles.container, { bottom: insets.bottom + 12 }]}
        pointerEvents="box-none"
      >
        <View style={styles.row}>
          <VoteButton label="No" tone="no" disabled={isDisabled} onPress={() => handlePress('no')} />
          <VoteButton label="Maybe" tone="maybe" disabled={isDisabled} onPress={() => handlePress('maybe')} />
          <VoteButton label="Yes" tone="yes" disabled={isDisabled} onPress={() => handlePress('yes')} />
        </View>
      </View>
    </View>
  );
}

type VoteButtonProps = {
  label: string;
  tone: 'no' | 'maybe' | 'yes';
  disabled: boolean;
  onPress: () => void;
};

function VoteButton({ label, tone, disabled, onPress }: VoteButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, styles[`tone_${tone}`], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 12, 24, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  button: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tone_no: {
    backgroundColor: '#ef4444',
  },
  tone_maybe: {
    backgroundColor: '#f97316',
  },
  tone_yes: {
    backgroundColor: '#22c55e',
  },
  buttonLabel: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
