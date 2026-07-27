// Curated question bank for Know Me Better: a same-device prediction quiz
// about the couple. Every question has 3-4 structured options so answers
// never need to be persisted as free text (v1 constraint — see PLAN).
export type KnowMeBetterCategory =
  | 'playful'
  | 'preferences'
  | 'connection'
  | 'date_night';

export type KnowMeBetterQuestion = {
  id: string;
  category: KnowMeBetterCategory;
  prompt: string;
  options: string[];
};

const en: KnowMeBetterQuestion[] = [
  {
    id: 'kmb-en-01',
    category: 'playful',
    prompt: 'Pick a silly nickname you would secretly enjoy',
    options: ['Sunshine', 'Trouble', 'Captain', 'Muffin'],
  },
  {
    id: 'kmb-en-02',
    category: 'playful',
    prompt: 'Choose your go-to goofy dance move',
    options: [
      'The shoulder shimmy',
      'The finger point',
      'The full spin',
      'The slow sway',
    ],
  },
  {
    id: 'kmb-en-03',
    category: 'playful',
    prompt: 'Which snack do you sneak the most?',
    options: ['Chips', 'Chocolate', 'Ice cream', 'Cheese and crackers'],
  },
  {
    id: 'kmb-en-04',
    category: 'playful',
    prompt: 'Pick your karaoke go-to',
    options: [
      'Power ballad',
      'Boy band anthem',
      '90s hip hop',
      'I would never sing',
    ],
  },
  {
    id: 'kmb-en-05',
    category: 'playful',
    prompt: 'Choose the animal that matches your morning mood',
    options: ['Sloth', 'Rooster', 'Cat', 'Owl'],
  },
  {
    id: 'kmb-en-06',
    category: 'playful',
    prompt: 'Pick your comfort movie genre',
    options: ['Comedy', 'Action', 'Rom-com', 'Documentary'],
  },
  {
    id: 'kmb-en-07',
    category: 'playful',
    prompt: 'Choose how you would spend a rainy afternoon',
    options: ['Nap', 'Board games', 'Cooking something new', 'Marathon a show'],
  },
  {
    id: 'kmb-en-08',
    category: 'playful',
    prompt: 'Pick your ideal weekend superpower',
    options: ['Teleportation', 'Reading minds', 'Flying', 'Freezing time'],
  },
  {
    id: 'kmb-en-09',
    category: 'preferences',
    prompt: 'Pick the affection you crave most on a normal day',
    options: [
      'Hugs',
      'Words of encouragement',
      'A thoughtful favor',
      'Quality time together',
    ],
  },
  {
    id: 'kmb-en-10',
    category: 'preferences',
    prompt: 'Choose your ideal way to unwind after a hard day',
    options: [
      'Talk it out',
      'Quiet alone time first',
      'Physical comfort',
      'Distraction, like a show',
    ],
  },
  {
    id: 'kmb-en-11',
    category: 'preferences',
    prompt: 'Pick the compliment that means the most',
    options: [
      'You make me laugh',
      'You make me feel safe',
      'You are so thoughtful',
      'You are attractive to me',
    ],
  },
  {
    id: 'kmb-en-12',
    category: 'preferences',
    prompt: 'Choose your preferred way to get an apology',
    options: [
      'Said out loud',
      'Written note',
      'A hug',
      'Given time, then talk',
    ],
  },
  {
    id: 'kmb-en-13',
    category: 'preferences',
    prompt: 'Pick the temperature you actually prefer the room at',
    options: [
      'Cool and cozy under blankets',
      'Warm',
      'No strong preference',
      'Depends on the day',
    ],
  },
  {
    id: 'kmb-en-14',
    category: 'preferences',
    prompt: 'Choose your ideal morning greeting',
    options: [
      'A kiss',
      'Coffee brought to you',
      'A few extra minutes of quiet',
      'A good morning text',
    ],
  },
  {
    id: 'kmb-en-15',
    category: 'preferences',
    prompt: 'Pick how you like to be comforted when stressed',
    options: [
      'Just listen',
      'Help me solve it',
      'Distract me',
      'Sit with me quietly',
    ],
  },
  {
    id: 'kmb-en-16',
    category: 'preferences',
    prompt: 'Choose the small gesture that means the most',
    options: [
      'A surprise snack',
      'A handwritten note',
      'Doing a chore for me',
      'A random compliment',
    ],
  },
  {
    id: 'kmb-en-17',
    category: 'connection',
    prompt:
      'Pick the thing you think your partner would say is your best quality',
    options: ['Sense of humor', 'Loyalty', 'Patience', 'Ambition'],
  },
  {
    id: 'kmb-en-18',
    category: 'connection',
    prompt: 'Choose the moment you feel closest to your partner',
    options: [
      'Deep conversation',
      'Doing nothing together',
      'Laughing about something silly',
      'Working as a team on something',
    ],
  },
  {
    id: 'kmb-en-19',
    category: 'connection',
    prompt: 'Pick what you think your partner would call your love language',
    options: [
      'Words of affirmation',
      'Acts of service',
      'Physical touch',
      'Quality time',
    ],
  },
  {
    id: 'kmb-en-20',
    category: 'connection',
    prompt:
      'Choose which memory you think your partner would pick as a favorite',
    options: [
      'An early date',
      'A random ordinary day',
      'A trip together',
      'A time you helped each other through something hard',
    ],
  },
  {
    id: 'kmb-en-21',
    category: 'connection',
    prompt: 'Pick the topic you two talk about most',
    options: [
      'Daily life and logistics',
      'Dreams and goals',
      'Silly random stuff',
      'Feelings and check-ins',
    ],
  },
  {
    id: 'kmb-en-22',
    category: 'connection',
    prompt: 'Choose what you think makes your partner feel most appreciated',
    options: [
      'Being thanked out loud',
      'Being helped without asking',
      'Getting undivided attention',
      'Small surprises',
    ],
  },
  {
    id: 'kmb-en-23',
    category: 'connection',
    prompt:
      'Pick what you think your partner is most proud of about your relationship',
    options: [
      'How well you communicate',
      'How much fun you have',
      'How much you support each other',
      'How comfortable you are together',
    ],
  },
  {
    id: 'kmb-en-24',
    category: 'date_night',
    prompt: 'Pick your ideal date night vibe',
    options: [
      'Cozy night in',
      'Fancy dinner out',
      'Adventure or activity',
      'Something new neither of you has tried',
    ],
  },
  {
    id: 'kmb-en-25',
    category: 'date_night',
    prompt: 'Choose your dream date destination',
    options: [
      'Beach',
      'City exploring',
      'Mountains or nature',
      'Somewhere with great food',
    ],
  },
  {
    id: 'kmb-en-26',
    category: 'date_night',
    prompt: 'Pick your go-to date night snack or drink',
    options: [
      'Wine',
      'Popcorn',
      'Takeout from your favorite spot',
      'Dessert first',
    ],
  },
  {
    id: 'kmb-en-27',
    category: 'date_night',
    prompt: 'Choose the date night activity you would say yes to fastest',
    options: [
      'Cooking class',
      'Live music',
      'Game night',
      'A long walk and talk',
    ],
  },
  {
    id: 'kmb-en-28',
    category: 'date_night',
    prompt: 'Pick your ideal date night length',
    options: [
      'A quick couple hours',
      'A full evening',
      'An entire day',
      'A whole weekend getaway',
    ],
  },
  {
    id: 'kmb-en-29',
    category: 'date_night',
    prompt: 'Choose who you think plans better surprise dates',
    options: [
      'You',
      'Your partner',
      'You are about equal',
      'Neither of you plans ahead',
    ],
  },
  {
    id: 'kmb-en-30',
    category: 'date_night',
    prompt: 'Pick the outfit vibe you would choose for a date night',
    options: [
      'Dressed up',
      'Comfy casual',
      'Something in between',
      'Whatever is clean',
    ],
  },
];

const es: KnowMeBetterQuestion[] = [
  {
    id: 'kmb-es-01',
    category: 'playful',
    prompt: 'Elige un apodo tonto que secretamente disfrutarías',
    options: ['Sol', 'Traviesa/o', 'Capitán/a', 'Bizcochito'],
  },
  {
    id: 'kmb-es-02',
    category: 'playful',
    prompt: 'Elige tu paso de baile más tonto',
    options: [
      'El meneo de hombros',
      'El señalar con el dedo',
      'El giro completo',
      'El vaivén lento',
    ],
  },
  {
    id: 'kmb-es-03',
    category: 'playful',
    prompt: '¿Qué botana comes a escondidas más seguido?',
    options: ['Papas fritas', 'Chocolate', 'Helado', 'Queso y galletas'],
  },
  {
    id: 'kmb-es-04',
    category: 'playful',
    prompt: 'Elige tu canción de karaoke favorita',
    options: [
      'Balada poderosa',
      'Himno de boy band',
      'Hip hop de los 90',
      'Nunca cantaría',
    ],
  },
  {
    id: 'kmb-es-05',
    category: 'playful',
    prompt: 'Elige el animal que combina con tu humor matutino',
    options: ['Perezoso', 'Gallo', 'Gato', 'Lechuza'],
  },
  {
    id: 'kmb-es-06',
    category: 'playful',
    prompt: 'Elige tu género de película favorito para relajarte',
    options: ['Comedia', 'Acción', 'Comedia romántica', 'Documental'],
  },
  {
    id: 'kmb-es-07',
    category: 'playful',
    prompt: 'Elige cómo pasarías una tarde lluviosa',
    options: [
      'Siesta',
      'Juegos de mesa',
      'Cocinar algo nuevo',
      'Ver una serie completa',
    ],
  },
  {
    id: 'kmb-es-08',
    category: 'playful',
    prompt: 'Elige tu superpoder ideal de fin de semana',
    options: [
      'Teletransportación',
      'Leer mentes',
      'Volar',
      'Congelar el tiempo',
    ],
  },
  {
    id: 'kmb-es-09',
    category: 'preferences',
    prompt: 'Elige el cariño que más deseas en un día normal',
    options: [
      'Abrazos',
      'Palabras de aliento',
      'Un favor pensado',
      'Tiempo de calidad juntos',
    ],
  },
  {
    id: 'kmb-es-10',
    category: 'preferences',
    prompt: 'Elige tu forma ideal de relajarte tras un día difícil',
    options: [
      'Hablarlo',
      'Tiempo solo primero',
      'Contacto físico',
      'Distracción, como una serie',
    ],
  },
  {
    id: 'kmb-es-11',
    category: 'preferences',
    prompt: 'Elige el cumplido que más significa para ti',
    options: [
      'Me haces reír',
      'Me haces sentir seguro/a',
      'Eres muy detallista',
      'Me atraes',
    ],
  },
  {
    id: 'kmb-es-12',
    category: 'preferences',
    prompt: 'Elige tu forma preferida de recibir una disculpa',
    options: [
      'Dicha en voz alta',
      'Nota escrita',
      'Un abrazo',
      'Con tiempo, y luego hablar',
    ],
  },
  {
    id: 'kmb-es-13',
    category: 'preferences',
    prompt: '¿A qué temperatura prefieres realmente el cuarto?',
    options: [
      'Fresco y acurrucado en mantas',
      'Cálido',
      'Sin preferencia fuerte',
      'Depende del día',
    ],
  },
  {
    id: 'kmb-es-14',
    category: 'preferences',
    prompt: 'Elige tu saludo matutino ideal',
    options: [
      'Un beso',
      'Que te traigan café',
      'Unos minutos extra de silencio',
      'Un mensaje de buenos días',
    ],
  },
  {
    id: 'kmb-es-15',
    category: 'preferences',
    prompt: 'Elige cómo te gusta que te consuelen cuando estás estresado/a',
    options: [
      'Solo que me escuchen',
      'Que me ayuden a resolverlo',
      'Que me distraigan',
      'Que se sienten conmigo en silencio',
    ],
  },
  {
    id: 'kmb-es-16',
    category: 'preferences',
    prompt: 'Elige el pequeño gesto que más significa',
    options: [
      'Una botana sorpresa',
      'Una nota escrita a mano',
      'Que hagan una tarea por ti',
      'Un cumplido al azar',
    ],
  },
  {
    id: 'kmb-es-17',
    category: 'connection',
    prompt: 'Elige lo que crees que tu pareja diría que es tu mejor cualidad',
    options: ['Sentido del humor', 'Lealtad', 'Paciencia', 'Ambición'],
  },
  {
    id: 'kmb-es-18',
    category: 'connection',
    prompt: 'Elige el momento en que te sientes más cerca de tu pareja',
    options: [
      'Conversación profunda',
      'No hacer nada juntos',
      'Reírse de algo tonto',
      'Trabajar en equipo en algo',
    ],
  },
  {
    id: 'kmb-es-19',
    category: 'connection',
    prompt: 'Elige cuál crees que tu pareja diría que es tu lenguaje del amor',
    options: [
      'Palabras de afirmación',
      'Actos de servicio',
      'Contacto físico',
      'Tiempo de calidad',
    ],
  },
  {
    id: 'kmb-es-20',
    category: 'connection',
    prompt: 'Elige qué recuerdo crees que tu pareja escogería como su favorito',
    options: [
      'Una cita de los primeros días',
      'Un día ordinario al azar',
      'Un viaje juntos',
      'Un momento en que se ayudaron con algo difícil',
    ],
  },
  {
    id: 'kmb-es-21',
    category: 'connection',
    prompt: 'Elige el tema del que más hablan ustedes dos',
    options: [
      'Vida diaria y logística',
      'Sueños y metas',
      'Cosas tontas al azar',
      'Sentimientos y cómo están',
    ],
  },
  {
    id: 'kmb-es-22',
    category: 'connection',
    prompt: 'Elige qué crees que hace sentir más apreciado/a a tu pareja',
    options: [
      'Que le agradezcan en voz alta',
      'Que le ayuden sin pedirlo',
      'Recibir atención completa',
      'Pequeñas sorpresas',
    ],
  },
  {
    id: 'kmb-es-23',
    category: 'connection',
    prompt:
      'Elige de qué crees que tu pareja está más orgullosa de su relación',
    options: [
      'Qué tan bien se comunican',
      'Cuánto se divierten',
      'Cuánto se apoyan',
      'Qué cómodos están juntos',
    ],
  },
  {
    id: 'kmb-es-24',
    category: 'date_night',
    prompt: 'Elige tu ambiente ideal para una noche de cita',
    options: [
      'Noche tranquila en casa',
      'Cena elegante afuera',
      'Aventura o actividad',
      'Algo que ninguno haya probado',
    ],
  },
  {
    id: 'kmb-es-25',
    category: 'date_night',
    prompt: 'Elige tu destino de cita soñado',
    options: [
      'Playa',
      'Explorar la ciudad',
      'Montañas o naturaleza',
      'Un lugar con muy buena comida',
    ],
  },
  {
    id: 'kmb-es-26',
    category: 'date_night',
    prompt: 'Elige tu botana o bebida favorita para una cita',
    options: [
      'Vino',
      'Palomitas',
      'Comida para llevar de tu lugar favorito',
      'Postre primero',
    ],
  },
  {
    id: 'kmb-es-27',
    category: 'date_night',
    prompt: 'Elige la actividad de cita a la que dirías que sí más rápido',
    options: [
      'Clase de cocina',
      'Música en vivo',
      'Noche de juegos',
      'Una caminata larga y platicar',
    ],
  },
  {
    id: 'kmb-es-28',
    category: 'date_night',
    prompt: 'Elige la duración ideal de una cita',
    options: [
      'Un par de horas rápidas',
      'Toda una tarde',
      'Un día entero',
      'Una escapada de fin de semana',
    ],
  },
  {
    id: 'kmb-es-29',
    category: 'date_night',
    prompt: '¿Quién crees que planea mejor las citas sorpresa?',
    options: [
      'Tú',
      'Tu pareja',
      'Están parejos',
      'Ninguno de los dos planea con anticipación',
    ],
  },
  {
    id: 'kmb-es-30',
    category: 'date_night',
    prompt: 'Elige el estilo de ropa que elegirías para una cita',
    options: [
      'Elegante',
      'Cómodo y casual',
      'Algo intermedio',
      'Lo que esté limpio',
    ],
  },
];

export const KNOW_ME_BETTER_QUESTIONS: Record<
  'en' | 'es',
  KnowMeBetterQuestion[]
> = {
  en,
  es,
};
