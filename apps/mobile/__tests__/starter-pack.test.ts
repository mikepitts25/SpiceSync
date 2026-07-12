import enCatalog from '../data/kinks.en.json';
import esCatalog from '../data/kinks.es.json';
import {
  STARTER_PACK_KINK_IDS,
  filterToStarterPack,
  isStarterPackActive,
  isStarterPackKink,
} from '../lib/kinks/starterPack';

type CatalogItem = {
  id: string;
  tier?: string;
  intensityScale?: number;
};

const enItems = enCatalog as unknown as CatalogItem[];
const esItems = esCatalog as unknown as CatalogItem[];

describe('starter pack', () => {
  it('curates around fifteen unique ids', () => {
    expect(STARTER_PACK_KINK_IDS.length).toBe(15);
    expect(new Set(STARTER_PACK_KINK_IDS).size).toBe(
      STARTER_PACK_KINK_IDS.length
    );
  });

  it('only references soft, low-intensity kinks present in both catalogs', () => {
    const enById = new Map(enItems.map((item) => [item.id, item]));
    const esIds = new Set(esItems.map((item) => item.id));

    for (const id of STARTER_PACK_KINK_IDS) {
      const item = enById.get(id);
      expect(item).toBeDefined();
      expect(item?.tier).toBe('soft');
      expect(item?.intensityScale ?? 1).toBeLessThanOrEqual(1);
      expect(esIds.has(id)).toBe(true);
    }
  });

  it('filters a kink list down to the pack', () => {
    const sample = [{ id: '0001' }, { id: '9999' }, { id: '0021' }];
    expect(filterToStarterPack(sample).map((item) => item.id)).toEqual([
      '0001',
      '0021',
    ]);
    expect(isStarterPackKink('0001')).toBe(true);
    expect(isStarterPackKink('9999')).toBe(false);
  });

  it('activates only for fresh, undismissed profiles', () => {
    expect(isStarterPackActive({ votedCount: 0, dismissed: false })).toBe(true);
    expect(isStarterPackActive({ votedCount: 14, dismissed: false })).toBe(
      true
    );
    expect(isStarterPackActive({ votedCount: 15, dismissed: false })).toBe(
      false
    );
    expect(isStarterPackActive({ votedCount: 200, dismissed: false })).toBe(
      false
    );
    expect(isStarterPackActive({ votedCount: 0, dismissed: true })).toBe(false);
  });
});
