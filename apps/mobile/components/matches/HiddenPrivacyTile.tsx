import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EyeOff } from 'lucide-react-native';

import { COLORS } from '../../constants/theme';

export function HiddenPrivacyTile({
  count,
  title,
  blurb,
  onPress,
}: {
  count: number;
  title: string;
  blurb: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count} items stay private`}
      onPress={onPress}
      style={styles.hiddenTile}
    >
      <View style={styles.hiddenIcon}>
        <EyeOff size={16} color={COLORS.textMuted} />
      </View>
      <View style={styles.hiddenCopy}>
        <Text style={styles.hiddenTitle}>
          {title.toUpperCase()}
          {count ? ` · ${count}` : ''}
        </Text>
        <Text style={styles.hiddenBlurb}>{blurb}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hiddenTile: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.024)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hiddenIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  hiddenCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  hiddenTitle: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  hiddenBlurb: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
