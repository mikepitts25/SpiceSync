import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Dices, HeartHandshake, Layers, Target } from 'lucide-react-native';

import { CardAccentTop } from '../app-chrome';
import { COLORS, RADII, SHADOWS } from '../../constants/theme';
import { GameSurface } from './GameControls';

type GameHubIcon = 'layers' | 'target' | 'heart-handshake' | 'dices';

const ICONS = {
  layers: Layers,
  target: Target,
  'heart-handshake': HeartHandshake,
  dices: Dices,
} as const;

type GameHubCardProps = {
  title: string;
  description: string;
  icon: GameHubIcon;
  available: boolean;
  statusLabel: string;
  onPress?: () => void;
  featured?: boolean;
};

function CardContent({
  title,
  description,
  icon,
  statusLabel,
  featured,
}: Omit<GameHubCardProps, 'available' | 'onPress'>) {
  const Icon = ICONS[icon];

  return (
    <GameSurface elevated={featured} style={styles.surface}>
      {featured ? <CardAccentTop /> : null}
      <View style={styles.content}>
        <View style={[styles.icon, featured && styles.iconFeatured]}>
          <Icon size={25} color={featured ? COLORS.textPrimary : COLORS.pink} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <Text style={[styles.status, featured && styles.statusFeatured]}>
          {statusLabel}
        </Text>
      </View>
    </GameSurface>
  );
}

export function GameHubCard({
  title,
  description,
  icon,
  available,
  statusLabel,
  onPress,
  featured = false,
}: GameHubCardProps) {
  const content = (
    <CardContent
      title={title}
      description={description}
      icon={icon}
      statusLabel={statusLabel}
      featured={featured}
    />
  );

  if (!available) {
    return (
      <View
        accessibilityLabel={`${title}: ${statusLabel}`}
        accessibilityState={{ disabled: true }}
        style={styles.disabled}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Play ${title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: RADII.card,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.64,
  },
  surface: {
    overflow: 'hidden',
    minHeight: 132,
    ...SHADOWS.card,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  icon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,45,146,0.12)',
  },
  iconFeatured: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  description: {
    color: COLORS.textSub,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
  },
  status: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  statusFeatured: {
    color: COLORS.pink,
  },
});
