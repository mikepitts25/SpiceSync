// Derives consent-forward guidance for a kink from its optional enrichment
// metadata, falling back to neutral defaults inferred from category, tier,
// intensity, and tags. Pure and side-effect free so match explanations and
// tests can rely on it directly.
import type { ExperienceLevel, RiskLevel, Tier, TrustLevel } from '../data';

export type GuidanceSource = {
  id: string;
  title: string;
  category?: string;
  tags?: string[];
  intensityScale?: number;
  tier?: Tier;
  subcategory?: string;
  dynamicTags?: string[];
  riskLevel?: RiskLevel;
  trustLevel?: TrustLevel;
  experienceLevel?: ExperienceLevel;
  prep?: string[];
  safetyNotes?: string[];
  aftercare?: string[];
  consentPrompts?: string[];
  relatedKinks?: string[];
  fantasyOnlyAllowed?: boolean;
};

export type KinkGuidance = {
  riskLevel: RiskLevel;
  trustLevel: TrustLevel;
  experienceLevel: ExperienceLevel;
  prep: string[];
  safetyNotes: string[];
  aftercare: string[];
  consentPrompts: string[];
};

// Tags that indicate elevated physical or emotional risk regardless of tier.
const HIGH_RISK_TAGS = new Set([
  'breath',
  'breathplay',
  'choking',
  'impact',
  'knife',
  'wax',
  'fire',
  'rope',
  'suspension',
  'consensual-non-consent',
  'cnc',
  'degradation',
  'humiliation',
]);

const MEDIUM_RISK_TAGS = new Set([
  'bondage',
  'restraint',
  'anal',
  'public',
  'exhibition',
  'group',
  'control',
  'domination',
  'submission',
  'discipline',
  'denial',
  'chastity',
  'edging',
  'temperature',
]);

const EMOTIONAL_RISK_TAGS = new Set([
  'degradation',
  'humiliation',
  'consensual-non-consent',
  'cnc',
  'cuckold',
  'group',
  'exhibition',
  'public',
]);

const lowerTags = (source: GuidanceSource): string[] =>
  [...(source.tags ?? []), ...(source.dynamicTags ?? [])].map((tag) =>
    String(tag).toLowerCase()
  );

export function deriveRiskLevel(source: GuidanceSource): RiskLevel {
  if (source.riskLevel) return source.riskLevel;

  const tags = lowerTags(source);
  if (tags.some((tag) => HIGH_RISK_TAGS.has(tag))) return 'high';

  const intensity = Number(source.intensityScale ?? 1);
  const hasMediumTag = tags.some((tag) => MEDIUM_RISK_TAGS.has(tag));
  if (source.tier === 'xxx' || (hasMediumTag && intensity >= 2)) return 'high';
  if (hasMediumTag || intensity >= 3 || source.tier === 'naughty')
    return 'medium';
  return 'low';
}

export function deriveTrustLevel(source: GuidanceSource): TrustLevel {
  if (source.trustLevel) return source.trustLevel;
  const risk = deriveRiskLevel(source);
  const tags = lowerTags(source);
  if (risk === 'high' || tags.some((tag) => EMOTIONAL_RISK_TAGS.has(tag))) {
    return 'deep';
  }
  if (risk === 'medium') return 'established';
  return 'any';
}

export function deriveExperienceLevel(source: GuidanceSource): ExperienceLevel {
  if (source.experienceLevel) return source.experienceLevel;
  const risk = deriveRiskLevel(source);
  if (risk === 'high') return 'advanced';
  if (risk === 'medium') return 'intermediate';
  return 'beginner';
}

function defaultPrep(source: GuidanceSource, risk: RiskLevel): string[] {
  const prep = [
    'Talk it through first: what each of you wants, and what is off the table.',
    'Agree on a safeword or clear stop signal before you begin.',
  ];
  if (risk !== 'low') {
    prep.push(
      'Gather anything you need ahead of time so you can stay present.'
    );
  }
  if (risk === 'high') {
    prep.push(
      'Learn the basics from a trusted resource before trying this, and plan an easy way out of any position or restraint.'
    );
  }
  const tags = lowerTags(source);
  if (tags.includes('anal')) {
    prep.push('Plan for plenty of lubricant and a slow, gradual pace.');
  }
  if (tags.some((tag) => ['bondage', 'restraint', 'rope'].includes(tag))) {
    prep.push('Keep safety shears or a quick release within reach.');
  }
  return prep;
}

function defaultSafetyNotes(source: GuidanceSource, risk: RiskLevel): string[] {
  const notes = [
    'Either of you can pause or stop at any time, no reason needed.',
  ];
  if (risk === 'medium') {
    notes.push(
      'Start well below the level you think you can handle and build up.'
    );
  }
  if (risk === 'high') {
    notes.push(
      'This carries real physical or emotional risk. Keep communication open the whole time and never leave a restrained partner alone.'
    );
  }
  const tags = lowerTags(source);
  if (tags.some((tag) => EMOTIONAL_RISK_TAGS.has(tag))) {
    notes.push(
      'Strong feelings can surface afterwards. Plan a gentle check-in for the next day too.'
    );
  }
  return notes;
}

function defaultAftercare(source: GuidanceSource, risk: RiskLevel): string[] {
  const aftercare = [
    'Check in: water, warmth, closeness, or quiet time — whatever you each need.',
  ];
  if (risk !== 'low') {
    aftercare.push(
      'Talk about what felt good and what you would change next time.'
    );
  }
  if (risk === 'high') {
    aftercare.push(
      'Watch for delayed drop over the next day or two and be extra kind to each other.'
    );
  }
  return aftercare;
}

function defaultConsentPrompts(source: GuidanceSource): string[] {
  return [
    `What does a good version of "${source.title}" look like for each of you?`,
    'What would make either of you want to stop or slow down?',
    'How will you check in with each other while you try it?',
  ];
}

export function getKinkGuidance(source: GuidanceSource): KinkGuidance {
  const riskLevel = deriveRiskLevel(source);
  return {
    riskLevel,
    trustLevel: deriveTrustLevel(source),
    experienceLevel: deriveExperienceLevel(source),
    prep: source.prep?.length ? source.prep : defaultPrep(source, riskLevel),
    safetyNotes: source.safetyNotes?.length
      ? source.safetyNotes
      : defaultSafetyNotes(source, riskLevel),
    aftercare: source.aftercare?.length
      ? source.aftercare
      : defaultAftercare(source, riskLevel),
    consentPrompts: source.consentPrompts?.length
      ? source.consentPrompts
      : defaultConsentPrompts(source),
  };
}
