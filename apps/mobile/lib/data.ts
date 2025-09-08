import kinksEN from '../data/kinks.en.json';
import kinksES from '../data/kinks.es.json';

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

export function useKinks(lang: 'en' | 'es' = 'en') {
  const base = (lang === 'es' ? (kinksES as any) : (kinksEN as any)) as any[];
  const kinks: KinkItem[] = base.map(k => ({ ...k, tier: defaultTier(k) }));
  const kinksById = Object.fromEntries(kinks.map(k => [k.id, k]));
  return { kinks, kinksById };
}
