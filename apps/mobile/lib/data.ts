import baseEN from '../data/kinks.en.json';
import baseES from '../data/kinks.es.json';

// Optional extras (exist in EN now; ES can be added later)
let extraEN: any[] = [];
let extraES: any[] = [];
try { extraEN = require('../data/kinks.extra.en.json'); } catch {}
try { extraES = require('../data/kinks.extra.es.json'); } catch {}

export type Tier = 'romance'|'soft'|'naughty'|'xxx';

export type KinkItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  intensityScale: 1|2|3;
  aliases: string[];
  createdBy: 'system'|'user';
  tier?: Tier;
};

function defaultTier(k: any): Tier {
  if (k.tier) return k.tier as Tier;
  const c = (k.category || '').toLowerCase();
  if (c.includes('roleplay') || c.includes('light') || c.includes('sensory')) return 'soft';
  return 'romance';
}

function dedupeById(arr: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const it of arr) {
    if (!seen.has(it.id)) { seen.add(it.id); out.push(it); }
  }
  return out;
}

export function useKinks(lang:'en'|'es'='en') {
  const base = (lang==='es' ? (baseES as any) : (baseEN as any)) as any[];
  const extra = (lang==='es' ? extraES : extraEN) as any[];

  const merged = dedupeById([...base, ...extra]);
  const kinks: KinkItem[] = merged.map(k => ({ ...k, tier: defaultTier(k) }));
  const kinksById = Object.fromEntries(kinks.map(k=>[k.id, k]));
  return { kinks, kinksById };
}
