import { Audio } from 'expo-av';

// Short UI sound effects for the game flow. All playback is fire-and-forget
// and fails silently — sound is an accent, never a requirement.
export type GameSoundName =
  | 'cardFlip'
  | 'rouletteSpin'
  | 'success'
  | 'consequence'
  | 'timerEnd';

const SOUND_SOURCES: Record<GameSoundName, number> = {
  cardFlip: require('../assets/sounds/card-flip.mp3'),
  rouletteSpin: require('../assets/sounds/roulette-spin.mp3'),
  success: require('../assets/sounds/success.mp3'),
  consequence: require('../assets/sounds/consequence.mp3'),
  timerEnd: require('../assets/sounds/timer-end.mp3'),
};

// Keep effects at an accent level rather than full volume.
const GAME_SOUND_VOLUME = 0.7;

const loadedSounds = new Map<GameSoundName, Audio.Sound>();
let audioModeConfigured = false;

async function configureAudioModeOnce() {
  if (audioModeConfigured) return;
  audioModeConfigured = true;

  // Respect the iOS hardware silent switch (discretion first) and never
  // interrupt other audio the couple may have playing.
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: false,
    shouldDuckAndroid: false,
    staysActiveInBackground: false,
  });
}

async function getSound(name: GameSoundName): Promise<Audio.Sound> {
  const cached = loadedSounds.get(name);
  if (cached) return cached;

  const { sound } = await Audio.Sound.createAsync(SOUND_SOURCES[name], {
    volume: GAME_SOUND_VOLUME,
  });
  loadedSounds.set(name, sound);
  return sound;
}

/**
 * Play a game sound effect. Safe to call from any handler — errors (missing
 * audio hardware, interrupted session, web) are swallowed.
 */
export function playGameSound(name: GameSoundName): void {
  (async () => {
    await configureAudioModeOnce();
    const sound = await getSound(name);
    await sound.replayAsync();
  })().catch(() => {
    // Sound is best-effort; gameplay continues without it.
  });
}

/** Release all cached sound instances (e.g. when leaving the game section). */
export async function unloadGameSounds(): Promise<void> {
  const sounds = [...loadedSounds.values()];
  loadedSounds.clear();
  await Promise.all(
    sounds.map((sound) =>
      sound.unloadAsync().catch(() => {
        // Already unloaded — nothing to release.
      })
    )
  );
}
