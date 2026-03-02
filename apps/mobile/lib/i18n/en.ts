// English translations
export const en = {
  // Navigation / Tabs
  tabs: {
    discover: 'Discover',
    vote: 'Vote',
    game: 'Game',
    matches: 'Matches',
    browse: 'Browse',
  },

  // Common
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    next: 'Next',
    back: 'Back',
    confirm: 'Confirm',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    error: 'Error',
    success: 'Success',
  },

  // Onboarding
  onboarding: {
    welcome: 'Welcome to SpiceSync',
    tagline: 'Discover new experiences together',
    privacyTitle: 'Privacy First',
    privacyText: 'Your data stays on your device. No accounts, no tracking, no cloud storage.',
    ageTitle: 'Age Verification',
    ageText: 'You must be 18 or older to use this app.',
    ageConfirm: 'I am 18 or older',
    profileTitle: 'Create Your Profile',
    profileText: 'Set up your profile to get started. You can add a partner later.',
    profileName: 'Your Name',
    profileEmoji: 'Choose an Emoji',
  },

  // Settings
  settings: {
    title: 'Settings',
    profiles: 'Profiles',
    profilesDesc: "Manage who's swiping, emoji, and names.",
    manageProfiles: 'Manage profiles',
    language: 'Language',
    languageDesc: 'Choose your app language. Content and UI will switch instantly.',
    english: 'English',
    spanish: 'Español',
    activeProfile: 'Active profile',
    noProfile: 'No profile selected',
    resetVotes: 'Reset selections?',
    resetVotesDesc: "This will remove all votes for {{name}}. This cannot be undone.",
    resetConfirm: 'Selections cleared',
    resetConfirmDesc: "{{name}}'s votes have been removed.",
    notifications: 'Notifications',
    notificationsDesc: 'Reminders to check your matches and daily suggestions.',
    exportData: 'Export Data',
    exportDesc: 'Save your matches and preferences as JSON.',
    exportButton: 'Export to File',
    privacy: 'Privacy',
    privacyDesc: 'All data stays local on your device.',
    about: 'About',
    version: 'Version 1.0.0',
  },

  // Profile Management
  profiles: {
    title: 'Profiles',
    addProfile: 'Add Profile',
    partner: 'Partner',
    you: 'You',
    nameLabel: 'Name',
    emojiLabel: 'Emoji',
    newProfileTitle: 'New Profile',
    editProfile: 'Edit Profile',
    created: 'Created',
    noProfile: 'No profile selected',
    selectProfile: 'Select an active profile first.',
    needPartner: 'Need another profile',
    createPartner: 'Create a second profile to seed matches.',
  },

  // Categories / Discover
  discover: {
    title: 'Discover',
    subtitle: 'Categories',
    searchPlaceholder: 'Search categories...',
    romance: 'Romance',
    soft: 'Soft',
    naughty: 'Naughty',
    xxx: 'XXX',
  },

  // Deck / Voting
  deck: {
    title: 'Vote',
    subtitle: 'Swipe to vote',
    yes: 'Yes',
    no: 'No',
    maybe: 'Maybe',
    skip: 'Skip',
    swipeHint: 'Swipe right for Yes, left for No',
    categoryFilter: 'Category',
    allCategories: 'All Categories',
  },

  // Matches
  matches: {
    title: 'Matches',
    subtitle: 'Shared interests',
    emptyTitle: 'No matches yet',
    emptyText: 'Keep voting to find things you both like!',
    bothLike: 'You both like this',
    viewDetails: 'Tap to view details',
  },

  // Game
  game: {
    title: 'Game',
    subtitle: 'Pick a card',
    truth: 'Truth',
    dare: 'Dare',
    challenge: 'Challenge',
    fantasy: 'Fantasy',
    roleplay: 'Roleplay',
    surprise: 'Surprise Me',
    drawCard: 'Draw Card',
    nextCard: 'Next Card',
    intensity: 'Intensity',
    freeCards: 'Free Cards',
    premiumCards: 'Premium Cards',
  },

  // Notifications
  notifications: {
    title: 'Notifications',
    dailySuggestions: 'Daily Suggestions',
    dailySuggestionsDesc: 'Get reminded to check new activities',
    matchAlerts: 'Match Alerts',
    matchAlertsDesc: 'Notify when you have new matches',
    gameReminders: 'Game Reminders',
    gameRemindersDesc: 'Reminders to play the card game',
  },

  // Activity Details
  activity: {
    details: 'Details',
    intensity: 'Intensity',
    category: 'Category',
    tags: 'Tags',
    yourVote: 'Your Vote',
    partnerVote: "Partner's Vote",
    notVoted: 'Not voted yet',
  },
};

export type Translations = typeof en;
