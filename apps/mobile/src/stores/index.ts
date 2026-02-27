// Unified Store Exports
// All stores consolidated for SpiceSync 2026

// Settings - Single source of truth
export { useSettingsStore, useSettings } from './settingsStore';
export type { SettingsState, Profile } from './settingsStore';

// Votes
export { useVotesStore } from './votes';
export type { VoteValue } from './votes';

// Premium
export { usePremiumStore } from './premium';
export type { SubscriptionTier, Feature } from './premium';

// Achievements
export { useAchievementsStore } from './achievements';
export type { Achievement, AchievementTier } from './achievements';

// Leveling
export { useLevelingStore } from './leveling';
export type { Level, LevelAction } from './leveling';

// Custom Activities
export { useCustomActivitiesStore } from './customActivities';
export type { CustomActivity } from './customActivities';

// Nudges
export { useNudgesStore } from './nudges';
export type { Nudge, NudgeType } from './nudges';
