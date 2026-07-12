// Shared presentation model for the matches screen and its section
// components: bucket view types, tone colors, and vote badge formatting.
import type { LucideIcon } from 'lucide-react-native';

import type { ActionMatchItem } from '../../lib/match/actionBuckets';
import { COLORS } from '../../constants/theme';

export type MatchItem = ActionMatchItem;

export type BucketId = 'ready' | 'curious' | 'talk';
export type BucketTone = 'yes' | 'partial' | 'maybe';

export type BucketView = {
  id: BucketId;
  tone: BucketTone;
  icon: LucideIcon;
  title: string;
  blurb: string;
  total: number;
  rows: MatchItem[];
  locked: boolean;
  lockTitle?: string;
  unlockLabel?: string;
  // Shown when some rows are visible but others still need consent.
  lockedNote?: string;
  onUnlock?: () => void;
};

export function bucketToneColors(tone: BucketTone): {
  color: string;
  bg: string;
  border: string;
} {
  if (tone === 'yes') {
    return {
      color: COLORS.yes,
      bg: 'rgba(34,197,94,0.04)',
      border: 'rgba(34,197,94,0.19)',
    };
  }
  if (tone === 'partial') {
    return {
      color: COLORS.pink,
      bg: 'rgba(255,45,146,0.05)',
      border: 'rgba(255,45,146,0.22)',
    };
  }
  return {
    color: COLORS.maybe,
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.22)',
  };
}

export function formatMatchMeta(item: MatchItem): string {
  const parts = [item.category];
  if (item.intensityScale) {
    parts.push(`L${item.intensityScale}`);
  }
  return parts.join(' • ');
}

export function voteLabel(value?: string): string {
  if (value === 'yes') return 'Yes';
  if (value === 'maybe') return 'Maybe';
  if (value === 'no') return 'No';
  return 'Not set';
}

export function voteBadgeColor(value?: string): string {
  if (value === 'yes') return COLORS.yes;
  if (value === 'maybe') return COLORS.maybe;
  if (value === 'no') return COLORS.no;
  return COLORS.textMuted;
}

export function voteBadgeBorderColor(value?: string): string {
  if (value === 'yes') return 'rgba(34,197,94,0.4)';
  if (value === 'maybe') return 'rgba(245,158,11,0.42)';
  if (value === 'no') return 'rgba(239,68,68,0.4)';
  return 'rgba(255,255,255,0.16)';
}
