import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppLock } from '../lib/lock';
import { useSettings } from '../lib/state/useStore';
import * as Haptics from 'expo-haptics';

export default function Welcome() {
  const { setAgeConfirmed, ageConfirmed } = useSettings();
  const { ensureLockReady } = useAppLock();

  useEffect(() => { ensureLockReady(); }, [ensureLockReady]);

  // Navigate safely once age is confirmed
  if (ageConfirmed) {
    return <Redirect href="/(home)/CategoryScreen" />;
  }

  return (
    <View style={{ flex:1, backgroundColor:'#0B0B0E', justifyContent:'center', padding:24 }}>
      <Text accessibilityRole="header" style={{ color:'#fff', fontSize:28, fontWeight:'700', marginBottom:16 }}>SpiceSync</Text>
      <Text style={{ color:'#C8C8D0', fontSize:16, lineHeight:22, marginBottom:24 }}>
        Adults 18+ only. This app is for consensual, legal, non-graphic exploration between adults.
        By continuing you confirm you are 18+ and agree to respectful, safe use.
      </Text>
      <Pressable
        accessibilityLabel="I am 18 or older and I agree"
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAgeConfirmed(true); }}
        style={{ backgroundColor:'#5B8CFF', padding:16, borderRadius:14, alignItems:'center', marginBottom:12 }}>
        <Text style={{ color:'#0B0B0E', fontWeight:'700' }}>I am 18+ and agree</Text>
      </Pressable>
    </View>
  );
}
