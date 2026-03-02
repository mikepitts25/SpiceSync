// i18n hook for translations
import { useSettingsStore } from '../../src/stores/settingsStore';
import { en } from './en';
import { es } from './es';

const translations = {
  en,
  es,
};

export function useTranslation() {
  const language = useSettingsStore((state) => state.language);
  const t = translations[language] || en;
  return { t, language };
}

// Helper to interpolate values in translation strings
export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] || match);
}

export type { Translations } from './en';
