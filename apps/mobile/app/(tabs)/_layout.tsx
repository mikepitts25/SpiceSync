import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '../constants/theme';
import { useTranslation } from '../../lib/i18n';

// Simple emoji icons for tabs
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      initialRouteName="categories"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="categories"
        options={{
          title: t.tabs.discover,
          tabBarLabel: t.tabs.discover,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="deck"
        options={{
          title: t.tabs.vote,
          tabBarLabel: t.tabs.vote,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎴" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          title: t.tabs.game,
          tabBarLabel: t.tabs.game,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎲" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: t.tabs.matches,
          tabBarLabel: t.tabs.matches,
          tabBarIcon: ({ focused }) => <TabIcon emoji="💕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: t.tabs.browse,
          tabBarLabel: t.tabs.browse,
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
