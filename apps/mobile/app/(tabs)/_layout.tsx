import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="categories"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#60a5fa',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#0b0f14', borderTopColor: '#111827' },
        tabBarLabelStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="categories"
        options={{ title: 'Categories', tabBarLabel: 'Categories' }}
      />
      <Tabs.Screen
        name="deck"
        options={{ title: 'Deck', tabBarLabel: 'Deck' }}
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
