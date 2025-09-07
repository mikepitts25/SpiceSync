import { View, Text, Pressable } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import SwipeDeck from '../../components/SwipeDeck';
import { useKinks, type KinkItem } from '../../lib/data';
import { useVotes } from '../../lib/state/useStore';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

type Tier = 'romance'|'soft'|'naughty'|'xxx';

export default function DeckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tier?: string }>();
  const selectedTier = (params.tier as Tier) ?? 'romance';

  const { kinks } = useKinks();
  const filtered = useMemo(
    () => kinks.filter((k: KinkItem) => (k as any).tier === selectedTier || ((k as any).tier ?? 'romance') === selectedTier),
    [kinks, selectedTier]
  );

  const { vote } = useVotes();
  const [index, setIndex] = useState(0);
  const current = filtered[index];

  useEffect(() => { if (!current && filtered.length === 0) router.replace('/(home)/CategoryScreen'); }, [current, filtered.length, router]);

  return (
    <View style={{ flex:1, backgroundColor:'#0B0B0E', padding:16, paddingTop:48 }}>
      <Text style={{ color:'#fff', fontSize:20, fontWeight:'700', marginBottom:8 }}>
        {selectedTier === 'romance' ? 'Romance' :
         selectedTier === 'soft' ? 'Soft Kinks' :
         selectedTier === 'naughty' ? 'Naughty Kinks' : 'XXX Kinks'}
      </Text>
      <Text style={{ color:'#C8C8D0', marginBottom:16 }}>Right = Yes • Left = No • Down = Maybe</Text>

      {current ? (
        <SwipeDeck
          item={current}
          onSwipe={(dir) => {
            const map:any = { right:'yes', left:'no', down:'maybe' };
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            vote(current.id, map[dir]);
            setIndex((i)=>i+1);
          }}
          onUndo={() => setIndex((i)=> Math.max(0, i-1))}
        />
      ) : (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <Text style={{ color:'#C8C8D0' }}>No more cards in this category.</Text>
          <Pressable onPress={()=>router.replace('/(home)/CategoryScreen')} style={{ marginTop:16 }}>
            <Text style={{ color:'#8FA3FF' }}>Choose another category</Text>
          </Pressable>
        </View>
      )}

      <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:12 }}>
        <Pressable onPress={()=>router.push('/(browse)/BrowseScreen')}><Text style={{ color:'#8FA3FF' }}>Browse</Text></Pressable>
        <Pressable onPress={()=>router.push('/(matches)/MatchesScreen')}><Text style={{ color:'#8FA3FF' }}>Matches</Text></Pressable>
        <Pressable onPress={()=>router.replace('/(home)/CategoryScreen')}><Text style={{ color:'#8FA3FF' }}>Categories</Text></Pressable>
      </View>
    </View>
  );
}
