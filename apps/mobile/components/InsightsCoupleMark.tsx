import React from 'react';

import CoupleAvatarPair from './CoupleAvatarPair';
import MatchCoupleIcon from './MatchCoupleIcon';

type InsightsCoupleMarkProps = {
  linked: boolean;
  activeAvatar?: string | null;
  partnerAvatar?: string | null;
  size?: number;
};

export default function InsightsCoupleMark({
  linked,
  activeAvatar,
  partnerAvatar,
  size = 64,
}: InsightsCoupleMarkProps) {
  if (!linked) {
    return (
      <MatchCoupleIcon
        size={size}
        accessibilityLabel="Couple match"
        testID="insights-couple-artwork"
      />
    );
  }

  return (
    <CoupleAvatarPair
      firstAvatar={activeAvatar}
      secondAvatar={partnerAvatar}
      size={size}
      accessibilityLabel="Active couple"
      testID="insights-couple-pair"
    />
  );
}
