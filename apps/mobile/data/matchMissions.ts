// Generic, consent-forward mission copy templates for Match Missions.
//
// Privacy rule: the same rule as lib/gameMatchDeck.ts — only mutual-yes kinks
// (data both partners have already revealed to each other) ever feed a
// mission candidate. Templates are intentionally generic: they invite a
// conversation or an agreed activity around the matched topic, and never
// invent explicit actions from a kink label.
export type MissionLanguage = 'en' | 'es';

type MissionTemplate = (title: string) => string;

export const DEFAULT_MISSION_DURATION_MS = 24 * 60 * 60 * 1000;

const MISSION_TEMPLATES: Record<MissionLanguage, MissionTemplate[]> = {
  en: [
    (title) =>
      `You both said yes to "${title}". Set aside a few minutes this week to talk about what trying it could look like for you two.`,
    (title) =>
      `"${title}" is a mutual match. Take turns sharing one thing that excites you about it — no pressure to plan anything yet.`,
    (title) =>
      `You matched on "${title}". Agree on one small, comfortable way to explore it together, if and when you're both ready.`,
    (title) =>
      `"${title}" came up as a shared interest. Ask each other what "ready" would look like before you try it.`,
  ],
  es: [
    (title) =>
      `Ambos dijeron que sí a "${title}". Tómense unos minutos esta semana para hablar de cómo sería intentarlo juntos.`,
    (title) =>
      `"${title}" es un match mutuo. Túrnense para compartir algo que les emocione de eso — sin presión de planear nada todavía.`,
    (title) =>
      `Hicieron match en "${title}". Acuerden una forma pequeña y cómoda de explorarlo juntos, si y cuando ambos estén listos.`,
    (title) =>
      `"${title}" apareció como interés compartido. Pregúntense cómo se vería estar "listos" antes de intentarlo.`,
  ],
};

export function buildMissionCopy(
  title: string,
  templateIndex: number,
  language: MissionLanguage = 'en'
): string {
  const templates = MISSION_TEMPLATES[language] ?? MISSION_TEMPLATES.en;
  const template =
    templates[
      ((templateIndex % templates.length) + templates.length) % templates.length
    ];
  return template(title);
}

export function missionTemplateCount(language: MissionLanguage = 'en'): number {
  return (MISSION_TEMPLATES[language] ?? MISSION_TEMPLATES.en).length;
}
