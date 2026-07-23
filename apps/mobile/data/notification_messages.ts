// Notification message bank.
//
// Content rules (see CONTRIBUTING.md): suggestive and playful, never graphic.
// Bodies must stand alone — a notification lands on a lock screen that other
// people can see, so nothing here names an activity or implies anything explicit.
// Anything spicier lives behind the app's age gate, not on the lock screen.

export type NotificationTone = 'playful' | 'warm' | 'curious' | 'bold';

export interface NotificationMessage {
  id: string;
  tone: NotificationTone;
  title: string;
  body: string;
  titleEs: string;
  bodyEs: string;
}

/** Daily nudge to open the deck and vote on new cards. */
export const DAILY_CARD_MESSAGES: NotificationMessage[] = [
  {
    id: 'dc-01',
    tone: 'playful',
    title: '🔥 Tonight has potential',
    body: 'A fresh card is waiting. See if you two think alike.',
    titleEs: '🔥 Esta noche promete',
    bodyEs: 'Hay una carta nueva esperando. A ver si piensan igual.',
  },
  {
    id: 'dc-02',
    tone: 'curious',
    title: '💭 Curious what they said?',
    body: "There's a new card in your deck. Your move.",
    titleEs: '💭 ¿Curiosidad por su respuesta?',
    bodyEs: 'Hay una carta nueva en tu mazo. Te toca.',
  },
  {
    id: 'dc-03',
    tone: 'warm',
    title: '💕 Two minutes, just for you two',
    body: 'Swipe through today’s cards and see where you land.',
    titleEs: '💕 Dos minutos, solo para ustedes',
    bodyEs: 'Desliza las cartas de hoy y descubre dónde coinciden.',
  },
  {
    id: 'dc-04',
    tone: 'bold',
    title: '😏 Feeling adventurous?',
    body: 'Today’s card might surprise you both.',
    titleEs: '😏 ¿Con ganas de aventura?',
    bodyEs: 'La carta de hoy podría sorprenderlos a los dos.',
  },
  {
    id: 'dc-05',
    tone: 'playful',
    title: '✨ Your deck missed you',
    body: 'A few new ideas are ready whenever you are.',
    titleEs: '✨ Tu mazo te extrañó',
    bodyEs: 'Hay ideas nuevas listas cuando tú lo estés.',
  },
  {
    id: 'dc-06',
    tone: 'curious',
    title: '🤔 Yes, maybe, or no?',
    body: 'One card. One honest answer. See what happens.',
    titleEs: '🤔 ¿Sí, quizás o no?',
    bodyEs: 'Una carta. Una respuesta sincera. A ver qué pasa.',
  },
  {
    id: 'dc-07',
    tone: 'warm',
    title: '🌙 Wind down together',
    body: 'End the day with something just between you two.',
    titleEs: '🌙 Relájense juntos',
    bodyEs: 'Terminen el día con algo solo entre ustedes.',
  },
  {
    id: 'dc-08',
    tone: 'bold',
    title: '🌶️ Turn up the heat',
    body: 'Today’s pick leans a little bolder. Take a look.',
    titleEs: '🌶️ Sube la temperatura',
    bodyEs: 'La selección de hoy es un poco más atrevida. Échale un vistazo.',
  },
  {
    id: 'dc-09',
    tone: 'playful',
    title: '💋 Something new to try',
    body: 'A fresh idea landed in your deck today.',
    titleEs: '💋 Algo nuevo que probar',
    bodyEs: 'Una idea nueva llegó hoy a tu mazo.',
  },
  {
    id: 'dc-10',
    tone: 'curious',
    title: '🔓 What haven’t you asked for?',
    body: 'Your deck makes it easy to say it out loud.',
    titleEs: '🔓 ¿Qué no has pedido aún?',
    bodyEs: 'Tu mazo hace más fácil decirlo en voz alta.',
  },
  {
    id: 'dc-11',
    tone: 'warm',
    title: '💫 Small spark, big night',
    body: 'One card could change the whole evening.',
    titleEs: '💫 Chispa pequeña, gran noche',
    bodyEs: 'Una carta podría cambiar toda la noche.',
  },
  {
    id: 'dc-12',
    tone: 'bold',
    title: '👀 They might say yes',
    body: 'Only one way to find out. Open your deck.',
    titleEs: '👀 Podrían decir que sí',
    bodyEs: 'Solo hay una forma de saberlo. Abre tu mazo.',
  },
  {
    id: 'dc-13',
    tone: 'playful',
    title: '🎯 Today’s temptation',
    body: 'Fresh cards, no pressure. Just see what you think.',
    titleEs: '🎯 La tentación de hoy',
    bodyEs: 'Cartas nuevas, sin presión. Solo mira qué opinas.',
  },
  {
    id: 'dc-14',
    tone: 'warm',
    title: '🕯️ Make tonight count',
    body: 'A few swipes now, something to look forward to later.',
    titleEs: '🕯️ Que esta noche valga la pena',
    bodyEs: 'Unos deslizamientos ahora, algo que esperar después.',
  },
  {
    id: 'dc-15',
    tone: 'curious',
    title: '🃏 Ready for today’s card?',
    body: 'It only takes a minute to find your next match.',
    titleEs: '🃏 ¿List@ para la carta de hoy?',
    bodyEs: 'Solo toma un minuto encontrar tu próxima coincidencia.',
  },
  {
    id: 'dc-16',
    tone: 'bold',
    title: '😈 A little daring tonight?',
    body: 'Your deck has something in mind.',
    titleEs: '😈 ¿Un poco atrevid@ esta noche?',
    bodyEs: 'Tu mazo tiene algo en mente.',
  },
  {
    id: 'dc-17',
    tone: 'playful',
    title: '💘 Chemistry check',
    body: 'See how closely your answers line up today.',
    titleEs: '💘 Prueba de química',
    bodyEs: 'Mira qué tanto coinciden sus respuestas hoy.',
  },
  {
    id: 'dc-18',
    tone: 'warm',
    title: '🥂 Here’s to you two',
    body: 'Take a moment together. Today’s cards are ready.',
    titleEs: '🥂 Por ustedes dos',
    bodyEs: 'Tómense un momento juntos. Las cartas de hoy están listas.',
  },
  {
    id: 'dc-19',
    tone: 'curious',
    title: '🔍 Discover something new',
    body: 'There’s more to explore than you’d guess.',
    titleEs: '🔍 Descubre algo nuevo',
    bodyEs: 'Hay más por explorar de lo que imaginas.',
  },
  {
    id: 'dc-20',
    tone: 'bold',
    title: '⚡ Don’t overthink it',
    body: 'Swipe honestly. That’s where the fun starts.',
    titleEs: '⚡ No lo pienses demasiado',
    bodyEs: 'Desliza con sinceridad. Ahí empieza lo divertido.',
  },
];

/** Nudge toward the conversation starters. */
export const CONVERSATION_MESSAGES: NotificationMessage[] = [
  {
    id: 'cv-01',
    tone: 'curious',
    title: '💬 Ask them something real',
    body: 'Today’s conversation starter is ready.',
    titleEs: '💬 Pregúntale algo de verdad',
    bodyEs: 'La pregunta de hoy está lista.',
  },
  {
    id: 'cv-02',
    tone: 'warm',
    title: '☕ One question, one connection',
    body: 'A good one is waiting for you both.',
    titleEs: '☕ Una pregunta, una conexión',
    bodyEs: 'Hay una buena esperándolos.',
  },
  {
    id: 'cv-03',
    tone: 'playful',
    title: '🎤 Your turn to ask',
    body: 'Today’s starter might get you talking for a while.',
    titleEs: '🎤 Te toca preguntar',
    bodyEs: 'La pregunta de hoy podría darles mucho de qué hablar.',
  },
  {
    id: 'cv-04',
    tone: 'bold',
    title: '🔥 Go a little deeper',
    body: 'Today’s question isn’t the safe kind.',
    titleEs: '🔥 Profundiza un poco',
    bodyEs: 'La pregunta de hoy no es de las seguras.',
  },
  {
    id: 'cv-05',
    tone: 'warm',
    title: '💞 Talk before you touch',
    body: 'The best nights start with a good conversation.',
    titleEs: '💞 Hablen antes de tocarse',
    bodyEs: 'Las mejores noches empiezan con una buena conversación.',
  },
  {
    id: 'cv-06',
    tone: 'curious',
    title: '🗝️ What don’t they know yet?',
    body: 'Today’s starter is a good place to begin.',
    titleEs: '🗝️ ¿Qué no saben aún?',
    bodyEs: 'La pregunta de hoy es un buen punto de partida.',
  },
  {
    id: 'cv-07',
    tone: 'playful',
    title: '😊 Two minutes of honesty',
    body: 'Trade answers and see where it goes.',
    titleEs: '😊 Dos minutos de sinceridad',
    bodyEs: 'Intercambien respuestas y vean a dónde llega.',
  },
  {
    id: 'cv-08',
    tone: 'bold',
    title: '💥 Say the thing',
    body: 'Today’s question makes it easier to bring up.',
    titleEs: '💥 Dilo de una vez',
    bodyEs: 'La pregunta de hoy hace más fácil sacar el tema.',
  },
  {
    id: 'cv-09',
    tone: 'warm',
    title: '🌹 Date night, no plans needed',
    body: 'Pull up a conversation starter and just talk.',
    titleEs: '🌹 Cita sin planes',
    bodyEs: 'Abre una pregunta y simplemente hablen.',
  },
  {
    id: 'cv-10',
    tone: 'curious',
    title: '🎭 Fantasy or reality?',
    body: 'Today’s starter blurs the line. Ask them.',
    titleEs: '🎭 ¿Fantasía o realidad?',
    bodyEs: 'La pregunta de hoy difumina la línea. Pregúntale.',
  },
  {
    id: 'cv-11',
    tone: 'playful',
    title: '🍷 Pour one, ask one',
    body: 'A new conversation starter just unlocked.',
    titleEs: '🍷 Sirve una copa, haz una pregunta',
    bodyEs: 'Se desbloqueó una nueva pregunta.',
  },
  {
    id: 'cv-12',
    tone: 'warm',
    title: '💌 Check in with each other',
    body: 'Today’s question is worth the five minutes.',
    titleEs: '💌 Conéctense un momento',
    bodyEs: 'La pregunta de hoy vale los cinco minutos.',
  },
];

/** Nudge to look at fresh mutual matches. Only used when matches exist. */
export const MATCH_MESSAGES: NotificationMessage[] = [
  {
    id: 'mt-01',
    tone: 'bold',
    title: '💥 You two matched',
    body: 'You’re both curious about the same thing. Take a look.',
    titleEs: '💥 Coincidieron',
    bodyEs: 'A los dos les da curiosidad lo mismo. Échale un vistazo.',
  },
  {
    id: 'mt-02',
    tone: 'playful',
    title: '🔥 Great minds…',
    body: 'You said yes. So did they. See what it was.',
    titleEs: '🔥 Grandes mentes…',
    bodyEs: 'Dijiste que sí. Ellos también. Descubre qué fue.',
  },
  {
    id: 'mt-03',
    tone: 'warm',
    title: '💞 Something to look forward to',
    body: 'You have matches waiting to be planned.',
    titleEs: '💞 Algo que esperar con ganas',
    bodyEs: 'Tienes coincidencias esperando a ser planeadas.',
  },
  {
    id: 'mt-04',
    tone: 'curious',
    title: '👀 Turns out you agree',
    body: 'Your matches are ready when you are.',
    titleEs: '👀 Resulta que están de acuerdo',
    bodyEs: 'Tus coincidencias están listas cuando tú lo estés.',
  },
  {
    id: 'mt-05',
    tone: 'bold',
    title: '⚡ Ready now',
    body: 'You both said yes. Why wait?',
    titleEs: '⚡ List@s ahora',
    bodyEs: 'Ambos dijeron que sí. ¿Por qué esperar?',
  },
  {
    id: 'mt-06',
    tone: 'playful',
    title: '🎉 New common ground',
    body: 'Your match list just got more interesting.',
    titleEs: '🎉 Nuevo terreno en común',
    bodyEs: 'Tu lista de coincidencias se puso más interesante.',
  },
];

/** Streak keep-alive. Encouraging, never guilt-trippy. */
export const STREAK_MESSAGES: NotificationMessage[] = [
  {
    id: 'st-01',
    tone: 'playful',
    title: '🔥 Keep the streak alive',
    body: 'One swipe keeps it going.',
    titleEs: '🔥 Mantén viva la racha',
    bodyEs: 'Un desliz y sigue viva.',
  },
  {
    id: 'st-02',
    tone: 'warm',
    title: '✨ Don’t lose your momentum',
    body: 'A quick visit keeps your streak going.',
    titleEs: '✨ No pierdas el impulso',
    bodyEs: 'Una visita rápida mantiene tu racha.',
  },
  {
    id: 'st-03',
    tone: 'curious',
    title: '📆 Still going strong?',
    body: 'Your streak is waiting on today’s card.',
    titleEs: '📆 ¿Sigues con todo?',
    bodyEs: 'Tu racha espera la carta de hoy.',
  },
  {
    id: 'st-04',
    tone: 'bold',
    title: '💪 Nice run so far',
    body: 'Keep it up — today’s card takes a minute.',
    titleEs: '💪 Buena racha hasta ahora',
    bodyEs: 'Sigue así: la carta de hoy toma un minuto.',
  },
];

export type MessageCategory =
  | 'daily_card'
  | 'conversation'
  | 'match'
  | 'streak';

const BANKS: Record<MessageCategory, NotificationMessage[]> = {
  daily_card: DAILY_CARD_MESSAGES,
  conversation: CONVERSATION_MESSAGES,
  match: MATCH_MESSAGES,
  streak: STREAK_MESSAGES,
};

export function getMessageBank(
  category: MessageCategory
): NotificationMessage[] {
  return BANKS[category];
}

/** Pull the localized title/body off a message. */
export function localizeMessage(
  message: NotificationMessage,
  language: string
): { title: string; body: string } {
  return language === 'es'
    ? { title: message.titleEs, body: message.bodyEs }
    : { title: message.title, body: message.body };
}

/**
 * Deal `count` messages with no repeats until the bank is exhausted.
 *
 * The scheduler queues a rolling window of days at once, so a plain random pick
 * would routinely put the same text on two adjacent days. Shuffling a copy of
 * the bank and dealing from it guarantees a full cycle before anything repeats;
 * only if `count` exceeds the bank size do we reshuffle and continue.
 */
export function pickMessageSequence(
  category: MessageCategory,
  count: number,
  random: () => number = Math.random
): NotificationMessage[] {
  const bank = BANKS[category];
  if (!bank.length || count <= 0) return [];

  const picked: NotificationMessage[] = [];
  let pool: NotificationMessage[] = [];

  for (let i = 0; i < count; i += 1) {
    if (!pool.length) {
      pool = shuffle(bank, random);
      // Messages are dealt with pop(), so the next one out is the last element.
      // If a reshuffle would repeat the message we just dealt, swap it forward.
      const last = pool.length - 1;
      const previous = picked[picked.length - 1];
      if (previous && pool.length > 1 && pool[last].id === previous.id) {
        [pool[last], pool[0]] = [pool[0], pool[last]];
      }
    }
    picked.push(pool.pop() as NotificationMessage);
  }

  return picked;
}

function shuffle(
  items: NotificationMessage[],
  random: () => number
): NotificationMessage[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
