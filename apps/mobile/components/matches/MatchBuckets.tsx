import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
} from 'lucide-react-native';

import { describeRoleCompatibility } from '../../lib/match/experience';
import { interpolate } from '../../lib/i18n';
import { COLORS, SHADOWS } from '../../constants/theme';
import {
  bucketToneColors,
  voteBadgeBorderColor,
  voteBadgeColor,
  voteLabel,
  type BucketId,
  type BucketView,
  type MatchItem,
} from './matchPresentation';

function MatchVoteBadge({ label, value }: { label: string; value?: string }) {
  const color = voteBadgeColor(value);
  return (
    <View
      style={[
        styles.resultVoteBadge,
        { borderColor: voteBadgeBorderColor(value) },
      ]}
    >
      <Text style={[styles.resultVoteText, { color }]}>
        {`${label}: ${voteLabel(value)}`}
      </Text>
    </View>
  );
}

function MatchRow({
  item,
  onSelect,
}: {
  item: MatchItem;
  onSelect?: (item: MatchItem) => void;
}) {
  return (
    <Pressable
      style={styles.resultRow}
      onPress={() => onSelect?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title} match details`}
    >
      <View
        style={styles.resultSummary}
        accessibilityLabel="Compact match summary"
      >
        <View style={styles.resultPrimaryRow}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <ChevronRight size={15} color={COLORS.textMuted} />
        </View>
        <View style={styles.resultBadgeRow}>
          {item.category ? (
            <Text style={styles.resultCategory} numberOfLines={1}>
              {item.category}
            </Text>
          ) : null}
          {item.intensityScale ? (
            <View style={styles.resultLevelBadge}>
              <Text style={styles.resultLevelText}>
                {`L${item.intensityScale}`}
              </Text>
            </View>
          ) : null}
          <MatchVoteBadge label="You" value={item.myVote} />
          <MatchVoteBadge label="Partner" value={item.partnerVote} />
        </View>
        {item.pairMode ? (
          <Text style={styles.resultRole} numberOfLines={1}>
            {describeRoleCompatibility(item)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function MatchSection({
  tone,
  icon: Icon,
  title,
  rows,
  emptyTitle,
  emptySubtitle,
  locked = false,
  lockTitle,
  unlockLabel,
  onUnlock,
  onSelect,
  hideHeader = false,
}: {
  tone: 'yes' | 'partial' | 'maybe';
  icon: typeof Check;
  title: string;
  rows: MatchItem[];
  emptyTitle: string;
  emptySubtitle: string;
  locked?: boolean;
  lockTitle?: string;
  unlockLabel?: string;
  onUnlock?: () => void;
  onSelect?: (item: MatchItem) => void;
  hideHeader?: boolean;
}) {
  const { color, bg, border } = bucketToneColors(tone);

  return (
    <View
      style={[styles.section, { backgroundColor: bg, borderColor: border }]}
    >
      {hideHeader ? null : (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon size={16} color={color} />
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: `${color}1F` }]}>
            <Text style={[styles.countBadgeText, { color }]}>
              {rows.length}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.rowList}>
        {locked && rows.length ? (
          <>
            <View style={styles.resultRow}>
              <Text style={styles.resultTitle}>
                {lockTitle ?? 'Locked matches'}
              </Text>
              <Text style={styles.resultCategory}>
                {`${rows.length} ${rows.length === 1 ? 'ITEM' : 'ITEMS'}`}
              </Text>
            </View>
            {unlockLabel && onUnlock ? (
              <Pressable
                style={[styles.unlockButton, { borderColor: color }]}
                onPress={onUnlock}
                accessibilityRole="button"
              >
                <LockKeyhole size={14} color={color} />
                <Text style={[styles.unlockText, { color }]}>
                  {unlockLabel.toUpperCase()}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : rows.length ? (
          rows.map((item) => (
            <MatchRow key={item.id} item={item} onSelect={onSelect} />
          ))
        ) : (
          <View style={styles.resultRow}>
            <Text style={styles.resultTitle}>{emptyTitle}</Text>
            <Text style={styles.resultCategory}>
              {emptySubtitle.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function BucketCard({
  bucket,
  variant,
  viewLabel,
  sharedPicksLabel,
  onSelect,
}: {
  bucket: BucketView;
  variant: 'hero' | 'tile';
  viewLabel: string;
  sharedPicksLabel: string;
  onSelect: (id: BucketId) => void;
}) {
  const { color, bg, border } = bucketToneColors(bucket.tone);
  const Icon = bucket.icon;
  const isHero = variant === 'hero';

  return (
    <Pressable
      onPress={() => onSelect(bucket.id)}
      accessibilityRole="button"
      accessibilityLabel={`${bucket.title}, ${bucket.total} matches`}
      style={[
        isHero ? styles.bucketHero : styles.bucketTile,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      <View style={styles.bucketTopRow}>
        <View style={[styles.bucketIcon, { backgroundColor: `${color}1F` }]}>
          <Icon size={isHero ? 20 : 18} color={color} />
        </View>
        {bucket.locked ? (
          <LockKeyhole size={15} color={COLORS.textMuted} />
        ) : (
          <ChevronRight size={18} color={COLORS.textMuted} />
        )}
      </View>

      <View style={styles.bucketBody}>
        <Text style={[styles.bucketCount, { color }]}>{bucket.total}</Text>
        <Text
          style={[styles.bucketTitle, isHero && styles.bucketTitleHero]}
          numberOfLines={1}
        >
          {bucket.title}
        </Text>
        <Text style={styles.bucketBlurb} numberOfLines={2}>
          {bucket.blurb}
        </Text>
      </View>

      {isHero ? (
        <View style={styles.bucketHeroFooter}>
          <Text style={[styles.bucketHeroFooterText, { color }]}>
            {bucket.locked
              ? (bucket.unlockLabel ?? viewLabel).toUpperCase()
              : interpolate(sharedPicksLabel, {
                  count: bucket.total,
                }).toUpperCase()}
          </Text>
          <ChevronRight size={16} color={color} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function BucketOverview({
  buckets,
  viewLabel,
  sharedPicksLabel,
  onSelect,
}: {
  buckets: BucketView[];
  viewLabel: string;
  sharedPicksLabel: string;
  onSelect: (id: BucketId) => void;
}) {
  const [hero, ...tiles] = buckets;
  return (
    <View style={styles.bucketOverview}>
      {hero ? (
        <BucketCard
          bucket={hero}
          variant="hero"
          viewLabel={viewLabel}
          sharedPicksLabel={sharedPicksLabel}
          onSelect={onSelect}
        />
      ) : null}
      <View style={styles.bucketTileRow}>
        {tiles.map((bucket) => (
          <BucketCard
            key={bucket.id}
            bucket={bucket}
            variant="tile"
            viewLabel={viewLabel}
            sharedPicksLabel={sharedPicksLabel}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  );
}

export function BucketDetailView({
  bucket,
  backLabel,
  emptyTitle,
  emptySubtitle,
  filters,
  onBack,
  onSelect,
}: {
  bucket: BucketView;
  backLabel: string;
  emptyTitle: string;
  emptySubtitle: string;
  filters: React.ReactNode;
  onBack: () => void;
  onSelect: (item: MatchItem) => void;
}) {
  const { color } = bucketToneColors(bucket.tone);
  const Icon = bucket.icon;

  return (
    <View style={styles.bucketDetail}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        style={styles.backChip}
      >
        <ChevronLeft size={16} color={COLORS.textSub} />
        <Text style={styles.backChipText}>{backLabel}</Text>
      </Pressable>

      <View style={styles.bucketDetailHeader}>
        <View style={styles.sectionTitleRow}>
          <Icon size={18} color={color} />
          <Text style={[styles.bucketDetailTitle, { color }]}>
            {bucket.title.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: `${color}1F` }]}>
          <Text style={[styles.countBadgeText, { color }]}>{bucket.total}</Text>
        </View>
      </View>

      {filters}

      <MatchSection
        tone={bucket.tone}
        icon={bucket.icon}
        title={bucket.title.toUpperCase()}
        rows={bucket.rows}
        emptyTitle={emptyTitle}
        emptySubtitle={emptySubtitle}
        locked={bucket.locked}
        lockTitle={bucket.lockTitle}
        unlockLabel={bucket.unlockLabel}
        onUnlock={bucket.onUnlock}
        onSelect={onSelect}
        hideHeader
      />

      {bucket.lockedNote && bucket.onUnlock ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={bucket.lockedNote}
          onPress={bucket.onUnlock}
          style={styles.lockedNoteRow}
        >
          <LockKeyhole size={14} color={COLORS.textMuted} />
          <Text style={styles.lockedNoteText}>{bucket.lockedNote}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  countBadge: {
    minWidth: 24,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  rowList: {
    gap: 8,
  },
  bucketOverview: {
    gap: 12,
  },
  bucketHero: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
    ...SHADOWS.card,
  },
  bucketTileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bucketTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  bucketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bucketIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketBody: {
    gap: 2,
  },
  bucketCount: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bucketTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bucketTitleHero: {
    fontSize: 18,
  },
  bucketBlurb: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
  },
  bucketHeroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  bucketHeroFooterText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bucketDetail: {
    gap: 12,
  },
  backChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  backChipText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  bucketDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bucketDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  resultRow: {
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.024)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
  },
  resultSummary: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    gap: 6,
    alignItems: 'stretch',
  },
  resultPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    flex: 1,
    minWidth: 0,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  resultRole: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
  },
  resultBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  resultLevelBadge: {
    minHeight: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.42)',
    backgroundColor: 'rgba(255,45,146,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  resultLevelText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  resultCategory: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '700',
  },
  resultVoteBadge: {
    minHeight: 24,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  resultVoteText: {
    fontSize: 16,
    fontWeight: '800',
  },
  unlockButton: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.026)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  unlockText: {
    fontSize: 16,
    fontWeight: '800',
  },
  lockedNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    backgroundColor: 'rgba(255,255,255,0.026)',
    paddingHorizontal: 12,
  },
  lockedNoteText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
});
