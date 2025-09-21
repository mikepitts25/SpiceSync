// apps/mobile/app/(tabs)/profiles.tsx
import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useProfiles } from '../../lib/state/profiles';
import { useVotes } from '../../lib/state/votes';

const COLORS = ['#60a5fa','#a78bfa','#f472b6','#34d399','#f59e0b','#f87171'];

export default function ProfilesScreen() {
  const { profiles, currentUserId, addProfile, updateProfile, deleteProfile, switchTo, verifyPin, ensureTwoSlots } = useProfiles();
  const [draft, setDraft] = useState({ displayName: '', emoji: '🧑', color: COLORS[0], pin: '' });
  const [pinEntry, setPinEntry] = useState('');

  ensureTwoSlots();

  const otherSlots = useMemo(() => profiles, [profiles]);

  const onAdd = () => {
    if (profiles.length >= 2) return Alert.alert('Limit reached', 'Same-device mode supports up to 2 profiles.');
    if (!draft.displayName || !draft.pin) return Alert.alert('Missing info', 'Please set a name and PIN.');
    const id = addProfile({ ...draft });
    setDraft({ displayName: '', emoji: '🧑', color: COLORS[0], pin: '' });
    Alert.alert('Profile created', 'Tap Switch to start using this profile.');
  };

  const onSwitch = (id: string) => {
    setPinEntry('');
    Alert.prompt?.(
      'Enter PIN',
      'To switch profiles, enter the PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: (v) => {
          const ok = verifyPin(id, v ?? '');
          if (!ok) return Alert.alert('Wrong PIN', 'Try again.');
          switchTo(id);
        }}
      ],
      'secure-text'
    );
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete profile?', 'This removes their local votes too.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        useVotes.getState().clearUser(id);
        deleteProfile(id);
      } }
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top','left','right']}>
      <Text style={styles.h1}>Profiles (Same-Device)</Text>
      <Text style={styles.p}>Create up to two profiles. Each has a quick PIN for switching.</Text>

      <View style={styles.section}>
        <Text style={styles.h2}>Existing</Text>
        {otherSlots.length === 0 && <Text style={styles.muted}>No profiles yet.</Text>}
        {otherSlots.map(p => (
          <View key={p.id} style={[styles.card, { borderColor: p.color }]}>
            <View style={styles.row}>
              <Text style={styles.emoji}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{p.displayName}</Text>
                <Text style={styles.meta}>ID: {p.id.slice(0,8)} • Created {new Date(p.createdAt).toLocaleDateString()}</Text>
                {currentUserId === p.id && <Text style={styles.badge}>Active</Text>}
              </View>
            </View>
            <View style={styles.btnrow}>
              <Pressable style={styles.secondary} onPress={() => onSwitch(p.id)}><Text style={styles.btnText}>Switch</Text></Pressable>
              <Pressable style={styles.secondary} onPress={() => updateProfile(p.id, { color: COLORS[(COLORS.indexOf(p.color)+1)%COLORS.length] })}><Text style={styles.btnText}>Color</Text></Pressable>
              <Pressable style={styles.secondary} onPress={() => updateProfile(p.id, { emoji: p.emoji === '🧑' ? '🧑‍🎤' : p.emoji === '🧑‍🎤' ? '🧑‍🔧' : '🧑' })}><Text style={styles.btnText}>Emoji</Text></Pressable>
              <Pressable style={styles.danger} onPress={() => onDelete(p.id)}><Text style={styles.btnText}>Delete</Text></Pressable>
            </View>
          </View>
        ))}
      </View>

      {profiles.length < 2 && (
        <View style={styles.section}>
          <Text style={styles.h2}>Add profile</Text>
          <View style={styles.form}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#64748b"
              value={draft.displayName} onChangeText={(t)=>setDraft(s=>({...s, displayName:t}))} />
            <Text style={styles.label}>Emoji</Text>
            <TextInput style={styles.input} placeholder="Emoji" placeholderTextColor="#64748b" value={draft.emoji}
              onChangeText={(t)=>setDraft(s=>({...s, emoji:t||'🧑'}))} />
            <Text style={styles.label}>Color</Text>
            <View style={styles.colors}>
              {COLORS.map(c=>(
                <Pressable key={c} onPress={()=>setDraft(s=>({...s, color:c}))} style={[styles.swatch, { backgroundColor:c, borderWidth: draft.color===c?2:1 }]} />
              ))}
            </View>
            <Text style={styles.label}>PIN (4–6 digits)</Text>
            <TextInput style={styles.input} placeholder="••••" placeholderTextColor="#64748b" secureTextEntry keyboardType="number-pad"
              value={draft.pin} onChangeText={(t)=>setDraft(s=>({...s, pin:t.replace(/[^0-9]/g,'').slice(0,6)}))} />
            <View style={styles.btnrow}>
              <Pressable style={styles.primary} onPress={onAdd}><Text style={styles.btnStrong}>Create</Text></Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1, padding:16, backgroundColor:'#0b0f14' },
  h1: { fontSize:22, fontWeight:'800', color:'white', marginBottom:6 },
  p: { color:'#94a3b8', marginBottom:10 },
  section: { marginTop:12, gap:10 },
  h2: { color:'white', fontWeight:'800' },
  muted: { color:'#64748b' },
  card: { borderWidth:1, borderRadius:12, padding:12, backgroundColor:'#0e1526' },
  row: { flexDirection:'row', gap:10, alignItems:'center' },
  emoji: { fontSize:24 },
  title: { color:'white', fontWeight:'800' },
  meta: { color:'#9ca3af', marginTop:2 },
  badge: { color:'#93c5fd', marginTop:4, fontWeight:'700' },
  btnrow: { flexDirection:'row', gap:8, marginTop:10 },
  primary: { backgroundColor:'#3b82f6', paddingVertical:10, paddingHorizontal:14, borderRadius:10 },
  secondary: { backgroundColor:'#1f2937', paddingVertical:10, paddingHorizontal:14, borderRadius:10 },
  danger: { backgroundColor:'#ef4444', paddingVertical:10, paddingHorizontal:14, borderRadius:10 },
  btnText: { color:'white', fontWeight:'700' },
  btnStrong: { color:'white', fontWeight:'900' },
  form: { gap:6 },
  label: { color:'#9ca3af' },
  input: { backgroundColor:'#0b1220', color:'white', borderWidth:1, borderColor:'#1f2937', borderRadius:10, paddingHorizontal:10, paddingVertical:10 },
  colors: { flexDirection:'row', flexWrap:'wrap', gap:8, marginVertical:6 },
  swatch: { width:28, height:28, borderRadius:999, borderColor:'#0b0f14' },
});
