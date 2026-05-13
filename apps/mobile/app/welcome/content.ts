export const WELCOME_SCREEN_ORDER = [
  'brand',
  'explore',
  'answer',
  'overlap',
  'agegate',
] as const;

export type WelcomeScreenId = (typeof WELCOME_SCREEN_ORDER)[number];
export type WelcomeValueScreenId = Exclude<
  WelcomeScreenId,
  'brand' | 'agegate'
>;
export type WelcomeIllustration = 'cards' | 'privateVotes' | 'overlap';

export type WelcomeValueScreen = {
  id: WelcomeValueScreenId;
  illustration: WelcomeIllustration;
  title: string;
  description: string;
};

export const WELCOME_VALUE_SCREENS = [
  {
    id: 'explore',
    illustration: 'cards',
    title: 'Explore without pressure',
    description: 'Browse ideas privately and move at your own pace.',
  },
  {
    id: 'answer',
    illustration: 'privateVotes',
    title: 'Rate in secret. Reveal together.',
    description:
      'Be brutally honest. Your partner sees nothing until you both decide to share your codes.',
  },
  {
    id: 'overlap',
    illustration: 'overlap',
    title: 'No awkwardness. Ever.',
    description:
      'Matches only reveal shared interest. What you voted no on? Your partner never knows.',
  },
] as const satisfies readonly WelcomeValueScreen[];

export const WELCOME_VALUE_SCREEN_BY_ID = WELCOME_VALUE_SCREENS.reduce(
  (acc, screen) => {
    acc[screen.id] = screen;
    return acc;
  },
  {} as Record<WelcomeValueScreenId, WelcomeValueScreen>
);
