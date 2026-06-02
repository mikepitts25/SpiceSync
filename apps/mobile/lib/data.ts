// apps/mobile/lib/data.ts
import kinksEN from '../data/kinks.en.json';
import kinksES from '../data/kinks.es.json';

export type Tier = 'soft' | 'naughty' | 'xxx';
export type PairRole = 'give' | 'receive';
export type PairPreference = PairRole | 'both';

export type KinkItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  intensityScale: 1 | 2 | 3;
  aliases: string[];
  createdBy: 'system' | 'user';
  tier?: Tier;
  pairKey?: string;
  pairRole?: PairRole;
  pairMode?: boolean;
  sourceIds?: string[];
  availablePairRoles?: PairPreference[];
};

const SPICY_HINTS = new Set([
  'anal',
  'training',
  'impact',
  'bondage',
  'restraint',
  'roleplay',
  'control',
  'domination',
  'submission',
  'group',
  'exhibition',
  'public',
  'voyeur',
  'chastity',
  'cuckold',
  'pegging',
  'discipline',
  'edging',
  'denial',
]);

const STEP_SUFFIX = /\s*(?:—|-|:)?\s*(?:step|phase|stage)\s*\d+\s*$/i;
const STEP_IN_SLUG = /-(?:step|phase|stage)-\d+$/i;
const ROLE_TITLE_SUFFIX =
  /\s*\((?:giving|receiving|give|receive|giving oral|predator|prey)\)\s*$/i;
const ROLE_SLUG_SUFFIX = /-(?:give|receive|giving|receiving|predator|prey)$/i;
const ROLE_ONLY_TAGS = new Set(['give', 'giving', 'receive', 'receiving']);

function baseTitle(t: string) {
  return t.replace(STEP_SUFFIX, '').trim();
}
function baseSlug(s: string) {
  return s.replace(STEP_IN_SLUG, '').trim();
}

function pairTitle(t: string) {
  return baseTitle(t).replace(ROLE_TITLE_SUFFIX, '').trim();
}

function pairSlug(s: string) {
  return baseSlug(s).replace(ROLE_SLUG_SUFFIX, '').trim();
}

function mergeTags(a: KinkItem, b: KinkItem): string[] {
  const tags = new Set([...(a.tags || []), ...(b.tags || [])]);
  return Array.from(tags).filter(
    (tag) => !ROLE_ONLY_TAGS.has(String(tag).toLowerCase())
  );
}

function collapseSequences(items: KinkItem[]): KinkItem[] {
  const map = new Map<string, KinkItem>();
  for (const it of items) {
    const key = (
      it.slug ? baseSlug(it.slug) : baseTitle(it.title || '')
    ).toLowerCase();
    if (!map.has(key)) {
      // first one wins; normalize title/slug if they had step suffixes
      const first = { ...it };
      first.title = baseTitle(String(first.title || ''));
      first.slug = baseSlug(String(first.slug || first.title || ''));
      // if description is empty/overly specific, give a neutral progressive description
      if (!first.description || STEP_SUFFIX.test(String(it.title || ''))) {
        first.description =
          first.description ||
          'A progressive, consensual practice—start at a comfortable level and adjust gradually together.';
      }
      map.set(key, first);
    } else {
      // Optionally merge tags/aliases (kept minimal to avoid bloat)
      const prev = map.get(key)!;
      const tags = new Set([...(prev.tags || []), ...(it.tags || [])]);
      prev.tags = Array.from(tags);
      map.set(key, prev);
    }
  }
  return Array.from(map.values());
}

function collapsePairs(items: KinkItem[]): KinkItem[] {
  const byPairKey = new Map<string, KinkItem[]>();
  const pairedSourceIds = new Set<string>();
  const pairedItems: KinkItem[] = [];

  for (const item of items) {
    if (!item.pairMode || !item.pairKey || !item.pairRole) continue;
    const current = byPairKey.get(item.pairKey) || [];
    current.push(item);
    byPairKey.set(item.pairKey, current);
  }

  for (const [pairKey, pairItems] of byPairKey) {
    const give = pairItems.find((item) => item.pairRole === 'give');
    const receive = pairItems.find((item) => item.pairRole === 'receive');
    if (!give || !receive) continue;

    pairedSourceIds.add(give.id);
    pairedSourceIds.add(receive.id);
    pairedItems.push({
      ...give,
      id: `pair:${pairKey}`,
      slug: pairSlug(give.slug || receive.slug || pairKey),
      title: pairTitle(give.title || receive.title || pairKey),
      description: give.description || receive.description,
      tags: mergeTags(give, receive),
      pairKey,
      pairMode: true,
      pairRole: undefined,
      sourceIds: [give.id, receive.id],
      availablePairRoles: ['give', 'receive', 'both'],
      tier: defaultTier(give),
    });
  }

  return [
    ...items.filter((item) => !pairedSourceIds.has(item.id)),
    ...pairedItems,
  ];
}

function defaultTier(k: KinkItem): Tier {
  if (k.tier) return k.tier as Tier;

  const intensity = Number(k.intensityScale ?? 1);
  const tags = (Array.isArray(k.tags) ? k.tags : []).map((t: string) =>
    String(t).toLowerCase()
  );
  const cat = String(k.category || '').toLowerCase();

  const hasSpice =
    tags.some((t) => SPICY_HINTS.has(t)) ||
    /(impact|anal|group|control|bondage|xxx|hard)/i.test(cat);

  // Roleplay / sensory / light → soft by default
  if (
    cat.includes('roleplay') ||
    cat.includes('sensory') ||
    cat.includes('light')
  )
    return 'soft';

  // Spicier toys/groups/control escalate by intensity
  if (
    /(props|toys|group|environment|communication|control|bondage|impact)/i.test(
      cat
    ) ||
    hasSpice
  ) {
    return intensity >= 3 ? 'xxx' : 'naughty';
  }

  // Fallbacks
  return 'soft';
}

export function useKinks(lang: 'en' | 'es' = 'en') {
  const base = (lang === 'es' ? (kinksES as any) : (kinksEN as any)) as any[];
  // 1) Collapse step/phase/stage sequences into one item (e.g., "Anal training" from multiple steps)
  const collapsed = collapsePairs(collapseSequences(base));
  // 2) Apply tier classification
  const kinks: KinkItem[] = collapsed.map((k) => ({
    ...k,
    tier: defaultTier(k),
  }));
  const kinksById = Object.fromEntries(kinks.map((k) => [k.id, k]));
  return { kinks, kinksById };
}
