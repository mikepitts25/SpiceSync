import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, SlidersHorizontal } from 'lucide-react-native';

import { COLORS } from '../../constants/theme';
import { ui } from '../../lib/i18n/uiLiteral';
import type {
  MyVotesFilter,
  MyVotesFilterCounts,
  MyVotesSort,
} from '../../lib/votes/myVotesView';

const FILTER_OPTIONS: readonly {
  id: MyVotesFilter;
  label: string;
  color: string;
}[] = [
  { id: 'all', label: 'All', color: COLORS.textPrimary },
  { id: 'yes', label: 'Yes', color: COLORS.yes },
  { id: 'curious', label: 'Curious', color: COLORS.maybe },
  { id: 'not_now', label: 'Not Now', color: COLORS.purpleLight },
  { id: 'hard_no', label: 'Hard No', color: COLORS.no },
  { id: 'legacy_no', label: 'No', color: COLORS.textMuted },
];

const SORT_OPTIONS: readonly { id: MyVotesSort; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'title', label: 'A to Z' },
  { id: 'intensity_asc', label: 'Intensity low to high' },
  { id: 'intensity_desc', label: 'Intensity high to low' },
];

export function MyVotesControls({
  filter,
  sort,
  counts,
  resultCount,
  onFilterChange,
  onSortChange,
}: {
  filter: MyVotesFilter;
  sort: MyVotesSort;
  counts: MyVotesFilterCounts;
  resultCount: number;
  onFilterChange: (filter: MyVotesFilter) => void;
  onSortChange: (sort: MyVotesSort) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const filterLabel =
    FILTER_OPTIONS.find(({ id }) => id === filter)?.label ?? 'All';
  const sortLabel =
    SORT_OPTIONS.find(({ id }) => id === sort)?.label ?? 'Default';
  const visibleFilters = FILTER_OPTIONS.filter(
    ({ id }) => id !== 'legacy_no' || counts.legacy_no > 0
  );

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ui('Filter and sort votes')}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [
          styles.disclosure,
          pressed && styles.disclosurePressed,
        ]}
      >
        <View style={styles.disclosureCopy}>
          <View style={styles.titleRow}>
            <SlidersHorizontal
              size={16}
              color={COLORS.pink}
              strokeWidth={2.4}
            />
            <Text style={styles.title}>{ui('FILTER & SORT')}</Text>
          </View>
          <Text style={styles.summary} numberOfLines={1}>
            {ui(filterLabel)} · {ui(sortLabel)} · {resultCount}{' '}
            {ui(resultCount === 1 ? 'vote' : 'votes')}
          </Text>
        </View>
        <ChevronDown
          size={20}
          color={COLORS.textSub}
          strokeWidth={2.2}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.panel}>
          <Text style={styles.groupLabel}>{ui('VOTE')}</Text>
          <View style={styles.chipGrid}>
            {visibleFilters.map((option) => {
              const active = option.id === filter;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${ui('Filter votes')}: ${ui(option.label)}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => onFilterChange(option.id)}
                  style={[
                    styles.chip,
                    active && {
                      borderColor: option.color + '8A',
                      backgroundColor: option.color + '24',
                    },
                  ]}
                >
                  <Text
                    style={[styles.chipText, active && { color: option.color }]}
                  >
                    {ui(option.label)}
                  </Text>
                  <Text
                    style={[
                      styles.chipCount,
                      active && { color: option.color },
                    ]}
                  >
                    {counts[option.id]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.groupLabel}>{ui('SORT')}</Text>
          <View style={styles.chipGrid}>
            {SORT_OPTIONS.map((option) => {
              const active = option.id === sort;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${ui('Sort votes')}: ${ui(option.label)}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => onSortChange(option.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {ui(option.label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.2)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: 14,
  },
  disclosure: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disclosurePressed: {
    opacity: 0.72,
  },
  disclosureCopy: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
  },
  summary: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
  },
  panel: {
    gap: 8,
    paddingTop: 2,
    paddingBottom: 14,
  },
  groupLabel: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
  },
  chipActive: {
    borderColor: 'rgba(255,45,146,0.54)',
    backgroundColor: 'rgba(255,45,146,0.15)',
  },
  chipText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  chipTextActive: {
    color: COLORS.textPrimary,
  },
  chipCount: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
});
