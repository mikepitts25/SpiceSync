export type GameHubModeId =
  | 'spice-deck'
  | 'match-missions'
  | 'know-me-better'
  | 'couple-dice';

export type GameHubMode = {
  id: GameHubModeId;
  titleKey: 'spiceDeck' | 'matchMissions' | 'knowMeBetter' | 'coupleDice';
  descriptionKey:
    | 'spiceDeckDescription'
    | 'matchMissionsDescription'
    | 'knowMeBetterDescription'
    | 'coupleDiceDescription';
  icon: 'layers' | 'target' | 'heart-handshake' | 'dices';
  route:
    | '/(game)/spice-deck'
    | '/(game)/match-missions'
    | '/(game)/know-me-better'
    | '/(game)/couple-dice';
  available: boolean;
};

export const GAME_HUB_MODES: readonly GameHubMode[] = [
  {
    id: 'spice-deck',
    titleKey: 'spiceDeck',
    descriptionKey: 'spiceDeckDescription',
    icon: 'layers',
    route: '/(game)/spice-deck',
    available: true,
  },
  {
    id: 'match-missions',
    titleKey: 'matchMissions',
    descriptionKey: 'matchMissionsDescription',
    icon: 'target',
    route: '/(game)/match-missions',
    available: true,
  },
  {
    id: 'know-me-better',
    titleKey: 'knowMeBetter',
    descriptionKey: 'knowMeBetterDescription',
    icon: 'heart-handshake',
    route: '/(game)/know-me-better',
    available: true,
  },
  {
    id: 'couple-dice',
    titleKey: 'coupleDice',
    descriptionKey: 'coupleDiceDescription',
    icon: 'dices',
    route: '/(game)/couple-dice',
    available: true,
  },
];

export function getGameHubMode(id: GameHubModeId): GameHubMode {
  const mode = GAME_HUB_MODES.find((item) => item.id === id);

  if (!mode) {
    throw new Error(`Unknown game hub mode: ${id}`);
  }

  return mode;
}
