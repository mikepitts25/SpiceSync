// apps/mobile/data/conversation_starters_date_night.es.ts
// Noche de Cita - 50 preguntas para citas
// Traducciones al español de conversation_starters_date_night.ts

import { ConversationStarter } from '../lib/conversationStarters';

export const dateNightStartersES: ConversationStarter[] = [
  // Preguntas ligeras y coquetas
  {
    id: 'conv-date-001',
    category: 'date_night',
    intensity: 1,
    question: "¿Cuál fue tu primer pensamiento cuando me viste esta noche?",
    followUps: [
      "¿Ha cambiado durante la noche?",
      "¿Qué esperabas?",
      "¿Qué te gustaría que pasara después?"
    ],
    context: "Mantenerse curiosos el uno por el otro mantiene viva la chispa.",
    tags: ['flirty', 'fun', 'present-moment']
  },
  {
    id: 'conv-date-002',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué es algo que hago que todavía te da mariposas?",
    followUps: [
      "¿Cuándo lo notaste por primera vez?",
      "¿Sabes que lo hago?",
      "¿Puedo hacerlo ahora mismo?"
    ],
    context: "Las mariposas no son solo para relaciones nuevas — pueden durar con atención.",
    tags: ['flirty', 'attraction', 'butterflies']
  },
  {
    id: 'conv-date-003',
    category: 'date_night',
    intensity: 2,
    question: "Si tuvieras que describirme a alguien que nunca me ha conocido, ¿qué sería lo primero que dirías?",
    followUps: [
      "¿Es eso lo que más te gusta de mí?",
      "¿Estaría de acuerdo con esa descripción?",
      "¿Ha crecido esa cualidad con el tiempo?"
    ],
    context: "Cómo describimos a nuestra pareja revela lo que más valoramos de ella.",
    tags: ['fun', 'perception', 'attraction']
  },
  {
    id: 'conv-date-004',
    category: 'date_night',
    intensity: 2,
    question: "¿Cuál es tu característica física favorita de mí?",
    followUps: [
      "¿Siempre ha sido esa?",
      "¿Qué es lo que amas de ella?",
      "¿Me das un cumplido también?"
    ],
    context: "La atracción física es parte del todo — celebrarla mantiene viva la pasión.",
    tags: ['flirty', 'physical', 'attraction']
  },
  {
    id: 'conv-date-005',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué es algo que usé y que te encantó absolutamente?",
    followUps: [
      "¿Qué lo hizo funcionar?",
      "¿Debería usarlo más a menudo?",
      "¿Hay algo que te encantaría verme usar?"
    ],
    context: "Notar y apreciar el estilo del otro es una forma de coqueteo.",
    tags: ['flirty', 'style', 'attraction']
  },
  {
    id: 'conv-date-006',
    category: 'date_night',
    intensity: 2,
    question: "¿Cuál es un apodo que tienes para mí y que te encanta?",
    followUps: [
      "¿De dónde vino?",
      "¿Qué significa para ti?",
      "¿Inventamos uno nuevo esta noche?"
    ],
    context: "Los apodos crean intimidad y un lenguaje privado entre parejas.",
    tags: ['fun', 'intimacy', 'playful']
  },
  {
    id: 'conv-date-007',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué es algo que hago que te parece inesperadamente sexi?",
    followUps: [
      "¿Crees que sé que lo hago?",
      "¿Cuándo lo notaste por primera vez?",
      "¿Puedes mostrarme a qué te refieres?"
    ],
    context: "La atracción a menudo vive en los pequeños momentos inesperados.",
    tags: ['flirty', 'sexy', 'attraction']
  },
  {
    id: 'conv-date-008',
    category: 'date_night',
    intensity: 1,
    question: "Si fuéramos personajes de una película, ¿de qué género sería?",
    followUps: [
      "¿Comedia romántica, acción, thriller?",
      "¿Quién nos interpretaría?",
      "¿Cuál sería la trama?"
    ],
    context: "La imaginación juguetona mantiene las noches de cita ligeras y creativas.",
    tags: ['fun', 'creative', 'playful']
  },
  {
    id: 'conv-date-009',
    category: 'date_night',
    intensity: 2,
    question: "¿Cuál es tu forma favorita en que te toco?",
    followUps: [
      "¿Es íntima o casual?",
      "¿Depende del estado de ánimo?",
      "¿Puedo hacerlo ahora?"
    ],
    context: "La conexión física tiene muchas formas — conocer las preferencias profundiza la intimidad.",
    tags: ['flirty', 'physical', 'intimacy']
  },
  {
    id: 'conv-date-010',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué es lo más atractivo que he hecho recientemente?",
    followUps: [
      "¿Fue intencional?",
      "¿Por qué te llamó la atención?",
      "¿Cómo te hizo sentir?"
    ],
    context: "Notar la atracción en los momentos cotidianos mantiene fresca la conexión.",
    tags: ['flirty', 'attraction', 'appreciation']
  },

  // Escenarios hipotéticos
  {
    id: 'conv-date-011',
    category: 'date_night',
    intensity: 1,
    question: "Si mañana nos ganáramos la lotería, ¿qué sería lo primero que haríamos?",
    followUps: [
      "¿Después de la celebración, entonces qué?",
      "¿Seguiríamos trabajando?",
      "¿Dónde viviríamos?"
    ],
    context: "Soñar juntos revela los valores y prioridades compartidas.",
    tags: ['fun', 'dreams', 'hypothetical']
  },
  {
    id: 'conv-date-012',
    category: 'date_night',
    intensity: 2,
    question: "Si pudiéramos intercambiar cuerpos por un día, ¿qué sería lo primero que harías?",
    followUps: [
      "¿Qué querrías entender de mí?",
      "¿Qué te sorprendería más?",
      "¿Qué querrías que yo experimentara en tu cuerpo?"
    ],
    context: "Imaginar ponerse en los zapatos del otro construye empatía y curiosidad.",
    tags: ['fun', 'empathy', 'perspective']
  },
  {
    id: 'conv-date-013',
    category: 'date_night',
    intensity: 2,
    question: "Si tuviéramos que crear un negocio juntos, ¿cuál sería?",
    followUps: [
      "¿Qué aportaría cada uno?",
      "¿Seríamos buenos socios de negocios?",
      "¿Cuál sería nuestra cultura empresarial?"
    ],
    context: "Imaginar la colaboración revela cómo nos vemos las fortalezas mutuamente.",
    tags: ['fun', 'creative', 'partnership']
  },
  {
    id: 'conv-date-014',
    category: 'date_night',
    intensity: 2,
    question: "Si pudiéramos vivir en cualquier lugar del mundo por un año, ¿a dónde iríamos?",
    followUps: [
      "¿Qué nos atrae de ese lugar?",
      "¿Cómo sería nuestra vida cotidiana?",
      "¿Volveríamos o nos quedaríamos para siempre?"
    ],
    context: "Los sueños de viaje revelan nuestros deseos de aventura y estilo de vida.",
    tags: ['travel', 'dreams', 'adventure']
  },
  {
    id: 'conv-date-015',
    category: 'date_night',
    intensity: 2,
    question: "Si quedáramos varados en una isla desierta, ¿qué papel desempeñaría cada uno?",
    followUps: [
      "¿Quién construye el refugio?",
      "¿Quién busca comida?",
      "¿Quién mantiene el ánimo?"
    ],
    context: "Los escenarios de supervivencia revelan cómo nos vemos las habilidades prácticas y emocionales.",
    tags: ['fun', 'survival', 'skills']
  },
  {
    id: 'conv-date-016',
    category: 'date_night',
    intensity: 2,
    question: "Si pudiéramos cenar con cualquier pareja, viva o muerta, ¿quién sería?",
    followUps: [
      "¿Qué les preguntaríamos?",
      "¿Qué querríamos aprender?",
      "¿Qué representan para nosotros?"
    ],
    context: "Las parejas que admiramos revelan lo que aspiramos en nuestra propia relación.",
    tags: ['fun', 'inspiration', 'role-models']
  },
  {
    id: 'conv-date-017',
    category: 'date_night',
    intensity: 2,
    question: "Si pudiéramos revivir un día de nuestra relación, ¿cuál elegirías?",
    followUps: [
      "¿Por qué ese día?",
      "¿Cambiarías algo?",
      "¿Qué lo hizo perfecto?"
    ],
    context: "Nuestros recuerdos compartidos favoritos revelan lo que más valoramos en nuestro tiempo juntos.",
    tags: ['memories', 'nostalgia', 'reflection']
  },
  {
    id: 'conv-date-018',
    category: 'date_night',
    intensity: 2,
    question: "Si tuviéramos que competir juntos en un reality show, ¿en cuál ganaríamos?",
    followUps: [
      "¿La Amazing Race, un programa de cocina, u otro?",
      "¿Cuál sería nuestra arma secreta?",
      "¿Cuál sería nuestro mayor desafío?"
    ],
    context: "Imaginar la competencia revela cómo nos vemos el trabajo en equipo.",
    tags: ['fun', 'competition', 'teamwork']
  },
  {
    id: 'conv-date-019',
    category: 'date_night',
    intensity: 2,
    question: "Si pudiéramos dominar al instante una habilidad juntos, ¿cuál elegiríamos?",
    followUps: [
      "¿Algo práctico o algo divertido?",
      "¿Qué haríamos con ello?",
      "¿Se lo enseñaríamos a otros o lo guardaríamos en secreto?"
    ],
    context: "Las habilidades compartidas crean nuevas formas de conectarse y tener aventuras juntos.",
    tags: ['fun', 'skills', 'learning']
  },
  {
    id: 'conv-date-020',
    category: 'date_night',
    intensity: 2,
    question: "Si pudiéramos viajar en el tiempo juntos, ¿a dónde y cuándo iríamos?",
    followUps: [
      "¿Pasado o futuro?",
      "¿Participaríamos o solo observaríamos?",
      "¿Qué querríamos experimentar?"
    ],
    context: "Los sueños de viaje en el tiempo revelan nuestra curiosidad sobre la historia, el futuro y la experiencia compartida.",
    tags: ['fun', 'imagination', 'adventure']
  },

  // Lista de deseos para hacer juntos
  {
    id: 'conv-date-021',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué es algo en tu lista de deseos que quisieras hacer conmigo?",
    followUps: [
      "¿Por qué eso específicamente?",
      "¿Qué lo haría perfecto?",
      "¿Cuándo podemos empezar a planearlo?"
    ],
    context: "Los elementos compartidos de la lista de deseos nos dan metas emocionantes hacia las que trabajar juntos.",
    tags: ['bucket-list', 'dreams', 'planning']
  },
  {
    id: 'conv-date-022',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué experiencia gastronómica quieres que tengamos juntos?",
    followUps: [
      "¿Un restaurante específico, cocina o experiencia culinaria?",
      "¿Es por la comida o la experiencia?",
      "¿Cuándo lo hacemos?"
    ],
    context: "Las experiencias gastronómicas compartidas crean recuerdos sensoriales y exploración cultural.",
    tags: ['food', 'experiences', 'culture']
  },
  {
    id: 'conv-date-023',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué aventura o experiencia de adrenalina quieres que intentemos?",
    followUps: [
      "¿Paracaidismo, bungee jumping, o algo más suave?",
      "¿Qué te emociona de ello?",
      "¿Estás más emocionado o nervioso?"
    ],
    context: "Las experiencias compartidas de adrenalina crean momentos intensos de unión.",
    tags: ['adventure', 'adrenaline', 'experiences']
  },
  {
    id: 'conv-date-024',
    category: 'date_night',
    intensity: 2,
    question: "¿A qué festival o evento en cualquier parte del mundo te gustaría asistir conmigo?",
    followUps: [
      "¿Carnaval en Río, Oktoberfest, Burning Man?",
      "¿Qué te atrae de él?",
      "¿Cómo lo viviríamos juntos?"
    ],
    context: "Los eventos culturales ofrecen experiencias inmersivas y recuerdos compartidos.",
    tags: ['travel', 'culture', 'experiences']
  },
  {
    id: 'conv-date-025',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué clase o taller quisieras que tomáramos juntos?",
    followUps: [
      "¿Cocina, baile, pintura, u otro?",
      "¿Por qué ese?",
      "¿Seríamos buenos estudiantes?"
    ],
    context: "Aprender juntos mantiene la relación dinámica y crea competencia compartida.",
    tags: ['learning', 'growth', 'fun']
  },
  {
    id: 'conv-date-026',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué maravilla natural quisieras ver conmigo?",
    followUps: [
      "¿Auroras boreales, el Gran Cañón, la Gran Barrera de Coral?",
      "¿Cómo se sentiría experimentarlo juntos?",
      "¿Acamparíamos o iríamos en lujo?"
    ],
    context: "Las maravillas naturales inspiran asombro — experimentarlas juntos profundiza la conexión.",
    tags: ['nature', 'travel', 'awe']
  },
  {
    id: 'conv-date-027',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué desafío o meta física quisieras que logramos juntos?",
    followUps: [
      "¿Un maratón, escalar una montaña, u otra cosa?",
      "¿Cómo sería entrenar juntos?",
      "¿Cómo lo celebraríamos?"
    ],
    context: "Los desafíos físicos compartidos construyen trabajo en equipo y apoyo mutuo.",
    tags: ['fitness', 'challenge', 'teamwork']
  },
  {
    id: 'conv-date-028',
    category: 'date_night',
    intensity: 2,
    question: "¿En qué proyecto creativo quisieras que colaboráramos?",
    followUps: [
      "¿Escritura, arte, música, construir algo?",
      "¿Qué crearíamos?",
      "¿Seríamos buenos socios creativos?"
    ],
    context: "Crear juntos construye una asociación más allá de los aspectos prácticos de la vida.",
    tags: ['creative', 'collaboration', 'fun']
  },
  {
    id: 'conv-date-029',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué ruta de viaje en auto te encantaría hacer juntos?",
    followUps: [
      "¿Carretera costera, la Ruta 66, el campo europeo?",
      "¿Cuál sería nuestra banda sonora?",
      "¿Paradas en el camino o directo?"
    ],
    context: "Los viajes en auto crean espacio para conversaciones profundas y aventuras compartidas.",
    tags: ['travel', 'adventure', 'road-trip']
  },
  {
    id: 'conv-date-030',
    category: 'date_night',
    intensity: 2,
    question: "¿Qué gesto romántico te encantaría experimentar?",
    followUps: [
      "¿Un gran gesto o algo íntimo?",
      "¿Público o privado?",
      "¿Sorpresa o planificado?"
    ],
    context: "Entender los deseos románticos nos ayuda a hacernos sentir especiales mutuamente.",
    tags: ['romance', 'gestures', 'love']
  },

  // Preguntas "¿Preferirías?" para parejas
  {
    id: 'conv-date-031',
    category: 'date_night',
    intensity: 1,
    question: "¿Preferirías tener una noche de cita cada semana durante un año, o unas vacaciones increíbles de una semana juntos?",
    followUps: [
      "¿Qué haríamos en las vacaciones?",
      "¿Qué hace que las noches de cita regulares sean valiosas?",
      "¿Podemos comprometernos y hacer ambas?"
    ],
    context: "Esto revela preferencias de frecuencia vs. intensidad del tiempo de calidad.",
    tags: ['would-you-rather', 'preferences', 'time']
  },
  {
    id: 'conv-date-032',
    category: 'date_night',
    intensity: 2,
    question: "¿Preferirías leer mi mente por un día, o que yo leyera la tuya?",
    followUps: [
      "¿Qué querrías saber?",
      "¿De qué estarías nervioso de que yo supiera?",
      "¿Hay algo que hayas querido decir?"
    ],
    context: "Esta pregunta juguetona abre la puerta a una conversación más profunda.",
    tags: ['would-you-rather', 'communication', 'fun']
  },
  {
    id: 'conv-date-033',
    category: 'date_night',
    intensity: 2,
    question: "¿Preferirías tener un chef personal o un terapeuta de masajes por un mes?",
    followUps: [
      "¿Qué le pedirías al chef?",
      "¿Masajes diarios o profundos semanales?",
      "¿Qué dice tu elección sobre tus necesidades actuales?"
    ],
    context: "Las preferencias de lujo revelan las necesidades actuales de alimentación o relajación.",
    tags: ['would-you-rather', 'luxury', 'self-care']
  },
  {
    id: 'conv-date-034',
    category: 'date_night',
    intensity: 2,
    question: "¿Preferirías ir a una cita sorpresa planeada por mí, o planear una sorpresa para mí?",
    followUps: [
      "¿Qué planearías si fuera tu turno?",
      "¿Disfrutas más las sorpresas o la planificación?",
      "¿Cuál es la mejor cita sorpresa que has tenido?"
    ],
    context: "Esto revela preferencias de control, sorpresa y dar/recibir.",
    tags: ['would-you-rather', 'surprises', 'dates']
  },
  {
    id: 'conv-date-035',
    category: 'date_night',
    intensity: 2,
    question: "¿Preferirías revivir nuestra primera cita con todo tu conocimiento actual, o saltar a nuestra fiesta de aniversario número 50?",
    followUps: [
      "¿Qué harías diferente en esa primera cita?",
      "¿Cómo esperas que sea nuestro 50 aniversario?",
      "¿Qué querrías preservar del camino?"
    ],
    context: "Las preguntas de viaje en el tiempo revelan lo que valoramos de nuestro viaje juntos.",
    tags: ['would-you-rather', 'time', 'reflection']
  },
  {
    id: 'conv-date-036',
    category: 'date_night',
    intensity: 2,
    question: "¿Preferirías ser famosos juntos o vivir vidas completamente privadas?",
    followUps: [
      "¿Famosos por qué?",
      "¿Qué añadiría o quitaría la fama?",
      "¿Qué significa la privacidad para ti?"
    ],
    context: "Esto revela valores alrededor del reconocimiento, la privacidad y el estilo de vida.",
    tags: ['would-you-rather', 'values', 'lifestyle']
  },
  {
    id: 'conv-date-037',
    category: 'date_night',
    intensity: 2,
    question: "¿Preferirías tener dinero ilimitado pero poco tiempo juntos, o todo el tiempo juntos pero medios modestos?",
    followUps: [
      "¿Qué haríamos con dinero ilimitado?",
      "¿Cómo haríamos que los medios modestos se sintieran abundantes?",
      "¿Qué te importa más?"
    ],
    context: "Esta pregunta clásica revela la jerarquía de valores entre tiempo y dinero.",
    tags: ['would-you-rather', 'values', 'priorities']
  },
  {
    id: 'conv-date-038',
    category: 'date_night',
    intensity: 2,
    question: "¿Preferirías siempre saber lo que estoy pensando, o siempre saber lo que estoy sintiendo?",
    followUps: [
      "¿Cuál sería más útil?",
      "¿Cuál sería más abrumador?",
      "¿Hay algo que estés pensando o sintiendo ahora mismo?"
    ],
    context: "Esto explora la diferencia entre pensamientos y emociones en la conexión.",
    tags: ['would-you-rather', 'communication', 'emotions']
  },
  {
    id: 'conv-date-039',
    category: 'date_night',
    intensity: 2,
    question: "¿Preferirías vivir en nuestra casa soñada en una ubicación regular, o en una casa regular en nuestra ubicación soñada?",
    followUps: [
      "¿Qué es una casa de ensueño para ti?",
      "¿Qué es una ubicación de ensueño?",
      "¿Podemos encontrar un compromiso?"
    ],
    context: "Las preferencias de vivienda revelan prioridades en torno a la comodidad, el entorno y el estilo de vida.",
    tags: ['would-you-rather', 'home', 'lifestyle']
  },
  {
    id: 'conv-date-040',
    category: 'date_night',
    intensity: 2,
    question: "¿Preferirías nunca tener que hacer las tareas del hogar, o nunca tener que trabajar?",
    followUps: [
      "¿Qué harías con esa libertad?",
      "¿Cuál te agota más ahora?",
      "¿Qué revela tu respuesta sobre tu estrés actual?"
    ],
    context: "Esto revela los puntos de dolor actuales y lo que haríamos con la verdadera libertad.",
    tags: ['would-you-rather', 'freedom', 'stress']
  },

  // Debates y preferencias juguetones
  {
    id: 'conv-date-041',
    category: 'date_night',
    intensity: 1,
    question: "¿Cuál es el mejor ingrediente de pizza y puedes defender tu elección?",
    followUps: [
      "¿Masa delgada o gruesa?",
      "¿Piña — sí o absolutamente no?",
      "¿Cuál es tu ingrediente indeseable en la pizza?"
    ],
    context: "Los debates sobre comida son formas ligeras de aprender sobre las preferencias del otro.",
    tags: ['fun', 'debate', 'food']
  },
  {
    id: 'conv-date-042',
    category: 'date_night',
    intensity: 1,
    question: "¿Madrugador o noctámbulo — cuál es superior?",
    followUps: [
      "¿Cuál es tu mañana perfecta?",
      "¿Qué amas de tu horario preferido?",
      "¿Cómo hacemos que funcionen nuestros ritmos diferentes?"
    ],
    context: "Las diferencias de cronotipo afectan la vida diaria — entenderlas ayuda con el compromiso.",
    tags: ['fun', 'preferences', 'lifestyle']
  },
  {
    id: 'conv-date-043',
    category: 'date_night',
    intensity: 1,
    question: "¿Vacaciones en la playa o escapada a la montaña — defiende tu caso!",
    followUps: [
      "¿Qué específicamente te atrae de tu elección?",
      "¿Qué te convencería de probar la otra?",
      "¿Cuál es tu día ideal en tu destino elegido?"
    ],
    context: "Las preferencias de vacaciones revelan estilos de relajación y preferencias ambientales.",
    tags: ['fun', 'debate', 'travel']
  },
  {
    id: 'conv-date-044',
    category: 'date_night',
    intensity: 1,
    question: "¿Mensajes de texto o llamadas — cuál es mejor para mantenerse conectados?",
    followUps: [
      "¿Cuándo es apropiado cada uno?",
      "¿Qué prefieres durante el día?",
      "¿Qué te hace sentir más conectado?"
    ],
    context: "Las preferencias de comunicación afectan cómo nos mantenemos conectados durante el día.",
    tags: ['fun', 'communication', 'preferences']
  },
  {
    id: 'conv-date-045',
    category: 'date_night',
    intensity: 1,
    question: "¿Cocinar juntos o pedir a domicilio — cuál es mejor para una noche de cita?",
    followUps: [
      "¿Cuál es tu plato especial?",
      "¿Cuál es tu pedido favorito?",
      "¿Qué hace especial a cada uno?"
    ],
    context: "Esto revela preferencias de actividad vs. relajación en las noches de cita.",
    tags: ['fun', 'food', 'date-night']
  },
  {
    id: 'conv-date-046',
    category: 'date_night',
    intensity: 1,
    question: "¿Gran fiesta o cena íntima — cuál es más divertido?",
    followUps: [
      "¿Cuál es el tamaño de grupo ideal para ti?",
      "¿Qué hace que cada uno sea energizante o agotador?",
      "¿Cómo equilibramos ambas?"
    ],
    context: "Las preferencias sociales afectan cómo estructuramos nuestra vida social juntos.",
    tags: ['fun', 'social', 'preferences']
  },
  {
    id: 'conv-date-047',
    category: 'date_night',
    intensity: 1,
    question: "¿Aventura espontánea o itinerario planificado — cuál gana?",
    followUps: [
      "¿Cuál es la cosa más espontánea que hemos hecho?",
      "¿Cuál es la cosa más planificada?",
      "¿Cómo equilibramos ambos enfoques?"
    ],
    context: "Los estilos de planificación afectan los viajes y la vida diaria — encontrar el equilibrio es clave.",
    tags: ['fun', 'planning', 'adventure']
  },
  {
    id: 'conv-date-048',
    category: 'date_night',
    intensity: 1,
    question: "¿Dulce o salado — cuál es el perfil de sabor superior?",
    followUps: [
      "¿Cuál es tu golosina dulce definitiva?",
      "¿Cuál es tu plato salado definitivo?",
      "¿Postre antes de cenar — aceptable o un crimen?"
    ],
    context: "Las preferencias de sabor son sorprendentemente reveladoras de la personalidad y los valores.",
    tags: ['fun', 'food', 'preferences']
  },
  {
    id: 'conv-date-049',
    category: 'date_night',
    intensity: 1,
    question: "¿Quedarse en casa o salir — cuál es la noche perfecta?",
    followUps: [
      "¿Qué hace perfecta una noche en casa?",
      "¿Qué hace perfecta una noche de salida?",
      "¿Cómo decidimos cuando no estamos de acuerdo?"
    ],
    context: "Las preferencias de homebody vs. aventurero dan forma a nuestro tiempo de ocio.",
    tags: ['fun', 'preferences', 'lifestyle']
  },
  {
    id: 'conv-date-050',
    category: 'date_night',
    intensity: 2,
    question: "¿Cuál es una opinión controvertida que tienes y con la que podría no estar de acuerdo?",
    followUps: [
      "¿Por qué tienes esa opinión?",
      "¿Vamos a discutir por eso?",
      "¿Qué puedes enseñarme sobre tu perspectiva?"
    ],
    context: "El desacuerdo respetuoso mantiene las relaciones intelectualmente estimulantes.",
    tags: ['fun', 'debate', 'perspective']
  }
];

export default dateNightStartersES;
