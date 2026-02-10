// apps/mobile/lib/data.ts
import kinksEN from '../data/kinks.en.json';
import kinksES from '../data/kinks.es.json';

export type Tier = 'romance' | 'soft' | 'naughty' | 'xxx';

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
};

const ROMANCE_HINTS = new Set([
  'romance',
  'romantic',
  'date',
  'kissing',
  'cuddling',
  'massage',
  'aftercare',
  'affirmations',
  'quality-time',
  'compliments',
  'hand-holding',
  'eye-contact',
  'slow-dance',
  'sensual',
]);

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

function baseTitle(t: string) {
  return t.replace(STEP_SUFFIX, '').trim();
}
function baseSlug(s: string) {
  return s.replace(STEP_IN_SLUG, '').trim();
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

function defaultTier(k: KinkItem): Tier {
  if (k.tier) return k.tier as Tier;

  const intensity = Number(k.intensityScale ?? 1);
  const tags = (Array.isArray(k.tags) ? k.tags : []).map((t: string) =>
    String(t).toLowerCase()
  );
  const cat = String(k.category || '').toLowerCase();

  // If tags clearly indicate romance, prefer 'romance'
  if (tags.some((t) => ROMANCE_HINTS.has(t))) return 'romance';

  // If very gentle and no spicy hints, treat as romance
  const hasSpice =
    tags.some((t) => SPICY_HINTS.has(t)) ||
    /(impact|anal|group|control|bondage|xxx|hard)/i.test(cat);
  if (intensity <= 1 && !hasSpice) return 'romance';

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
  return intensity <= 1 ? 'romance' : 'soft';
}

export function useKinks(lang: 'en' | 'es' = 'en') {
  const base = (lang === 'es' ? (kinksES as any) : (kinksEN as any)) as any[];
  // 1) Collapse step/phase/stage sequences into one item (e.g., "Anal training" from multiple steps)
  const collapsed = collapseSequences(base);
  // 2) Apply tier classification
  const kinks: KinkItem[] = collapsed.map((k) => ({
    ...k,
    tier: defaultTier(k),
  }));
  const kinksById = Object.fromEntries(kinks.map((k) => [k.id, k]));
  return { kinks, kinksById };
}
