type SupportedLanguage = 'en' | 'es';

const KINK_CATEGORY_LABELS: Record<
  SupportedLanguage,
  Readonly<Record<string, string>>
> = {
  en: {
    all: 'All categories',
    aftercare: 'Aftercare',
    communication: 'Communication',
    environment: 'Environment',
    group: 'Group play',
    light_restraint: 'Light restraint',
    paired_play: 'Partner play',
    props_and_toys: 'Props and toys',
    roleplay: 'Role play',
    sensory: 'Sensory play',
  },
  es: {
    all: 'Todas las categorías',
    aftercare: 'Cuidados posteriores',
    communication: 'Comunicación',
    environment: 'Entorno',
    group: 'Juego en grupo',
    light_restraint: 'Ataduras suaves',
    paired_play: 'Juego en pareja',
    props_and_toys: 'Accesorios y juguetes',
    roleplay: 'Juego de roles',
    sensory: 'Juego sensorial',
  },
};

function humanizeCategory(category: string): string {
  const readable = category.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!readable) return '';
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

export function formatKinkCategory(
  category: string | null | undefined,
  language: SupportedLanguage
): string {
  if (!category) return '';
  return KINK_CATEGORY_LABELS[language][category] ?? humanizeCategory(category);
}
