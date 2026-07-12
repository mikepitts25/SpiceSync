import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Filter } from 'lucide-react-native';

import type {
  MatchRoleFilter,
  MatchVisibilityFilter,
} from '../../lib/match/experience';
import { COLORS } from '../../constants/theme';

const VISIBILITY_FILTERS: { id: MatchVisibilityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unseen', label: 'Unseen' },
];

const ROLE_FILTERS: { id: MatchRoleFilter; label: string }[] = [
  { id: 'all', label: 'All roles' },
  { id: 'paired', label: 'Paired' },
  { id: 'give', label: 'You give' },
  { id: 'receive', label: 'You receive' },
  { id: 'both', label: 'Both' },
];

const INTENSITY_FILTERS = [
  { id: 'all', label: 'All levels' },
  { id: '1', label: 'Level 1' },
  { id: '2', label: 'Level 2' },
  { id: '3', label: 'Level 3' },
] as const;

export function MatchFilters({
  visibility,
  onVisibilityChange,
  category,
  categories,
  onCategoryChange,
  intensity,
  onIntensityChange,
  role,
  onRoleChange,
}: {
  visibility: MatchVisibilityFilter;
  onVisibilityChange: (value: MatchVisibilityFilter) => void;
  category: string;
  categories: string[];
  onCategoryChange: (value: string) => void;
  intensity: 'all' | '1' | '2' | '3';
  onIntensityChange: (value: 'all' | '1' | '2' | '3') => void;
  role: MatchRoleFilter;
  onRoleChange: (value: MatchRoleFilter) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeFilterCount = [
    visibility !== 'all',
    category !== 'all',
    intensity !== 'all',
    role !== 'all',
  ].filter(Boolean).length;
  const filterSummary =
    activeFilterCount === 0
      ? 'All filters'
      : `${activeFilterCount} active filter${activeFilterCount === 1 ? '' : 's'}`;
  const categoryOptions = categories.map((item) => ({
    id: item,
    label: item === 'all' ? 'All categories' : item,
  }));

  return (
    <View style={styles.filtersCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filter matches"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={styles.filtersToggle}
      >
        <View style={styles.filtersToggleCopy}>
          <View style={styles.filtersTitleRow}>
            <Filter size={15} color={COLORS.pink} />
            <Text style={styles.filtersTitle}>FILTER MATCHES</Text>
          </View>
          <Text style={styles.filtersSummary}>{filterSummary}</Text>
        </View>
        <View style={styles.filtersToggleAction}>
          <Text style={styles.filtersToggleActionText}>
            {expanded ? 'Hide filters' : 'Show filters'}
          </Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.filtersPanel}>
          <Text style={styles.filterGroupLabel}>Result</Text>
          <FilterRow
            options={VISIBILITY_FILTERS}
            selected={visibility}
            onSelect={onVisibilityChange}
          />
          <Text style={styles.filterGroupLabel}>Category</Text>
          <FilterChipGrid
            options={categoryOptions}
            selected={category}
            onSelect={onCategoryChange}
            accessibilityLabel="Category filters"
          />
          <Text style={styles.filterGroupLabel}>Level</Text>
          <FilterRow
            options={INTENSITY_FILTERS}
            selected={intensity}
            onSelect={onIntensityChange}
          />
          <Text style={styles.filterGroupLabel}>Role</Text>
          <FilterRow
            options={ROLE_FILTERS}
            selected={role}
            onSelect={onRoleChange}
          />
        </View>
      ) : null}
    </View>
  );
}

function FilterChipGrid<T extends string>({
  options,
  selected,
  onSelect,
  accessibilityLabel,
}: {
  options: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.filterChipGrid} accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            onPress={() => onSelect(option.id)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                active && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FilterRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {options.map((option) => {
        const active = option.id === selected;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            onPress={() => onSelect(option.id)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterChipText,
                active && styles.filterChipTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filtersCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.2)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    padding: 14,
    gap: 14,
  },
  filtersToggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  filtersToggleCopy: {
    flex: 1,
    gap: 4,
  },
  filtersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  filtersTitle: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  filtersSummary: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  filtersToggleAction: {
    minWidth: 92,
    minHeight: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,45,146,0.42)',
    backgroundColor: 'rgba(255,45,146,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  filtersToggleActionText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  filtersPanel: {
    gap: 8,
    paddingTop: 2,
  },
  filterGroupLabel: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  filterChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  filterRow: {
    gap: 7,
    paddingRight: 6,
  },
  filterChip: {
    minHeight: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
  },
  filterChipActive: {
    borderColor: 'rgba(255,45,146,0.54)',
    backgroundColor: 'rgba(255,45,146,0.15)',
  },
  filterChipText: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: COLORS.textPrimary,
  },
});
