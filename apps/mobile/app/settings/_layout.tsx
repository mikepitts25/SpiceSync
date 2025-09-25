import React from 'react';
import { Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';

function BackBtn() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.back()}
      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={{ fontSize: 18, color: 'white' }}>‹</Text>
    </Pressable>
  );
}

export default function SettingsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0b0f14' },
        headerTitleStyle: { color: 'white' },
        headerTintColor: 'white',
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          headerLeft: () => <BackBtn />,
        }}
      />
      <Stack.Screen name="profiles" options={{ title: 'Profiles' }} />
    </Stack>
  );
}
