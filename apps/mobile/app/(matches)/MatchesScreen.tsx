import { View, Text, SectionList } from 'react-native';
import { useKinks } from '../../lib/data';
import { useVotes } from '../../lib/state/useStore';

export default function MatchesScreen() {
  const { kinksById } = useKinks();
  const { votesA, votesB } = useVotes();

  function sectionData() {
    const yesYes:any[] = [];
    const oneSided:any[] = [];
    const noNo:any[] = [];
    for (const id of Object.keys(kinksById)) {
      const a = votesA[id];
      const b = votesB[id];
      if (a==='yes' && b==='yes') yesYes.push(kinksById[id]);
      else if (a==='no' && b==='no') noNo.push(kinksById[id]);
      else if ((a && b) && !(a==='no'&&b==='no')) oneSided.push({ ...kinksById[id], combo:`You ${a} / They ${b}`});
    }
    return [
      { title:'Mutual Yes', data: yesYes.sort((x,y)=>x.title.localeCompare(y.title)) },
      { title:'One-Sided', data: oneSided },
      { title:'Mutual No (collapsed)', data: [] },
    ];
  }

  return (
    <View style={{ flex:1, backgroundColor:'#0B0B0E', paddingTop:48 }}>
      <Text style={{ color:'#fff', fontSize:20, fontWeight:'700', paddingHorizontal:16, marginBottom:8 }}>Matches</Text>
      <SectionList
        sections={sectionData()}
        keyExtractor={(i, idx)=> (i.id || i.title) + idx}
        renderSectionHeader={({section})=> <Text style={{ color:'#8FA3FF', padding:16, fontWeight:'700' }}>{section.title}</Text>}
        renderItem={({item})=> (
          <View style={{ backgroundColor:'#151521', marginHorizontal:16, marginBottom:8, padding:12, borderRadius:12 }}>
            <Text style={{ color:'#fff', fontWeight:'700' }}>{item.title}</Text>
            <Text style={{ color:'#C8C8D0' }}>{item.description}</Text>
            {'combo' in item ? <Text style={{ color:'#8FA3FF', marginTop:4 }}>{item.combo}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}