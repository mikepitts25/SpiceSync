import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';

import {
  getProfileAvatarOption,
  type ProfileAvatarId,
} from '../src/constants/emojis';

type ProfileAvatarIconProps = {
  avatar?: string | null;
  size?: number;
  framed?: boolean;
  selected?: boolean;
};

const AVATAR_IMAGES: Record<ProfileAvatarId, ImageSourcePropType> = {
  flame: require('../assets/avatars/flame.png'),
  cherries: require('../assets/avatars/cherries.png'),
  peach: require('../assets/avatars/peach.png'),
  thong: require('../assets/avatars/thong.png'),
  handcuffs: require('../assets/avatars/handcuffs.png'),
  'high-heels': require('../assets/avatars/high-heels.png'),
  'chastity-cage': require('../assets/avatars/chastity-cage.png'),
  'masquerade-mask': require('../assets/avatars/masquerade-mask.png'),
  lipstick: require('../assets/avatars/lipstick.png'),
  feather: require('../assets/avatars/feather.png'),
  ribbon: require('../assets/avatars/ribbon.png'),
  candle: require('../assets/avatars/candle.png'),
  dice: require('../assets/avatars/dice.png'),
  champagne: require('../assets/avatars/champagne.png'),
  key: require('../assets/avatars/key.png'),
  rose: require('../assets/avatars/rose.png'),
  blindfold: require('../assets/avatars/blindfold.png'),
  perfume: require('../assets/avatars/perfume.png'),
  'riding-crop': require('../assets/avatars/riding-crop.png'),
  collar: require('../assets/avatars/collar.png'),
};

export default function ProfileAvatarIcon({
  avatar,
  size = 48,
  framed = true,
  selected = false,
}: ProfileAvatarIconProps) {
  const option = getProfileAvatarOption(avatar);
  const iconSize = framed ? Math.round(size * 0.82) : size;

  return (
    <View
      style={[
        styles.wrap,
        framed && {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: option.background,
          borderColor: selected ? option.secondary : 'rgba(255,255,255,0.14)',
          borderWidth: selected ? 2 : 1,
        },
        !framed && { width: size, height: size },
      ]}
    >
      <Image
        source={AVATAR_IMAGES[option.id]}
        resizeMode="contain"
        style={{ width: iconSize, height: iconSize }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
