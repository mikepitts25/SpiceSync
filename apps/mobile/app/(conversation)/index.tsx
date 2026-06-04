import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import {
  AppHeader,
  AppTabBar,
  CardAccentTop,
} from '../../components/app-chrome';
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.label}`}
              onPress={() => openTopic(item)}
              style={[styles.topicPress, { width: tileSize, height: tileSize }]}
            >
              <View style={styles.topicTile}>
                <CardAccentTop />
                <View style={styles.topicInner}>
                  <View style={styles.topicTopRow}>
                    <Text style={styles.topicMark}>{item.mark}</Text>
                    <ChevronRight size={18} color={COLORS.textSub} />
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
              </View>
            </Pressable>
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
    overflow: 'hidden',
  },
  topicTile: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  topicInner: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
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
    borderRadius: 12,
  },
  topicCopy: {
    gap: 6,
  },
  topicLabel: {
    color: COLORS.textPrimary,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
  },
  topicSubtitle: {
    color: COLORS.textSub,
    fontSize: NORMAL_FONT_SIZE,
    lineHeight: NORMAL_LINE_HEIGHT,
    fontWeight: '600',
  },
});
