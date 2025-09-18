import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFilters } from '../../lib/state/filters'; // <-- from (tabs)/categories it's two levels up


type Tier = 'romance'|'soft'|'naughty'|'xxx';

const tiles: Array<{tier:Tier; title:string; desc:string; bg:string}> = [
  { tier:'romance', title:'Romance', desc:'Affectionate, cozy, intimacy-building ideas.', bg:'#1f2435' },
  { tier:'soft',    title:'Soft Kinks', desc:'Light, playful, PG-13 kink exploration.', bg:'#2a2638' },
  { tier:'naughty', title:'Naughty Kinks', desc:'Adult themes; still non-graphic & consent-first.', bg:'#35243c' },
  { tier:'xxx',     title:'XXX Kinks', desc:'Explicit topics described neutrally; no graphic detail.', bg:'#3c2430' },
];

export default function CategoryScreen() {
  const router = useRouter();
  return (
    <View style={{ flex:1, backgroundColor:'#0B0B0E', paddingTop:48, padding:16 }}>
      <Text style={{ color:'#fff', fontSize:22, fontWeight:'800', marginBottom:8 }}>Choose a Category</Text>
      <Text style={{ color:'#C8C8D0', marginBottom:16 }}>
        Adults 18+ only. Consensual, legal, non-graphic exploration.
      </Text>
      {tiles.map(t => (
        <Pressable key={t.tier}
          onPress={() => router.push({ pathname: '/(deck)/DeckScreen', params: { tier: t.tier } })}
          style={{ backgroundColor:t.bg, padding:16, borderRadius:16, marginBottom:12 }}>
          <Text style={{ color:'#fff', fontWeight:'800', fontSize:18 }}>{t.title}</Text>
          <Text style={{ color:'#C8C8D0', marginTop:6 }}>{t.desc}</Text>
        </Pressable>
      ))}
    </View>
  );
}
