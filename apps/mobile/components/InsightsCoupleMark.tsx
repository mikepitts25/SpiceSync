import React from 'react';

import CoupleAvatarPair from './CoupleAvatarPair';
import MatchCoupleIcon from './MatchCoupleIcon';

import { ui } from '../lib/i18n/uiLiteral';

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
        accessibilityLabel={ui('Couple match')}
        testID="insights-couple-artwork"
      />
    );
  }

  return (
    <CoupleAvatarPair
      firstAvatar={activeAvatar}
      secondAvatar={partnerAvatar}
      size={size}
      accessibilityLabel={ui('Active couple')}
      testID="insights-couple-pair"
    />
  );
}
