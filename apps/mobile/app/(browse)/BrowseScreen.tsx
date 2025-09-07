import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { useKinks } from '../../lib/data';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';

export default function BrowseScreen() {
  const { kinks } = useKinks();
  const [q, setQ] = useState('');
  const filtered = useMemo(()=> kinks.filter(k => (k.title + ' ' + k.description + ' ' + k.category).toLowerCase().includes(q.toLowerCase())), [kinks, q]);
  const router = useRouter();

  return (
    <View style={{ flex:1, backgroundColor:'#0B0B0E', padding:16, paddingTop:48 }}>
      <TextInput
        placeholder="Search"
        placeholderTextColor="#888"
        value={q}
        onChangeText={setQ}
        style={{ backgroundColor:'#151521', color:'#fff', padding:12, borderRadius:12, marginBottom:12 }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(i)=>i.id}
        renderItem={({item})=> (
          <Pressable onPress={()=>router.push({ pathname:'/(deck)/DeckScreen', params:{} })} style={{ padding:12, backgroundColor:'#151521', borderRadius:12, marginBottom:8 }}>
            <Text style={{ color:'#fff', fontWeight:'700' }}>{item.title}</Text>
            <Text style={{ color:'#C8C8D0' }}>{item.description}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}