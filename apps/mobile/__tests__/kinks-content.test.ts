import kinksEN from '../data/kinks.en.json';
import kinksES from '../data/kinks.es.json';
import kinksNew from '../data/kinks-new.json';
import kinksComprehensive from '../data/kinks-comprehensive.json';
import { kinkConversationTopics } from '../data/kinkConversationTopics';

const MIN_PRIMARY_KINK_COUNT = 250;

const REMOVED_PHYSICAL_HARM_IDS = [
  '0110',
  '0116',
  '0117',
  '0120',
  '0122',
  '0123',
  '0127',
  '0130',
  '0131',
];

const REMOVED_PHYSICAL_HARM_SLUGS = [
  'breath-play',
  'knife-play',
  'fire-play',
  'sounding',
  'needle-play',
  'blood-play',
  'intense-cbt',
  'branding',
  'scarification',
];

const KINK_MATCH_EXPANSION_SLUGS = [
  'latex-leather-fetish',
  'foot-worship',
  'cock-ball-teasing',
  'gag-play',
  'edge-play-boundaries',
  'bisexual-fantasy-roleplay',
  'forniphilia',
  'cum-play',
  'bukkake-fantasy',
  'cum-on-clothes',
  'lactation-fantasy',
  'saliva-play',
  'breast-expansion-fantasy',
  'belly-expansion-fantasy',
  'consensual-public-touch',
  'dogging-fantasy',
  'swingers-club-spectating',
  'gloryhole-fantasy',
  'blindfolded-exhibitionism',
  'dare-play',
  'uniform-fetish',
  'fmm-threesome-fantasy',
  'ffm-threesome-fantasy',
  'bed-sharing',
  'sleepy-wakeup-fantasy',
  'travel-sex',
  'bar-club-sex',
  'barebacking-discussion',
  'genital-humiliation',
  'public-humiliation',
  'seduction-play',
  'blindfolded-group-play',
  'kinky-events',
  'aftercare-ritual',
  'arousal-play',
  'breeding-kink',
  'foam-bubble-fetish',
  'nudism',
  'watching-male-male-porn',
  'watching-female-female-porn',
  'service-submission',
  'service-top',
  'praise',
  'rules-rituals',
  'low-protocol-ds',
  'high-protocol-fantasy',
  'permission-play',
  'task-based-teasing',
  'obedience-games',
  'reward-system',
  'brat-taming',
  'gentle-discipline',
  'scene-negotiation',
  'safeword-practice',
  'check-in-pauses',
  'aftercare-kit',
  'subspace-aftercare',
  'domspace-aftercare',
  'collar-of-consideration',
  'posture-training',
  'kneeling-rituals',
  'honorifics',
  'body-worship',
  'hand-worship',
  'voice-arousal',
  'audio-erotica-together',
  'earplug-sensory-play',
  'textured-gloves',
  'satin-sheets',
  'stocking-fetish',
  'corset-fetish',
  'shoe-fetish',
  'perfume-scent-play',
  'sweat-musk-appreciation',
  'towel-restraint',
  'bed-restraints',
  'decorative-shibari',
  'rope-harness',
  'rope-bunny-role',
  'rigger-role',
  'spreader-bar-fantasy',
  'light-ankle-restraints',
  'over-the-clothes-teasing',
  'clothed-intimacy',
  'clothed-domination',
  'lingerie-shopping-together',
  'outfit-reveal',
  'mask-play',
  'masquerade-roleplay',
  'cosplay-roleplay',
  'photographer-model-roleplay',
  'artist-muse-roleplay',
  'royal-servant-roleplay',
  'detective-interview-roleplay',
  'vacation-fling-roleplay',
  'hotel-room-fantasy',
  'office-after-hours-fantasy',
  'elevator-fantasy',
  'private-balcony-fantasy',
  'kitchen-counter-fantasy',
  'couch-play',
  'floor-play',
  'mirror-sex',
  'mutual-porn-picks',
  'remote-control-toy',
  'toy-shopping-together',
  'strap-on-discussion',
  'strap-on',
  'pegging-discussion',
  'pegging',
  'anal-training-boundaries',
  'soft-swap-discussion',
  'watching-partner-flirt',
  'compersion-talk',
  'play-party-boundaries',
  'munch-date',
  'audio-message-teasing',
  'voice-note-dares',
  'remote-date-night',
  'shared-fantasy-journal',
];

const KINK_MATCH_EXCLUDED_EXPANSION_SLUGS = [
  'incest-fantasy',
  'blood-play',
  'water-sports',
  'water-sports-expansion',
  'age-play',
  'extreme-age-play',
  'pee-play',
  'scat-play',
  'scat-play-expansion',
  'bestiality',
  'formicophilia',
  'mysophilia',
  'dendrophilia',
  'macrophilia',
  'extreme-bondage',
  'extreme-humiliation',
  'extreme-suspension',
  'extreme-objectification',
  'extreme-anal',
  'extreme-stretching',
  'extreme-sensory',
  'invasive-medical',
  'fisting',
  'consensual-slavery',
  'vacuum-bedding',
];

const PAIRED_KINK_KEYS = [
  'oral-pleasure',
  'light-teasing',
  'spanking',
  'wrist-restraints',
  'handcuffs',
  'vibrator',
  'nipple-play',
  'nipple-clamps',
  'biting',
  'hair-pulling',
  'dildo',
  'paddle-spanking',
  'chastity',
  'degradation',
  'foot-worship',
  'collaring',
  'leash-play',
  'praise',
  'strap-on',
  'pegging',
];

const ROLE_ORIENTED_DESCRIPTION_PATTERN =
  /\b(your partner|your partner's|each other|each other's|give your|giving or receiving|receive|receiving|take turns|focus on|watching their reactions)\b/i;
const SPANISH_ROLE_ORIENTED_DESCRIPTION_PATTERN =
  /\b(tu pareja|su pareja|de su pareja|del otro|el uno por el otro|el uno al otro|uno al otro|túrnense|turnense|dar o recibir|recibir|quien recibe|dar placer|la otra|el otro|una pareja|otra pareja|a la pareja|observas sus reacciones)\b/i;
const LEGACY_ROLE_TITLE_PATTERN =
  /\s*\((?:giving|receiving|give|receive|giving oral|receiving oral|dar|recibir|dar oral|recibir oral)\)\s*$/i;

type KinkContentRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  descriptionEs?: string;
  pairMode?: boolean;
  pairKey?: string;
  pairRole?: string;
};

function duplicates(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}

describe('kink content policy', () => {
  it('excludes kinks centered on actual physical harm', () => {
    const removedIds = new Set(REMOVED_PHYSICAL_HARM_IDS);
    const removedSlugs = new Set(REMOVED_PHYSICAL_HARM_SLUGS);

    for (const [language, kinks] of [
      ['en', kinksEN as KinkContentRecord[]],
      ['es', kinksES as KinkContentRecord[]],
    ] as const) {
      expect({
        language,
        ids: kinks
          .filter((kink) => removedIds.has(kink.id))
          .map((kink) => kink.id),
        slugs: kinks
          .filter((kink) => removedSlugs.has(kink.slug))
          .map((kink) => kink.slug),
      }).toEqual({ language, ids: [], slugs: [] });
    }

    for (const [source, kinks] of [
      ['new', kinksNew],
      ['comprehensive', kinksComprehensive],
    ] as const) {
      expect({
        source,
        slugs: kinks
          .filter((kink) => removedSlugs.has(kink.slug))
          .map((kink) => kink.slug),
      }).toEqual({ source, slugs: [] });
    }

    expect(
      Object.keys(kinkConversationTopics).filter((slug) =>
        removedSlugs.has(slug)
      )
    ).toEqual([]);
  });

  it('models role-selectable kink activities as one topic row in both languages', () => {
    for (const [language, kinks] of [
      ['en', kinksEN as KinkContentRecord[]],
      ['es', kinksES as KinkContentRecord[]],
    ] as const) {
      for (const pairKey of PAIRED_KINK_KEYS) {
        const item = kinks.find((kink) => kink.slug === pairKey);

        expect({
          language,
          pairKey,
          found: Boolean(item),
          pairMode: item?.pairMode,
          pairKeyValue: item?.pairKey,
          pairRole: item?.pairRole,
        }).toEqual({
          language,
          pairKey,
          found: true,
          pairMode: true,
          pairKeyValue: undefined,
          pairRole: undefined,
        });
      }
    }
  });

  it('does not keep legacy give or receive source rows', () => {
    for (const [language, kinks] of [
      ['en', kinksEN as KinkContentRecord[]],
      ['es', kinksES as KinkContentRecord[]],
    ] as const) {
      expect({
        language,
        legacyPairFields: kinks
          .filter((kink) => kink.pairKey || kink.pairRole)
          .map((kink) => kink.slug),
        legacyRoleSuffixes: kinks
          .filter((kink) => /-(give|receive)$/.test(kink.slug))
          .map((kink) => kink.slug),
        legacyRoleTitles: kinks
          .filter((kink) => LEGACY_ROLE_TITLE_PATTERN.test(kink.title))
          .map((kink) => kink.title),
      }).toEqual({
        language,
        legacyPairFields: [],
        legacyRoleSuffixes: [],
        legacyRoleTitles: [],
      });
    }
  });

  it('keeps role-selectable descriptions neutral to give, receive, or both', () => {
    const roleOrientedDescriptions = kinksEN
      .filter((kink) => ROLE_ORIENTED_DESCRIPTION_PATTERN.test(kink.description))
      .map((kink) => `${kink.id} ${kink.title}: ${kink.description}`);

    expect(roleOrientedDescriptions).toEqual([]);
  });

  it('keeps Spanish role-selectable descriptions neutral to give, receive, or both', () => {
    const roleOrientedDescriptions = [
      ...kinksES
        .filter((kink) =>
          SPANISH_ROLE_ORIENTED_DESCRIPTION_PATTERN.test(kink.description)
        )
        .map((kink) => `es ${kink.id} ${kink.title}: ${kink.description}`),
      ...kinksEN
        .filter((kink) =>
          SPANISH_ROLE_ORIENTED_DESCRIPTION_PATTERN.test(kink.descriptionEs)
        )
        .map((kink) => `en.descriptionEs ${kink.id} ${kink.title}: ${kink.descriptionEs}`),
    ];

    expect(roleOrientedDescriptions).toEqual([]);
  });

  it('includes the allowed Kink Match expansion concepts in primary language data', () => {
    for (const [language, kinks] of [
      ['en', kinksEN],
      ['es', kinksES],
    ] as const) {
      const slugs = new Set(kinks.map((kink) => kink.slug));

      expect({
        language,
        missing: KINK_MATCH_EXPANSION_SLUGS.filter((slug) => !slugs.has(slug)),
      }).toEqual({ language, missing: [] });
    }
  });

  it('keeps primary language data at the target size with matching slug sets', () => {
    expect(kinksEN.length).toBeGreaterThanOrEqual(MIN_PRIMARY_KINK_COUNT);
    expect(kinksES.length).toBe(kinksEN.length);

    const enSlugs = kinksEN.map((kink) => kink.slug).sort();
    const esSlugs = kinksES.map((kink) => kink.slug).sort();

    expect(esSlugs).toEqual(enSlugs);
  });

  it('does not duplicate primary language ids or slugs', () => {
    for (const [language, kinks] of [
      ['en', kinksEN],
      ['es', kinksES],
    ] as const) {
      expect({
        language,
        duplicateIds: duplicates(kinks.map((kink) => kink.id)),
        duplicateSlugs: duplicates(kinks.map((kink) => kink.slug)),
      }).toEqual({ language, duplicateIds: [], duplicateSlugs: [] });
    }
  });

  it('does not add excluded Kink Match expansion concepts to primary language data', () => {
    for (const [language, kinks] of [
      ['en', kinksEN],
      ['es', kinksES],
    ] as const) {
      const slugs = new Set(kinks.map((kink) => kink.slug));

      expect({
        language,
        present: KINK_MATCH_EXCLUDED_EXPANSION_SLUGS.filter((slug) =>
          slugs.has(slug)
        ),
      }).toEqual({ language, present: [] });
    }
  });
});
