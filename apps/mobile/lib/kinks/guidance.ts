// Derives consent-forward guidance for a kink from its optional enrichment
// metadata, falling back to neutral defaults inferred from category, tier,
// intensity, and tags. Pure and side-effect free so match explanations and
// tests can rely on it directly.
import type { ExperienceLevel, RiskLevel, Tier, TrustLevel } from '../data';
import { interpolate } from '../i18n';
import { en } from '../i18n/en';
import { es } from '../i18n/es';

export type GuidanceLanguage = 'en' | 'es';

const TABLE = { en, es };

function copyFor(language: GuidanceLanguage) {
  return TABLE[language].matchExplanation;
}

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

function defaultPrep(
  source: GuidanceSource,
  risk: RiskLevel,
  language: GuidanceLanguage
): string[] {
  const t = copyFor(language);
  const prep = [t.prepTalkFirst, t.prepSafeword];
  if (risk !== 'low') {
    prep.push(t.prepGather);
  }
  if (risk === 'high') {
    prep.push(t.prepLearnBasics);
  }
  const tags = lowerTags(source);
  if (tags.includes('anal')) {
    prep.push(t.prepAnalLube);
  }
  if (tags.some((tag) => ['bondage', 'restraint', 'rope'].includes(tag))) {
    prep.push(t.prepBondageShears);
  }
  return prep;
}

function defaultSafetyNotes(
  source: GuidanceSource,
  risk: RiskLevel,
  language: GuidanceLanguage
): string[] {
  const t = copyFor(language);
  const notes = [t.safetyPauseAnytime];
  if (risk === 'medium') {
    notes.push(t.safetyStartBelow);
  }
  if (risk === 'high') {
    notes.push(t.safetyRealRisk);
  }
  const tags = lowerTags(source);
  if (tags.some((tag) => EMOTIONAL_RISK_TAGS.has(tag))) {
    notes.push(t.safetyStrongFeelings);
  }
  return notes;
}

function defaultAftercare(
  source: GuidanceSource,
  risk: RiskLevel,
  language: GuidanceLanguage
): string[] {
  const t = copyFor(language);
  const aftercare = [t.aftercareCheckIn];
  if (risk !== 'low') {
    aftercare.push(t.aftercareTalkAbout);
  }
  if (risk === 'high') {
    aftercare.push(t.aftercareWatchForDrop);
  }
  return aftercare;
}

function defaultConsentPrompts(
  source: GuidanceSource,
  language: GuidanceLanguage
): string[] {
  const t = copyFor(language);
  return [
    interpolate(t.consentGoodVersion, { title: source.title }),
    t.consentWantToStop,
    t.consentCheckIn,
  ];
}

export function getKinkGuidance(
  source: GuidanceSource,
  language: GuidanceLanguage = 'en'
): KinkGuidance {
  const riskLevel = deriveRiskLevel(source);
  return {
    riskLevel,
    trustLevel: deriveTrustLevel(source),
    experienceLevel: deriveExperienceLevel(source),
    prep: source.prep?.length
      ? source.prep
      : defaultPrep(source, riskLevel, language),
    safetyNotes: source.safetyNotes?.length
      ? source.safetyNotes
      : defaultSafetyNotes(source, riskLevel, language),
    aftercare: source.aftercare?.length
      ? source.aftercare
      : defaultAftercare(source, riskLevel, language),
    consentPrompts: source.consentPrompts?.length
      ? source.consentPrompts
      : defaultConsentPrompts(source, language),
  };
}
