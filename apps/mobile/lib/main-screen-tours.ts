export type MainTourScreenId =
  | 'profiles'
  | 'deck'
  | 'matches'
  | 'conversation'
  | 'game';

export type TourStep = {
  title: string;
  body: string;
};

export const MAIN_TOUR_SCREEN_IDS = [
  'profiles',
  'deck',
  'matches',
  'conversation',
  'game',
] as const satisfies readonly MainTourScreenId[];

export const MAIN_SCREEN_TOURS: Record<MainTourScreenId, TourStep[]> = {
  profiles: [
    {
      title: 'Your active profile',
      body: 'The active profile controls which votes, matches, and preferences you are editing.',
    },
    {
      title: 'Manage local profiles',
      body: 'Switch profiles, add another person, or update profile details from this hub.',
    },
    {
      title: 'Connect with your partner',
      body: 'Use the partner area to add a local profile or create a private invite link.',
    },
  ],
  deck: [
    {
      title: 'Choose an intensity',
      body: 'Use the filter row to focus the deck on softer, bolder, or all activities.',
    },
    {
      title: 'Vote on each card',
      body: 'Tap Pass, Yes, or Maybe. You can also swipe left, right, or up.',
    },
    {
      title: 'Votes stay local',
      body: 'Choices save to the active profile on this device and feed your match results.',
    },
  ],
  matches: [
    {
      title: 'Compare profiles',
      body: 'The banner shows which two profiles are being compared for shared picks.',
    },
    {
      title: 'Review shared picks',
      body: 'Mutual Yes and Mutual Maybe sections show where both profiles chose the same answer.',
    },
    {
      title: 'Share a summary',
      body: 'Share Results sends a short count summary without syncing your private vote data.',
    },
  ],
  conversation: [
    {
      title: 'Pick a prompt category',
      body: 'Use the category row to change the kind of conversation starter you see.',
    },
    {
      title: 'Use prompts together',
      body: 'Move between prompts, skip to a random one, save favorites, or share a question.',
    },
    {
      title: 'Love language prompts',
      body: 'The love language module links to the quiz and can filter prompts around your results.',
    },
  ],
  game: [
    {
      title: 'Choose a level',
      body: 'Levels 1 through 5 control how warm, bold, or intense the game cards feel.',
    },
    {
      title: 'Draw a card',
      body: 'Draw gets a new card, Skip moves on, and Share sends the current card text.',
    },
    {
      title: 'Play at your pace',
      body: 'Timer labels are guidance only. Cards with no limit can take as long as you want.',
    },
  ],
};
