import { View, Text, Pressable, Alert } from 'react-native';
import { useSettings } from '../../lib/state/useStore';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SettingsScreen() {
  const { ageConfirmed, setAgeConfirmed, discreteMode, setDiscreteMode } = useSettings();
  const router = useRouter();

  return (
    <View style={{ flex:1, backgroundColor:'#0B0B0E', padding:16, paddingTop:48 }}>
      <Text style={{ color:'#fff', fontSize:20, fontWeight:'700', marginBottom:12 }}>Settings</Text>
      <Pressable onPress={()=> setDiscreteMode(!discreteMode)} style={{ backgroundColor:'#151521', padding:12, borderRadius:12, marginBottom:8 }}>
        <Text style={{ color:'#fff' }}>Discreet mode: {discreteMode ? 'On' : 'Off'}</Text>
      </Pressable>
      <Pressable onPress={async () => {
        const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock' });
        Alert.alert('Biometric check', res.success ? 'Success' : 'Failed');
      }} style={{ backgroundColor:'#151521', padding:12, borderRadius:12, marginBottom:8 }}>
        <Text style={{ color:'#fff' }}>Test biometric lock</Text>
      </Pressable>
      <Pressable onPress={()=> { setAgeConfirmed(false); router.replace('/'); }} style={{ backgroundColor:'#311', padding:12, borderRadius:12 }}>
        <Text style={{ color:'#F88' }}>Reset age gate</Text>
      </Pressable>
    </View>
  );
}