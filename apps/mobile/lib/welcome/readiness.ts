export const WELCOME_READINESS_REQUIREMENTS = [
  { id: 'adult' },
  { id: 'consent' },
  { id: 'privacy' },
] as const;

export type WelcomeReadinessRequirementId =
  (typeof WELCOME_READINESS_REQUIREMENTS)[number]['id'];

export type WelcomeReadinessState = Partial<
  Record<WelcomeReadinessRequirementId, boolean>
>;

export function hasCompletedReadiness(checked: WelcomeReadinessState): boolean {
  return WELCOME_READINESS_REQUIREMENTS.every(
    (requirement) => checked[requirement.id] === true
  );
}
