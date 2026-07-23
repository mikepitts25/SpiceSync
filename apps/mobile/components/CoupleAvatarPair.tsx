import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';

import { COLORS, GRADIENTS } from '../constants/theme';
import ProfileAvatarIcon from './ProfileAvatarIcon';

type CoupleAvatarPairProps = {
  firstAvatar?: string | null;
  secondAvatar?: string | null;
  size?: number;
  accessibilityLabel?: string;
  testID?: string;
};

export default function CoupleAvatarPair({
  firstAvatar,
  secondAvatar,
  size = 64,
  accessibilityLabel = 'Active couple',
  testID = 'couple-avatar-pair',
}: CoupleAvatarPairProps) {
  const overlap = Math.round(size * 0.28);
  const iconSize = Math.round(size * 0.81);
  const heartSize = Math.round(size * 0.41);
  const heartLeft = size - overlap / 2 - heartSize / 2;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.pair, { width: size * 2 - overlap, height: size }]}
    >
      <LinearGradient
        testID={`${testID}-first-avatar`}
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <ProfileAvatarIcon
          avatar={firstAvatar}
          size={iconSize}
          framed={false}
        />
      </LinearGradient>
      <LinearGradient
        testID={`${testID}-second-avatar`}
        colors={['#60A5FA', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: -overlap,
            zIndex: 0,
          },
        ]}
      >
        <ProfileAvatarIcon
          avatar={secondAvatar}
          size={iconSize}
          framed={false}
        />
      </LinearGradient>
      <View
        testID={`${testID}-heart`}
        style={[
          styles.heart,
          {
            left: heartLeft,
            top: (size - heartSize) / 2,
            width: heartSize,
            height: heartSize,
            borderRadius: heartSize / 2,
          },
        ]}
      >
        <Heart
          size={Math.round(heartSize * 0.54)}
          color={COLORS.textPrimary}
          fill={COLORS.textPrimary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heart: {
    position: 'absolute',
    zIndex: 2,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
