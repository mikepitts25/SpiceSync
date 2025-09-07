import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'spicesync', encryptionKey: 'device-bound-key' });

type VoteVal = 'yes'|'no'|'maybe'|undefined;

type Store = {
  ageConfirmed: boolean;
  discreteMode: boolean;
  votesA: Record<string, VoteVal>;
  votesB: Record<string, VoteVal>;
  setAgeConfirmed(v:boolean): void;
  setDiscreteMode(v:boolean): void;
  vote(id:string, val:VoteVal): void;
};

function load<T>(k:string, def:T): T {
  try {
    const v = storage.getString(k);
    if (!v) return def;
    return JSON.parse(v);
  } catch { return def; }
}
function save<T>(k:string, v:T){ storage.set(k, JSON.stringify(v)); }

export const useSettings = create<Pick<Store,'ageConfirmed'|'discreteMode'|'setAgeConfirmed'|'setDiscreteMode'>>((set,get)=>({
  ageConfirmed: load('ageConfirmed', false),
  discreteMode: load('discreteMode', false),
  setAgeConfirmed(v){ set({ ageConfirmed: v }); save('ageConfirmed', v); },
  setDiscreteMode(v){ set({ discreteMode: v }); save('discreteMode', v); },
}));

export const useVotes = create<Pick<Store,'votesA'|'votesB'|'vote'>>((set,get)=>({
  votesA: load('votesA', {}),
  votesB: load('votesB', {}),
  vote(id, val){
    const me = 'A';
    const key = me==='A' ? 'votesA' : 'votesB';
    const nxt = { ...(get() as any)[key], [id]: val };
    set({ [key]: nxt } as any);
    save(key, nxt);
  }
}));