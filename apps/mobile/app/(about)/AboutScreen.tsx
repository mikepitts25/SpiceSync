import { View, Text } from 'react-native';

export default function AboutScreen() {
  return (
    <View style={{ flex:1, backgroundColor:'#0B0B0E', padding:16, paddingTop:48 }}>
      <Text style={{ color:'#fff', fontSize:20, fontWeight:'700', marginBottom:12 }}>Consent & Safety</Text>
      <Text style={{ color:'#C8C8D0', marginBottom:8 }}>This app is for adults (18+) exploring consensual, legal, non-graphic ideas.</Text>
      <Text style={{ color:'#C8C8D0', marginBottom:8 }}>Nothing involving minors, coercion, animals, non-consensual degradation/humiliation, self-harm, illegal activity, or graphic/explicit content is allowed.</Text>
      <Text style={{ color:'#C8C8D0', marginBottom:8 }}>Use clear communication, respect boundaries, and stop immediately if anyone is uncomfortable.</Text>
    </View>
  );
}