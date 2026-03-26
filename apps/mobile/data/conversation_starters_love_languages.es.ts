// apps/mobile/data/conversation_starters_love_languages.es.ts
// Lenguajes del Amor - Preguntas de conversación
// Traducciones al español de conversation_starters_love_languages.ts

import { ConversationStarter } from '../lib/conversationStarters';

export const loveLanguagesStartersES: ConversationStarter[] = [
  // Palabras de afirmación
  {
    id: 'conv-ll-001',
    category: 'love_languages',
    intensity: 2,
    question: "¿Qué palabras de afirmación necesitas escuchar más de mí?",
    followUps: [
      "¿Cuándo fue la última vez que te sentiste verdaderamente apreciado por mí?",
      "¿Qué cumplidos específicos significan más para ti?",
      "¿Cómo puedo recordarte cada día que te amo?"
    ],
    context: "Las palabras tienen poder. Para algunos, escuchar 'te amo' o recibir elogios es la expresión máxima del amor.",
    tags: ['love-languages', 'words-of-affirmation', 'communication']
  },
  {
    id: 'conv-ll-002',
    category: 'love_languages',
    intensity: 2,
    question: "¿Cómo te sientes cuando te hago cumplidos frente a otras personas?",
    followUps: [
      "¿Los elogios en público te incomodan o te alegran?",
      "¿Preferirías afirmaciones privadas?",
      "¿Cuál es la mejor manera de celebrar tus logros?"
    ],
    context: "Las afirmaciones públicas vs. privadas pueden sentirse muy diferentes según la personalidad.",
    tags: ['love-languages', 'words-of-affirmation', 'public-vs-private']
  },
  {
    id: 'conv-ll-003',
    category: 'love_languages',
    intensity: 3,
    question: "¿Qué es algo que he dicho que te hizo sentir profundamente amado?",
    followUps: [
      "¿Por qué esas palabras te impactaron tanto?",
      "¿Necesitas escuchar esas palabras con más frecuencia?",
      "¿Qué otras palabras tendrían un efecto similar?"
    ],
    context: "Entender lo que ha funcionado nos ayuda a repetir esos momentos de conexión.",
    tags: ['love-languages', 'words-of-affirmation', 'memories']
  },
  {
    id: 'conv-ll-004',
    category: 'love_languages',
    intensity: 2,
    question: "¿Qué tan importante es para ti escuchar 'te amo' todos los días?",
    followUps: [
      "¿Las acciones importan más que las palabras para ti?",
      "¿Preferirías diferentes formas de expresar amor?",
      "¿Qué sucede cuando no escuchas esas palabras?"
    ],
    context: "Algunos necesitan confirmación verbal regularmente, mientras que otros prefieren acciones sobre palabras.",
    tags: ['love-languages', 'words-of-affirmation', 'daily-habits']
  },
  {
    id: 'conv-ll-005',
    category: 'love_languages',
    intensity: 3,
    question: "¿Qué palabras alentadoras necesitas cuando enfrentas un desafío?",
    followUps: [
      "¿Quieres consejos o solo apoyo?",
      "¿Qué frases te hacen sentir capaz y fuerte?",
      "¿Cómo puedo apoyarte mejor en los momentos difíciles?"
    ],
    context: "Las palabras de apoyo durante los momentos difíciles pueden ser una poderosa expresión de amor.",
    tags: ['love-languages', 'words-of-affirmation', 'support']
  },

  // Actos de servicio
  {
    id: 'conv-ll-006',
    category: 'love_languages',
    intensity: 2,
    question: "¿Qué actos de servicio diarios te harían sentir más amado?",
    followUps: [
      "¿Qué tareas del hogar aprecias más cuando las hago?",
      "¿Es por la tarea en sí o por el pensamiento detrás?",
      "¿Qué pequeños gestos harían tu día más fácil?"
    ],
    context: "Las acciones hablan más que las palabras. Para algunos, hacer algo útil es la forma más pura de amor.",
    tags: ['love-languages', 'acts-of-service', 'daily-life']
  },
  {
    id: 'conv-ll-007',
    category: 'love_languages',
    intensity: 2,
    question: "Cuando hago algo por ti sin que me lo pidas, ¿cómo te hace sentir eso?",
    followUps: [
      "¿Qué ayuda no solicitada significa más para ti?",
      "¿Prefieres que pregunte primero o que simplemente lo haga?",
      "¿Cuál es la diferencia entre ayudar y tomar el control?"
    ],
    context: "Anticipar necesidades y actuar sobre ellas muestra un cuidado y atención profundos.",
    tags: ['love-languages', 'acts-of-service', 'initiative']
  },
  {
    id: 'conv-ll-008',
    category: 'love_languages',
    intensity: 3,
    question: "¿Qué es algo que hago que consideras un acto de amor, aunque yo no me dé cuenta?",
    followUps: [
      "¿Por qué esa acción específica significa tanto?",
      "¿Hay otras cosas que hago que aprecias?",
      "¿Cómo puedo ser más intencional con estos actos?"
    ],
    context: "A veces expresamos amor de maneras que ni siquiera nos damos cuenta. Entender estas expresiones ocultas profundiza la conexión.",
    tags: ['love-languages', 'acts-of-service', 'awareness']
  },
  {
    id: 'conv-ll-009',
    category: 'love_languages',
    intensity: 2,
    question: "¿Cómo te sientes cuando me encargo de algo por lo que has estado estresado?",
    followUps: [
      "¿Qué tareas te causan más estrés?",
      "¿Cómo puedo anticipar mejor lo que necesitas?",
      "¿Qué se sentiría como una carga vs. un regalo?"
    ],
    context: "Aliviar el estrés de tu pareja a través de la acción es una forma profunda de mostrar amor.",
    tags: ['love-languages', 'acts-of-service', 'stress-relief']
  },
  {
    id: 'conv-ll-010',
    category: 'love_languages',
    intensity: 3,
    question: "¿Qué es algo que podría quitarte de encima que te haría sentir verdaderamente cuidado?",
    followUps: [
      "¿Hay algo que temas hacer y que yo pueda manejar?",
      "¿Qué te daría más tiempo para ti mismo?",
      "¿Cómo cambiaría eso cómo te sientes en nuestra relación?"
    ],
    context: "A veces el mayor regalo es la libertad de una carga.",
    tags: ['love-languages', 'acts-of-service', 'gift-of-time']
  },

  // Recibir regalos
  {
    id: 'conv-ll-011',
    category: 'love_languages',
    intensity: 2,
    question: "¿Qué tipo de regalos te hacen sentir más amado?",
    followUps: [
      "¿Es el pensamiento, el esfuerzo o el artículo en sí?",
      "¿Prefieres regalos prácticos o sentimentales?",
      "¿Cuál fue el regalo más significativo que hayas recibido?"
    ],
    context: "Los regalos son símbolos visuales del amor. Para algunos, un presente bien pensado dice mucho.",
    tags: ['love-languages', 'receiving-gifts', 'thoughtfulness']
  },
  {
    id: 'conv-ll-012',
    category: 'love_languages',
    intensity: 2,
    question: "¿Cómo te sientes cuando te traigo pequeñas sorpresas?",
    followUps: [
      "¿Qué tipo de sorpresas disfrutas más?",
      "¿Prefieres regalos planificados o espontáneos?",
      "¿Qué cosa pequeña podría traerte que alegre tu día?"
    ],
    context: "No se trata del costo — se trata de conocer a tu pareja lo suficientemente bien como para elegir algo significativo.",
    tags: ['love-languages', 'receiving-gifts', 'surprises']
  },
  {
    id: 'conv-ll-013',
    category: 'love_languages',
    intensity: 3,
    question: "¿Qué es un regalo que siempre has querido pero nunca has recibido?",
    followUps: [
      "¿Por qué ese regalo es significativo para ti?",
      "¿Qué representaría recibirlo?",
      "¿Hay una historia detrás de por qué lo quieres?"
    ],
    context: "Los deseos de regalos no cumplidos a menudo representan necesidades emocionales más profundas.",
    tags: ['love-languages', 'receiving-gifts', 'dreams']
  },
  {
    id: 'conv-ll-014',
    category: 'love_languages',
    intensity: 2,
    question: "¿Prefieres experiencias o regalos físicos?",
    followUps: [
      "¿Qué experiencias te encantaría compartir conmigo?",
      "¿Hay artículos físicos que tengan un significado especial para ti?",
      "¿Cómo te sientes con los regalos hechos a mano o personalizados?"
    ],
    context: "Algunos valoran los recuerdos creados juntos; otros atesoran los recordatorios tangibles del amor.",
    tags: ['love-languages', 'receiving-gifts', 'experiences']
  },
  {
    id: 'conv-ll-015',
    category: 'love_languages',
    intensity: 3,
    question: "¿Cómo te sientes cuando te doy algo que muestra que he estado prestando atención?",
    followUps: [
      "¿Qué me has dado que mostró que realmente me conoces?",
      "¿Qué significa cuando alguien recuerda pequeños detalles?",
      "¿Cómo puedo mejorar en notar lo que te encantaría?"
    ],
    context: "Los regalos que reflejan un conocimiento profundo de tu pareja son los más significativos.",
    tags: ['love-languages', 'receiving-gifts', 'attention']
  },

  // Tiempo de calidad
  {
    id: 'conv-ll-016',
    category: 'love_languages',
    intensity: 2,
    question: "¿Cómo se ve el tiempo de calidad para ti?",
    followUps: [
      "¿Prefieres citas planificadas o momentos espontáneos?",
      "¿Qué actividades te hacen sentir más conectado conmigo?",
      "¿Es sobre la actividad o simplemente estar juntos?"
    ],
    context: "La atención indivisa es la clave. Para algunos, el tiempo juntos es la expresión máxima del amor.",
    tags: ['love-languages', 'quality-time', 'connection']
  },
  {
    id: 'conv-ll-017',
    category: 'love_languages',
    intensity: 3,
    question: "¿Cuándo te sientes más ignorado por mí, incluso cuando estoy físicamente presente?",
    followUps: [
      "¿Qué comportamientos te hacen sentir que no estoy realmente ahí?",
      "¿Cómo puedo mostrarte que estoy completamente presente?",
      "¿Cómo sería una atención sin interrupciones?"
    ],
    context: "La presencia física sin presencia emocional puede sentirse como ausencia.",
    tags: ['love-languages', 'quality-time', 'presence']
  },
  {
    id: 'conv-ll-018',
    category: 'love_languages',
    intensity: 2,
    question: "¿Qué actividades compartidas te gustaría que hiciéramos con más frecuencia?",
    followUps: [
      "¿Qué aficiones te gustaría que exploráramos juntos?",
      "¿Hay nuevas experiencias que te gustaría intentar?",
      "¿Qué rituales regulares fortalecerían nuestro vínculo?"
    ],
    context: "Las experiencias compartidas crean recuerdos duraderos y profundizan la conexión.",
    tags: ['love-languages', 'quality-time', 'shared-activities']
  },
  {
    id: 'conv-ll-019',
    category: 'love_languages',
    intensity: 3,
    question: "¿Cómo te sientes cuando dejo mi teléfono y te doy toda mi atención?",
    followUps: [
      "¿Qué significa la atención indivisa para ti?",
      "¿Con qué frecuencia necesitas este tipo de tiempo enfocado?",
      "¿Cómo sería nuestro tiempo de calidad ideal?"
    ],
    context: "En un mundo distraído, la atención plena es un regalo precioso.",
    tags: ['love-languages', 'quality-time', 'attention']
  },
  {
    id: 'conv-ll-020',
    category: 'love_languages',
    intensity: 2,
    question: "¿Cuál es tu recuerdo favorito de nosotros pasando tiempo juntos?",
    followUps: [
      "¿Qué hizo ese tiempo tan especial?",
      "¿Cómo podemos crear más momentos así?",
      "¿Qué elementos lo hicieron sentir como tiempo de calidad?"
    ],
    context: "Entender lo que hizo especiales los momentos pasados nos ayuda a recrearlos.",
    tags: ['love-languages', 'quality-time', 'memories']
  },

  // Toque físico
  {
    id: 'conv-ll-021',
    category: 'love_languages',
    intensity: 2,
    question: "¿Qué tipo de toque físico te hace sentir más amado?",
    followUps: [
      "¿Prefieres muestras de afecto en público o en privado?",
      "¿Qué tipos de toque te ayudan a sentirte conectado?",
      "¿Hay momentos en que el toque es más importante para ti?"
    ],
    context: "Para algunos, el toque físico es la forma más directa de sentirse amado y seguro.",
    tags: ['love-languages', 'physical-touch', 'affection']
  },
  {
    id: 'conv-ll-022',
    category: 'love_languages',
    intensity: 3,
    question: "¿Cómo te sientes cuando tomo tu mano o te toco casualmente?",
    followUps: [
      "¿Qué toques casuales significan más para ti?",
      "¿Necesitas más o menos toque casual?",
      "¿Qué te comunica la conexión física?"
    ],
    context: "Los pequeños toques casuales a lo largo del día pueden mantener la conexión.",
    tags: ['love-languages', 'physical-touch', 'casual-touch']
  },
  {
    id: 'conv-ll-023',
    category: 'love_languages',
    intensity: 3,
    question: "¿Qué te sucede emocionalmente cuando no tenemos contacto físico por un tiempo?",
    followUps: [
      "¿Cuánto tiempo es 'demasiado' sin toque?",
      "¿Qué sentimientos surgen cuando falta el toque?",
      "¿Cómo podemos mantener la conexión física aunque estemos ocupados?"
    ],
    context: "Para quienes necesitan el toque físico, la ausencia puede sentirse como distancia emocional.",
    tags: ['love-languages', 'physical-touch', 'needs']
  },
  {
    id: 'conv-ll-024',
    category: 'love_languages',
    intensity: 2,
    question: "¿Qué afecto físico no sexual disfrutas más?",
    followUps: [
      "¿Qué tipos de toque te ayudan a sentirte seguro y amado?",
      "¿Hay toques que son puramente reconfortantes?",
      "¿Cómo puedo iniciar afecto de maneras que se sientan bien para ti?"
    ],
    context: "El toque físico no es solo sobre la intimidad — se trata de conexión, confort y seguridad.",
    tags: ['love-languages', 'physical-touch', 'comfort']
  },
  {
    id: 'conv-ll-025',
    category: 'love_languages',
    intensity: 3,
    question: "¿Cómo afecta el toque físico tu estado de ánimo y sentido de conexión?",
    followUps: [
      "¿Qué comunica el toque que las palabras no pueden?",
      "¿Con qué rapidez mejora tu estado de ánimo con el afecto?",
      "¿Qué haría más toque regular por nuestra relación?"
    ],
    context: "Entender el impacto emocional del toque nos ayuda a priorizarlo.",
    tags: ['love-languages', 'physical-touch', 'emotional-impact']
  },

  // Descubriendo tus lenguajes del amor
  {
    id: 'conv-ll-026',
    category: 'love_languages',
    intensity: 3,
    question: "Mirando los cinco lenguajes del amor, ¿cuál resuena más contigo?",
    followUps: [
      "¿Palabras de afirmación, actos de servicio, recibir regalos, tiempo de calidad o toque físico?",
      "¿Por qué crees que ese lenguaje te habla?",
      "¿Cómo desarrollaste esa preferencia?"
    ],
    context: "Descubrir tu lenguaje del amor principal es el primer paso para una mejor comunicación.",
    tags: ['love-languages', 'discovery', 'self-awareness']
  },
  {
    id: 'conv-ll-027',
    category: 'love_languages',
    intensity: 3,
    question: "¿Cuál es tu lenguaje del amor secundario — el que es importante pero no principal?",
    followUps: [
      "¿Cómo aparece este lenguaje secundario en tus necesidades?",
      "¿Cuándo se vuelve más importante que tu lenguaje principal?",
      "¿Cómo puedo honrar ambos lenguajes?"
    ],
    context: "La mayoría de las personas tienen un lenguaje del amor principal y uno secundario que trabajan juntos.",
    tags: ['love-languages', 'discovery', 'secondary-language']
  },
  {
    id: 'conv-ll-028',
    category: 'love_languages',
    intensity: 3,
    question: "¿Cuál lenguaje del amor te resulta más difícil recibir o dar?",
    followUps: [
      "¿Por qué ese lenguaje es un desafío para ti?",
      "¿Es por comodidad, experiencias pasadas u otra cosa?",
      "¿Cómo podemos trabajar en esto juntos?"
    ],
    context: "Entender los desafíos nos ayuda a crecer y encontrarnos a mitad de camino.",
    tags: ['love-languages', 'challenges', 'growth']
  },
  {
    id: 'conv-ll-029',
    category: 'love_languages',
    intensity: 3,
    question: "¿Cómo puedo hablar mejor tu lenguaje del amor, incluso si no es natural para mí?",
    followUps: [
      "¿Qué acciones específicas significarían más?",
      "¿Cómo puedes ayudarme a aprender tu lenguaje?",
      "¿Qué paciencia necesitas de mí mientras aprendo?"
    ],
    context: "Aprender el lenguaje del amor de tu pareja es en sí mismo un acto de amor.",
    tags: ['love-languages', 'learning', 'effort']
  },
  {
    id: 'conv-ll-030',
    category: 'love_languages',
    intensity: 3,
    question: "¿Cómo sería si ambos nos sintiéramos completamente amados en nuestros propios lenguajes?",
    followUps: [
      "¿Cómo se sentiría diferente nuestra relación?",
      "¿Qué hábitos diarios tendríamos?",
      "¿Qué sería posible para nosotros entonces?"
    ],
    context: "Visualizar el ideal nos ayuda a trabajar hacia él juntos.",
    tags: ['love-languages', 'vision', 'future']
  },
];

export default loveLanguagesStartersES;
