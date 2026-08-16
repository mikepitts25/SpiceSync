import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { COLORS } from '../../constants/theme';

type IntensityFilterDisclosureProps = {
  title: string;
  selectedLabel: string;
  children: React.ReactNode;
  trailingAction?: React.ReactNode;
};

export function IntensityFilterDisclosure({
  title,
  selectedLabel,
  children,
  trailingAction,
}: IntensityFilterDisclosureProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}: ${selectedLabel}`}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((current) => !current)}
          style={({ pressed }) => [
            styles.disclosure,
            pressed && styles.disclosurePressed,
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.separator}>·</Text>
          <Text style={styles.selection}>{selectedLabel}</Text>
          <ChevronDown
            size={18}
            color={COLORS.textSub}
            strokeWidth={2.2}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </Pressable>
        {trailingAction}
      </View>
      {expanded ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disclosure: {
    flex: 1,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disclosurePressed: {
    opacity: 0.72,
  },
  title: {
    color: COLORS.pink,
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  selection: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
  },
});
