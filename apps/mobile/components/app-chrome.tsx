import React from 'react';
import {
  Image,
  ImageStyle,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Gift,
  Globe,
  Heart,
  Info,
  Layers,
  Link as LinkIcon,
  Lock,
  MessageCircle,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Star,
  Trophy,
  User,
  Users,
  EyeOff,
  Fingerprint,
  Menu,
  type LucideIcon,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import {
  COLORS,
  GRADIENTS,
  RADII,
  SHADOWS,
  type GradientTuple,
} from '../constants/theme';
import { useTranslation } from '../lib/i18n';

const MAIN_TOPIC_FONT_SIZE = 24;
const NORMAL_FONT_SIZE = 16;
const NORMAL_LINE_HEIGHT = 23;

export type TabKey =
  | 'profiles'
  | 'browse'
  | 'deck'
  | 'matches'
  | 'convo'
  | 'game';

export const SPICESYNC_LOGO = require('../assets/logo-spicesync.png');

export function SpiceSyncLogo({
  width = 154,
  height = 58,
  style,
}: {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={SPICESYNC_LOGO}
      resizeMode="contain"
      accessibilityLabel="SpiceSync"
      style={[{ width, height }, style]}
    />
  );
}

type GradientTextProps = {
  text: string;
  width: number;
  height: number;
  fontSize: number;
  fontWeight?: string;
  colors: GradientTuple;
};

export function GradientText({
  text,
  width,
  height,
  fontSize,
  fontWeight = '800',
  colors,
}: GradientTextProps) {
  const id = React.useId().replace(/:/g, '');

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          {colors.map((color, index) => (
            <Stop
              key={`${color}-${index}`}
              offset={`${(index / Math.max(colors.length - 1, 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        x="0"
        y={fontSize}
        fill={`url(#${id})`}
        fontSize={fontSize}
        fontWeight={fontWeight}
      >
        {text}
      </SvgText>
    </Svg>
  );
}

export function AppHeader({ onRightPress }: { onRightPress?: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <SpiceSyncLogo />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.openSettings}
        onPress={onRightPress ?? (() => router.push('/(settings)'))}
        style={styles.headerButton}
      >
        <Menu size={20} color={COLORS.textPrimary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

export function BackHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.backHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.goBack}
        onPress={onBack ?? (() => router.back())}
        style={styles.backButton}
      >
        <ChevronLeft size={25} color={COLORS.pink} />
      </Pressable>
      <View style={styles.backTitleWrap}>
        <Text style={styles.backTitle}>{title}</Text>
        {subtitle ? <Text style={styles.backSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const TAB_ITEMS: {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  route: string;
}[] = [
  { key: 'profiles', label: 'profiles', icon: User, route: '/(tabs)/profiles' },
  { key: 'deck', label: 'deck', icon: Layers, route: '/(tabs)/deck' },
  { key: 'matches', label: 'matches', icon: Heart, route: '/(tabs)/matches' },
  {
    key: 'convo',
    label: 'convo',
    icon: MessageCircle,
    route: '/(tabs)/conversation',
  },
  { key: 'game', label: 'game', icon: Gamepad2, route: '/(tabs)/game' },
];

export function AppTabBar({ active }: { active?: TabKey }) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.tabBar}>
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const selected = item.key === active;
        const content = (
          <>
            <Icon
              size={17}
              color={selected ? COLORS.textPrimary : COLORS.textMuted}
              fill={
                selected && item.key === 'matches'
                  ? COLORS.textPrimary
                  : 'transparent'
              }
              strokeWidth={2.2}
            />
            <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>
              {t.tabs[item.label as keyof typeof t.tabs].toUpperCase()}
            </Text>
          </>
        );

        return (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => router.navigate(item.route as never)}
            style={styles.tabItemPress}
          >
            {selected ? (
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.activeTab}
              >
                {content}
              </LinearGradient>
            ) : (
              <View style={styles.inactiveTab}>{content}</View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ScreenCard({
  children,
  style,
  withTopBar = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  withTopBar?: boolean;
}) {
  return (
    <View style={[styles.card, style]}>
      {withTopBar ? <CardAccentTop /> : null}
      {children}
    </View>
  );
}

export function CardAccentTop() {
  return (
    <LinearGradient
      colors={GRADIENTS.cardAccentBar}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.cardTopBar}
    />
  );
}

export function AccentBar({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={GRADIENTS.accentBar}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.accentBar, style]}
    />
  );
}

export function IntensityDots({
  value,
  max = 3,
  color = COLORS.pink,
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: max }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index < value ? color : 'rgba(255,255,255,0.12)',
            },
          ]}
        />
      ))}
    </View>
  );
}

export function ActionCircle({
  label,
  icon: Icon,
  onPress,
  variant = 'dark',
  color = COLORS.pink,
  size = 52,
  iconSize = 22,
}: {
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
  variant?: 'dark' | 'gradient';
  color?: string;
  size?: 52 | 66;
  iconSize?: number;
}) {
  const circleStyle = [
    styles.actionCircle,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
  ];

  return (
    <View style={styles.actionWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={styles.actionPress}
      >
        {variant === 'gradient' ? (
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={circleStyle}
          >
            <Icon
              size={iconSize}
              color={COLORS.textPrimary}
              strokeWidth={2.4}
            />
          </LinearGradient>
        ) : (
          <View style={[circleStyle, styles.actionCircleDark]}>
            <Icon size={iconSize} color={color} strokeWidth={2.4} />
          </View>
        )}
      </Pressable>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </View>
  );
}

export function Toggle({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const track = (
    <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
  );

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={styles.togglePress}
    >
      {value ? (
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.toggleTrack}
        >
          {track}
        </LinearGradient>
      ) : (
        <View style={[styles.toggleTrack, styles.toggleTrackOff]}>{track}</View>
      )}
    </Pressable>
  );
}

export function SectionRow({
  icon: Icon,
  label,
  value,
  onPress,
  tint = COLORS.pink,
  badgeBg,
  toggle,
  gradientBadge = false,
  last = false,
}: {
  icon?: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  tint?: string;
  badgeBg?: string;
  toggle?: React.ReactNode;
  gradientBadge?: boolean;
  last?: boolean;
}) {
  const iconNode = Icon ? (
    gradientBadge ? (
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.sectionIcon}
      >
        <Icon size={18} color={COLORS.textPrimary} />
      </LinearGradient>
    ) : (
      <View
        style={[
          styles.sectionIcon,
          { backgroundColor: badgeBg ?? `${tint}26` },
        ]}
      >
        <Icon size={18} color={tint} />
      </View>
    )
  ) : null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[styles.sectionRow, !last && styles.sectionRowBorder]}
      disabled={!onPress && !toggle}
    >
      {iconNode}
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionRight}>
        {toggle ?? (
          <>
            {value ? <Text style={styles.sectionValue}>{value}</Text> : null}
            {onPress ? (
              <ChevronRight size={18} color={COLORS.textMuted} />
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

export const SettingIcons = {
  BarChart3,
  Bell,
  EyeOff,
  Fingerprint,
  Gift,
  Globe,
  Info,
  LinkIcon,
  Lock,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Star,
  Trophy,
  User,
  Users,
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTitleWrap: {
    flex: 1,
  },
  backTitle: {
    color: COLORS.textPrimary,
    fontSize: MAIN_TOPIC_FONT_SIZE,
    lineHeight: 31,
    fontWeight: '800',
  },
  backSubtitle: {
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 2,
  },
  tabBar: {
    height: 58,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 4,
    borderRadius: RADII.tabBar,
    backgroundColor: COLORS.tabBar,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tabItemPress: {
    flex: 1,
    height: '100%',
  },
  activeTab: {
    flex: 1,
    borderRadius: RADII.activeTab,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  inactiveTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  tabLabelActive: {
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardTopBar: {
    height: 3,
    width: '100%',
  },
  accentBar: {
    width: 60,
    height: 3,
    borderRadius: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionWrap: {
    alignItems: 'center',
    gap: 7,
  },
  actionPress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleDark: {
    backgroundColor: COLORS.uiDark,
    borderWidth: 1,
    borderColor: COLORS.borderFaint,
  },
  actionLabel: {
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '700',
  },
  togglePress: {
    width: 47,
    height: 28,
  },
  toggleTrack: {
    flex: 1,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOff: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.textPrimary,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  sectionRow: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '700',
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionValue: {
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '600',
  },
});
