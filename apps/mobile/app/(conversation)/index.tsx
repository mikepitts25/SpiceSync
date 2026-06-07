import React, { useCallback, useRef } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { AppHeader, AppTabBar } from '../../components/app-chrome';
import { ScreenTour } from '../../components/ScreenTour';
import {
  CONVERSATION_TOPIC_TILES,
  type ConversationTopicTile,
} from '../../lib/conversationExperience';
import { useTranslation } from '../../lib/i18n';
import { COLORS, SHADOWS } from '../../constants/theme';

const GRID_PADDING = 16;
const GRID_GAP = 12;
const NORMAL_FONT_SIZE = 16;
const NORMAL_LINE_HEIGHT = 23;

type TopicTileProps = {
  item: ConversationTopicTile;
  tileSize: number;
  onPress: (topic: ConversationTopicTile) => void;
};

function TopicTile({ item, tileSize, onPress }: TopicTileProps) {
  const pressProgress = useRef(new Animated.Value(0)).current;

  const animatePress = useCallback(
    (toValue: number) => {
      Animated.spring(pressProgress, {
        toValue,
        friction: 10,
        tension: 220,
        useNativeDriver: true,
      }).start();
    },
    [pressProgress]
  );

  const scale = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.965],
  });
  const translateY = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });
  const rotate = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', item.motion.pressTilt],
  });
  const glowScale = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const glowOpacity = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });
  const arrowTranslateX = pressProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.label}`}
      onPress={() => onPress(item)}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      style={[styles.topicPress, { width: tileSize, height: tileSize }]}
    >
      <Animated.View
        style={[
          styles.topicMotion,
          {
            transform: [{ scale }, { translateY }, { rotate }],
          },
        ]}
      >
        <LinearGradient
          colors={item.accent.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.topicTile,
            {
              borderColor: item.accent.border,
              shadowColor: item.accent.gradient[1],
            },
          ]}
        >
          <View style={styles.topicWash} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.topicGlow,
              {
                backgroundColor: item.accent.glow,
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
          <View style={styles.topicInner}>
            <View style={styles.topicTopRow}>
              <Text
                style={[
                  styles.topicMark,
                  { backgroundColor: item.accent.badge },
                ]}
              >
                {item.mark}
              </Text>
              <Animated.View
                style={[
                  styles.arrowBadge,
                  {
                    backgroundColor: item.accent.badge,
                    transform: [{ translateX: arrowTranslateX }],
                  },
                ]}
              >
                <ChevronRight size={18} color={COLORS.textPrimary} />
              </Animated.View>
            </View>

            <View style={styles.topicCopy}>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.84}
                numberOfLines={2}
                style={styles.topicLabel}
              >
                {item.label}
              </Text>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                numberOfLines={3}
                style={styles.topicSubtitle}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default function ConversationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const tileSize = Math.floor((width - GRID_PADDING * 2 - GRID_GAP) / 2);

  const openTopic = useCallback(
    (topic: ConversationTopicTile) => {
      router.push(topic.route as never);
    },
    [router]
  );

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar style="light" />
      <AppHeader />

      <View style={styles.tourWrap}>
        <ScreenTour
          screenId="conversation"
          screenLabel={t.tabs.conversation}
          steps={t.tours.conversation}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>CONVO TOPICS</Text>
          <Text style={styles.title}>Pick a conversation lane</Text>
        </View>

        <FlatList
          data={CONVERSATION_TOPIC_TILES}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TopicTile item={item} tileSize={tileSize} onPress={openTopic} />
          )}
        />
      </View>

      <AppTabBar active="convo" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  tourWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 8,
    gap: 16,
  },
  headingBlock: {
    gap: 4,
  },
  eyebrow: {
    color: COLORS.maybe,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '800',
    letterSpacing: 0,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
  },
  gridContent: {
    gap: GRID_GAP,
    paddingBottom: 24,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  topicPress: {
    borderRadius: 20,
  },
  topicMotion: {
    flex: 1,
    borderRadius: 20,
  },
  topicTile: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  topicWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,0,6,0.58)',
  },
  topicGlow: {
    position: 'absolute',
    right: -20,
    bottom: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  topicInner: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
  topicTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  topicMark: {
    color: COLORS.pink,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '800',
    letterSpacing: 0,
    overflow: 'hidden',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  arrowBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCopy: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 6,
  },
  topicLabel: {
    alignSelf: 'stretch',
    color: COLORS.textPrimary,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  topicSubtitle: {
    alignSelf: 'flex-start',
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '600',
    textAlign: 'left',
  },
});
