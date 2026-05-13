import kinksEN from '../data/kinks.en.json';
import kinksES from '../data/kinks.es.json';
import kinksNew from '../data/kinks-new.json';
import kinksComprehensive from '../data/kinks-comprehensive.json';
import { kinkConversationTopics } from '../data/kinkConversationTopics';

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

describe('kink content policy', () => {
  it('excludes kinks centered on actual physical harm', () => {
    const removedIds = new Set(REMOVED_PHYSICAL_HARM_IDS);
    const removedSlugs = new Set(REMOVED_PHYSICAL_HARM_SLUGS);

    for (const [language, kinks] of [
      ['en', kinksEN],
      ['es', kinksES],
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
});
