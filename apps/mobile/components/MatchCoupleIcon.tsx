import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { COLORS } from '../constants/theme';

type MatchCoupleIconProps = {
  size?: number;
  accessibilityLabel?: string;
  testID?: string;
};

const MATCH_COUPLE_ARTWORK = require('../assets/match-couple-peppers.png');

export default function MatchCoupleIcon({
  size = 48,
  accessibilityLabel = 'Couple match',
  testID,
}: MatchCoupleIconProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.frame,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Image
        source={MATCH_COUPLE_ARTWORK}
        resizeMode="cover"
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={{ width: size, height: size, transform: [{ scale: 1.15 }] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
  },
});
