// apps/mobile/data/conversation_starters_relationship.es.ts
// Relaciones Profundas - 50 preguntas para explorar su conexión
// Traducciones al español de conversation_starters_relationship.ts

import { ConversationStarter } from '../lib/conversationStarters';

export const relationshipStartersES: ConversationStarter[] = [
  // "¿Qué te hizo enamorarte de mí?" & Atracción inicial
  {
    id: 'conv-rel-001',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuál fue tu primera impresión de mí?",
    followUps: [
      "¿Qué tan acertada fue?",
      "¿Cambió con el tiempo?",
      "¿Cuándo te diste cuenta de que querías conocerme mejor?"
    ],
    context: "Las primeras impresiones marcan el comienzo, pero la verdadera historia es cómo evolucionaron.",
    tags: ['attraction', 'first-meeting', 'memories']
  },
  {
    id: 'conv-rel-002',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué fue lo que te enamoró de mí?",
    followUps: [
      "¿Fue un momento o muchas pequeñas cosas?",
      "¿Aún sientes lo mismo por esa cualidad?",
      "¿Qué te hace seguir eligiéndome?"
    ],
    context: "Recordar lo que nos unió fortalece nuestra apreciación mutua.",
    tags: ['love', 'attraction', 'appreciation']
  },
  {
    id: 'conv-rel-003',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué notaste en mí al principio que todavía amas?",
    followUps: [
      "¿Ha cambiado o crecido con el tiempo?",
      "¿Qué dice eso de quién soy?",
      "¿Cómo te hace sentir cuando lo ves?"
    ],
    context: "Las cualidades que nos atrajeron al principio suelen ser la base de nuestro amor.",
    tags: ['appreciation', 'observation', 'love']
  },
  {
    id: 'conv-rel-004',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué te hizo decidir comprometerte conmigo?",
    followUps: [
      "¿Hubo un momento específico?",
      "¿De qué no estabas seguro antes?",
      "¿Cómo ha sentido esa decisión con el tiempo?"
    ],
    context: "Entender la decisión de comprometerse nos ayuda a honrar esa elección.",
    tags: ['commitment', 'decision', 'deep']
  },
  {
    id: 'conv-rel-005',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué es algo que hago que te hace sentir especial?",
    followUps: [
      "¿Sé que lo hago?",
      "¿Cuándo lo notaste por primera vez?",
      "¿Cómo puedo hacerlo con más frecuencia?"
    ],
    context: "Los pequeños gestos a menudo pesan más que las grandes declaraciones.",
    tags: ['appreciation', 'gestures', 'love-languages']
  },
  {
    id: 'conv-rel-006',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué le contabas a tus amigos sobre mí después de nuestras primeras citas?",
    followUps: [
      "¿Qué te emocionaba más?",
      "¿Estabas preocupado por algo?",
      "¿Qué pensaron ellos?"
    ],
    context: "Cómo hablamos de una nueva pareja revela lo que estamos sintiendo.",
    tags: ['memories', 'attraction', 'fun']
  },
  {
    id: 'conv-rel-007',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué te hizo sentir lo suficientemente seguro para ser vulnerable conmigo?",
    followUps: [
      "¿Fue algo que hice o simplemente quién eres tú?",
      "¿Aún sientes esa seguridad?",
      "¿Qué podría hacerte sentir aún más seguro?"
    ],
    context: "La vulnerabilidad requiere seguridad — entender qué la crea profundiza la confianza.",
    tags: ['deep', 'vulnerability', 'trust', 'safety']
  },
  {
    id: 'conv-rel-008',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuál es una rareza mía que secretamente amas?",
    followUps: [
      "¿Cuándo la notaste por primera vez?",
      "¿A veces también te molesta?",
      "¿Qué revela de mí?"
    ],
    context: "Amar las rarezas de alguien es una señal de aceptación genuina.",
    tags: ['fun', 'acceptance', 'quirk']
  },
  {
    id: 'conv-rel-009',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué estabas pensando durante nuestro primer beso?",
    followUps: [
      "¿Estabas nervioso?",
      "¿Querías que sucediera?",
      "¿Cómo te sentiste después?"
    ],
    context: "Los primeros besos son hitos — recordarlos mantiene viva la chispa.",
    tags: ['memories', 'intimacy', 'romance']
  },
  {
    id: 'conv-rel-010',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué te hizo darte cuenta de que esto era diferente a otras relaciones?",
    followUps: [
      "¿Cómo lo sabías?",
      "¿Qué sentías?",
      "¿Te asustó o te emocionó?"
    ],
    context: "Reconocer algo especial nos ayuda a apreciar lo que tenemos.",
    tags: ['deep', 'realization', 'commitment']
  },

  // Recuerdos favoritos juntos
  {
    id: 'conv-rel-011',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuál es tu recuerdo favorito de nosotros juntos?",
    followUps: [
      "¿Qué lo hizo tan especial?",
      "¿Qué sentías en ese momento?",
      "¿Cómo podemos crear más momentos así?"
    ],
    context: "Revivir los recuerdos felices fortalece nuestro vínculo y guía experiencias futuras.",
    tags: ['memories', 'happiness', 'nostalgia']
  },
  {
    id: 'conv-rel-012',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuándo nos hemos divertido más juntos?",
    followUps: [
      "¿Qué estábamos haciendo?",
      "¿Por qué fue tan divertido?",
      "¿Podemos repetirlo o hacer algo similar?"
    ],
    context: "La alegría compartida es el pegamento de las relaciones — priorizar la diversión nos mantiene conectados.",
    tags: ['fun', 'memories', 'joy']
  },
  {
    id: 'conv-rel-013',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuál es un pequeño momento conmigo que nunca olvidarás?",
    followUps: [
      "¿Por qué permanece contigo?",
      "¿Sabías en ese momento que era especial?",
      "¿Qué representa para ti?"
    ],
    context: "Los momentos más pequeños a menudo se convierten en nuestros recuerdos más preciados.",
    tags: ['memories', 'intimacy', 'meaning']
  },
  {
    id: 'conv-rel-014',
    category: 'relationship',
    intensity: 3,
    question: "¿Cuándo sentiste que realmente estuve ahí para ti?",
    followUps: [
      "¿Qué necesitabas en ese momento?",
      "¿Cómo te hizo sentir?",
      "¿Qué significó mi apoyo para ti?"
    ],
    context: "Estar ahí el uno para el otro en momentos difíciles construye los vínculos más profundos.",
    tags: ['deep', 'support', 'gratitude']
  },
  {
    id: 'conv-rel-015',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuál es nuestro recuerdo más ridículo o tonto juntos?",
    followUps: [
      "¿En qué estábamos pensando?",
      "¿Todavía te ríes al respecto?",
      "¿Por qué los momentos tontos importan en una relación?"
    ],
    context: "La risa y la tontería mantienen las relaciones livianas y alegres.",
    tags: ['fun', 'laughter', 'memories']
  },
  {
    id: 'conv-rel-016',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuál es un viaje o aventura conmigo en el que piensas seguido?",
    followUps: [
      "¿Cuál fue el momento culminante?",
      "¿Qué lo hizo especial — el lugar o nosotros?",
      "¿A dónde deberíamos ir después?"
    ],
    context: "Las aventuras compartidas crean recuerdos duraderos y profundizan nuestra conexión.",
    tags: ['travel', 'adventure', 'memories']
  },
  {
    id: 'conv-rel-017',
    category: 'relationship',
    intensity: 3,
    question: "¿Cuándo superamos algo difícil juntos?",
    followUps: [
      "¿Cómo cambió nuestra relación?",
      "¿Qué aprendiste de nosotros?",
      "¿Cómo crecimos a partir de eso?"
    ],
    context: "Superar desafíos juntos demuestra nuestra resiliencia como pareja.",
    tags: ['deep', 'resilience', 'growth']
  },
  {
    id: 'conv-rel-018',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué hemos creado juntos de lo que estés orgulloso?",
    followUps: [
      "¿Por qué te importa?",
      "¿Qué aportó cada uno?",
      "¿Qué deberíamos crear después?"
    ],
    context: "Crear juntos — ya sean recuerdos, proyectos o una vida — construye una asociación.",
    tags: ['creation', 'partnership', 'pride']
  },
  {
    id: 'conv-rel-019',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuál es una tradición que hemos comenzado y que amas?",
    followUps: [
      "¿Cómo comenzó?",
      "¿Qué representa para ti?",
      "¿Qué nuevas tradiciones deberíamos comenzar?"
    ],
    context: "Las tradiciones le dan ritmo y significado a nuestra vida compartida.",
    tags: ['traditions', 'meaning', 'connection']
  },
  {
    id: 'conv-rel-020',
    category: 'relationship',
    intensity: 3,
    question: "¿Cuándo te has sentido más conectado conmigo?",
    followUps: [
      "¿Qué estaba pasando?",
      "¿Qué creó esa conexión?",
      "¿Cómo podemos cultivar más de esos momentos?"
    ],
    context: "La conexión profunda es el corazón de la intimidad — entenderla nos ayuda a nutrirla.",
    tags: ['deep', 'connection', 'intimacy']
  },

  // Cómo manejamos el conflicto
  {
    id: 'conv-rel-021',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué necesitas de mí cuando estamos en conflicto?",
    followUps: [
      "¿Usualmente te doy eso?",
      "¿Qué te hace difícil pedirlo?",
      "¿Cómo puedo satisfacer mejor esa necesidad?"
    ],
    context: "Entender las necesidades de conflicto nos ayuda a manejar mejor los desacuerdos.",
    tags: ['deep', 'conflict', 'needs', 'communication']
  },
  {
    id: 'conv-rel-022',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué hago durante las discusiones que te molesta?",
    followUps: [
      "¿Por qué te molesta?",
      "¿Qué preferirías que hiciera en cambio?",
      "¿Hay una forma de que me corrija yo mismo?"
    ],
    context: "Los comentarios constructivos sobre los patrones de conflicto nos ayudan a crecer como pareja.",
    tags: ['deep', 'conflict', 'growth', 'feedback']
  },
  {
    id: 'conv-rel-023',
    category: 'relationship',
    intensity: 3,
    question: "¿Cuál es tu mayor miedo cuando peleamos?",
    followUps: [
      "¿De dónde viene ese miedo?",
      "¿Qué te ayudaría a sentirte más seguro?",
      "¿Cómo puedo tranquilizarte?"
    ],
    context: "Los miedos en el conflicto a menudo provienen de experiencias pasadas — nombrarlos ayuda a sanar.",
    tags: ['deep', 'conflict', 'fear', 'trust']
  },
  {
    id: 'conv-rel-024',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué crees que hacemos bien cuando manejamos desacuerdos?",
    followUps: [
      "¿Cómo desarrollamos esa fortaleza?",
      "¿En qué podemos construir?",
      "¿Cómo nos aseguramos de seguir haciéndolo?"
    ],
    context: "Reconocer nuestras fortalezas nos da confianza para manejar conflictos futuros.",
    tags: ['conflict', 'strengths', 'appreciation']
  },
  {
    id: 'conv-rel-025',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué patrón recurrente de discusiones quisieras romper?",
    followUps: [
      "¿Qué lo desencadena?",
      "¿Cómo sería un patrón más saludable?",
      "¿Cómo podemos detectarlo más pronto?"
    ],
    context: "Romper los patrones negativos requiere conciencia y esfuerzo intencional.",
    tags: ['deep', 'conflict', 'patterns', 'growth']
  },
  {
    id: 'conv-rel-026',
    category: 'relationship',
    intensity: 2,
    question: "¿Cómo prefieres procesar el conflicto — de inmediato o con tiempo?",
    followUps: [
      "¿Por qué funciona mejor así para ti?",
      "¿Cómo podemos honrar las necesidades de ambos?",
      "¿Qué señales podemos usar para comunicar nuestras necesidades?"
    ],
    context: "Los diferentes estilos de procesamiento requieren compromiso y comunicación clara.",
    tags: ['conflict', 'communication', 'needs']
  },
  {
    id: 'conv-rel-027',
    category: 'relationship',
    intensity: 3,
    question: "¿Hay algo por lo que quisieras disculparte pero no lo has hecho?",
    followUps: [
      "¿Qué te detiene?",
      "¿Qué dirías?",
      "¿Puedes decirlo ahora?"
    ],
    context: "Las disculpas no dichas pueden crear distancia — ofrecerlas sana heridas antiguas.",
    tags: ['deep', 'apology', 'healing', 'vulnerability']
  },
  {
    id: 'conv-rel-028',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué necesitas para sentir que un conflicto está verdaderamente resuelto?",
    followUps: [
      "¿Son palabras, acciones o tiempo?",
      "¿Sientes que esa necesidad generalmente se satisface?",
      "¿Cómo podemos cerrar mejor el ciclo?"
    ],
    context: "Las personas necesitan cosas diferentes para sentir el cierre tras un conflicto.",
    tags: ['deep', 'conflict', 'closure', 'needs']
  },
  {
    id: 'conv-rel-029',
    category: 'relationship',
    intensity: 3,
    question: "¿Hay una herida de nuestra relación de la que todavía estás sanando?",
    followUps: [
      "¿Qué necesitas para sanar?",
      "¿Cómo puedo apoyar esa sanación?",
      "¿Cómo sería la reparación?"
    ],
    context: "Las viejas heridas pueden persistir — abordarlas abiertamente previene el resentimiento.",
    tags: ['deep', 'healing', 'vulnerability', 'repair']
  },
  {
    id: 'conv-rel-030',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué aprecias de cómo manejo el estrés?",
    followUps: [
      "¿Cómo te ayuda?",
      "¿Qué has aprendido de eso?",
      "¿Cómo equilibra tus propias tendencias?"
    ],
    context: "Apreciar los estilos de afrontamiento del otro construye empatía y compañerismo.",
    tags: ['appreciation', 'stress', 'balance']
  },

  // Visiones de futuro como pareja
  {
    id: 'conv-rel-031',
    category: 'relationship',
    intensity: 2,
    question: "¿Dónde nos ves en cinco años?",
    followUps: [
      "¿Qué estaremos haciendo?",
      "¿Cómo habremos crecido?",
      "¿Qué necesitamos hacer ahora para llegar allí?"
    ],
    context: "La visión compartida alinea nuestras acciones presentes con nuestro futuro deseado.",
    tags: ['future', 'vision', 'planning']
  },
  {
    id: 'conv-rel-032',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué tipo de vida quieres que construyamos juntos?",
    followUps: [
      "¿Qué es lo más importante en esa visión?",
      "¿Qué estarías dispuesto a sacrificar por ello?",
      "¿Qué no estarías dispuesto a sacrificar?"
    ],
    context: "Alinearse en la visión de vida asegura que estemos construyendo hacia el mismo futuro.",
    tags: ['deep', 'future', 'vision', 'values']
  },
  {
    id: 'conv-rel-033',
    category: 'relationship',
    intensity: 3,
    question: "¿Cómo sería para ti nuestra vida hogareña ideal?",
    followUps: [
      "¿Cómo sería un día típico?",
      "¿Qué tradiciones o ritmos tenemos?",
      "¿Cómo equilibramos estar juntos y la independencia?"
    ],
    context: "La visión de nuestra vida en el hogar da forma a cómo estructuramos nuestra existencia diaria.",
    tags: ['future', 'home', 'lifestyle']
  },
  {
    id: 'conv-rel-034',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué tipo de padres seríamos si elegimos tener hijos?",
    followUps: [
      "¿Qué valores querríamos inculcar?",
      "¿Qué haríamos diferente a nuestros padres?",
      "¿Qué te emociona o asusta de eso?"
    ],
    context: "Hablar de filosofía de crianza nos ayuda a alinear la visión familiar.",
    tags: ['deep', 'future', 'family', 'parenting']
  },
  {
    id: 'conv-rel-035',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué aventuras quieres que tengamos en los próximos años?",
    followUps: [
      "¿Qué tipo de aventuras — viajes, experiencias, desafíos?",
      "¿Cuál te emociona más?",
      "¿Cómo podemos empezar a planificarlas?"
    ],
    context: "Las aventuras compartidas mantienen las relaciones emocionantes y crean recuerdos duraderos.",
    tags: ['future', 'adventure', 'excitement']
  },
  {
    id: 'conv-rel-036',
    category: 'relationship',
    intensity: 3,
    question: "¿Cómo quieres crecer como pareja?",
    followUps: [
      "¿En qué áreas quieres mejorar?",
      "¿Qué tipo de pareja aspiras a ser?",
      "¿Cómo puedo apoyar tu crecimiento?"
    ],
    context: "El compromiso de crecer como parejas mantiene la relación en evolución.",
    tags: ['deep', 'growth', 'commitment', 'future']
  },
  {
    id: 'conv-rel-037',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué metas financieras quieres que trabajemos juntos?",
    followUps: [
      "¿Qué significa la seguridad financiera para ti?",
      "¿Para qué estamos ahorrando?",
      "¿Cómo equilibramos el disfrute presente y la seguridad futura?"
    ],
    context: "La alineación financiera previene conflictos y construye seguridad compartida.",
    tags: ['future', 'finance', 'planning']
  },
  {
    id: 'conv-rel-038',
    category: 'relationship',
    intensity: 3,
    question: "¿Por qué quieres que sea conocida nuestra relación?",
    followUps: [
      "¿Qué cualidades quieres que encarnemos?",
      "¿Qué quieres que la gente diga de nosotros?",
      "¿Cómo lo vivimos día a día?"
    ],
    context: "La identidad de nuestra relación da forma a cómo nos mostramos juntos en el mundo.",
    tags: ['deep', 'identity', 'values', 'legacy']
  },
  {
    id: 'conv-rel-039',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué esperas que sigamos haciendo juntos cuando seamos viejos?",
    followUps: [
      "¿Qué hábitos o tradiciones?",
      "¿Qué esperas que nunca cambie?",
      "¿Qué es lo que más esperas?"
    ],
    context: "La visión a largo plazo nos ayuda a priorizar lo que realmente importa.",
    tags: ['future', 'long-term', 'commitment']
  },
  {
    id: 'conv-rel-040',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué quieres asegurarte de que nunca perdamos en nuestra relación?",
    followUps: [
      "¿Por qué es tan importante?",
      "¿Qué lo amenaza?",
      "¿Cómo lo protegemos?"
    ],
    context: "Proteger lo que más importa requiere nombrarlo y ser intencional.",
    tags: ['deep', 'protection', 'values', 'commitment']
  },

  // Apreciación y gratitud
  {
    id: 'conv-rel-041',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué aprecias de mí y no lo dices con suficiente frecuencia?",
    followUps: [
      "¿Por qué no lo dices más?",
      "¿Cómo afecta esa cualidad tu vida?",
      "¿Puedes contarme más ahora?"
    ],
    context: "La apreciación no expresada es una oportunidad perdida de conexión.",
    tags: ['appreciation', 'gratitude', 'love']
  },
  {
    id: 'conv-rel-042',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué es algo que hago que mejora tu vida?",
    followUps: [
      "¿Crees que sé cuánto importa?",
      "¿Cómo sería la vida sin eso?",
      "¿Cómo puedo hacerlo aún más?"
    ],
    context: "Reconocer cómo mejoramos la vida del otro profundiza la gratitud.",
    tags: ['gratitude', 'impact', 'appreciation']
  },
  {
    id: 'conv-rel-043',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué has aprendido de mí por lo que estás agradecido?",
    followUps: [
      "¿Cómo te ha cambiado?",
      "¿Lo resististe al principio?",
      "¿Qué más esperas aprender de mí?"
    ],
    context: "Las parejas que crecen juntas permanecen juntas — la gratitud por el crecimiento fortalece los vínculos.",
    tags: ['deep', 'gratitude', 'growth', 'learning']
  },
  {
    id: 'conv-rel-044',
    category: 'relationship',
    intensity: 2,
    question: "¿De qué manera he cambiado tu vida para mejor?",
    followUps: [
      "¿Fue gradual o repentino?",
      "¿Lo esperabas?",
      "¿Qué significa eso para ti?"
    ],
    context: "Conocer nuestro impacto positivo en nuestra pareja es profundamente afirmador.",
    tags: ['gratitude', 'impact', 'transformation']
  },
  {
    id: 'conv-rel-045',
    category: 'relationship',
    intensity: 2,
    question: "¿Qué admiras de mí?",
    followUps: [
      "¿Cuándo notaste esa cualidad por primera vez?",
      "¿Sabes que la tengo?",
      "¿Cómo te inspira?"
    ],
    context: "La admiración es diferente al amor — refleja a quién aspiramos ser.",
    tags: ['admiration', 'inspiration', 'respect']
  },
  {
    id: 'conv-rel-046',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuál es un sacrificio que he hecho y que realmente aprecias?",
    followUps: [
      "¿Lo hice de buena gana?",
      "¿Cómo te afectó?",
      "¿Qué te comunicó?"
    ],
    context: "Reconocer los sacrificios nos ayuda a apreciar el costo del amor.",
    tags: ['gratitude', 'sacrifice', 'love']
  },
  {
    id: 'conv-rel-047',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué amas de la forma en que te amo?",
    followUps: [
      "¿Son palabras, acciones, presencia?",
      "¿Tuviste que aprender a recibirlo?",
      "¿Qué lo hace sentir seguro?"
    ],
    context: "Entender cómo cada uno ama nos ayuda a apreciar y corresponder.",
    tags: ['deep', 'love', 'love-languages', 'appreciation']
  },
  {
    id: 'conv-rel-048',
    category: 'relationship',
    intensity: 2,
    question: "¿Cuándo te has sentido más orgulloso de estar conmigo?",
    followUps: [
      "¿Qué estaba pasando?",
      "¿De qué cualidad estabas orgulloso?",
      "¿Cómo te hizo sentir respecto a nosotros?"
    ],
    context: "El orgullo en nuestra pareja refleja nuestra identidad y valores compartidos.",
    tags: ['pride', 'admiration', 'memories']
  },
  {
    id: 'conv-rel-049',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué te hace sentir afortunado de tenerme?",
    followUps: [
      "¿Lo sientes a menudo?",
      "¿Qué te lo recuerda?",
      "¿Cómo expresas esa gratitud?"
    ],
    context: "Sentirse afortunado nos impide darnos el uno al otro por sentado.",
    tags: ['deep', 'gratitude', 'appreciation']
  },
  {
    id: 'conv-rel-050',
    category: 'relationship',
    intensity: 3,
    question: "¿Qué quisieras que yo supiera sobre cuánto significo para ti?",
    followUps: [
      "¿Por qué es difícil expresarlo?",
      "¿Qué palabras se acercan más?",
      "¿Cómo puedo realmente escucharlo?"
    ],
    context: "A veces los sentimientos más profundos son los más difíciles de expresar — crear espacio para ellos es un regalo.",
    tags: ['deep', 'love', 'vulnerability', 'expression']
  }
];

export default relationshipStartersES;
