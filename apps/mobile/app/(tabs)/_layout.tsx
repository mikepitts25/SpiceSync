import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '../constants/theme';

export default function TabsLayout() {
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
        options={{ title: 'Discover', tabBarLabel: 'Discover' }}
      />
      <Tabs.Screen
        name="deck"
        options={{ title: 'Vote', tabBarLabel: 'Vote' }}
      />
      <Tabs.Screen
        name="browse"
        options={{ title: 'Browse', tabBarLabel: 'Browse' }}
      />
      <Tabs.Screen
        name="matches"
        options={{ title: 'Matches', tabBarLabel: 'Matches' }}
      />
    </Tabs>
  );
}
