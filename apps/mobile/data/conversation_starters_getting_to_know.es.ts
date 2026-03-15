// apps/mobile/data/conversation_starters_getting_to_know.es.ts
// Conociéndonos - 50 preguntas de conversación (Español)

import { ConversationStarter } from '../lib/conversationStarters';

export const gettingToKnowStartersES: ConversationStarter[] = [
  // Memorias de la infancia y dinámica familiar (10 preguntas)
  {
    id: 'conv-get-001',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Cuál es un recuerdo de la infancia que moldeó quién eres hoy?",
    followUps: [
      "¿Cómo cambió esa experiencia tu perspectiva?",
      "¿Querrías que nuestros hijos tuvieran una experiencia similar?",
      "¿Qué le dirías a tu yo más joven sobre ese momento?"
    ],
    context: "Entender las experiencias formativas nos ayuda a ver por qué reaccionamos de ciertas maneras.",
    tags: ['deep', 'childhood', 'growth']
  },
  {
    id: 'conv-get-002',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Cómo expresaban el amor tus padres cuando eras pequeño/a?",
    followUps: [
      "¿Encuentras que expresas el amor de la misma manera?",
      "¿Hay algo que desearías que hubieran hecho diferente?",
      "¿Cómo ha influido eso en lo que necesitas de mí?"
    ],
    context: "Nuestro 'lenguaje del amor' a menudo proviene de cómo recibimos amor de niños.",
    tags: ['deep', 'family', 'love-languages']
  },
  {
    id: 'conv-get-003',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Cuál era tu tradición familiar favorita cuando eras niño/a?",
    followUps: [
      "¿Te gustaría continuar esa tradición con nuestra familia?",
      "¿Qué la hacía tan especial para ti?",
      "¿Hay nuevas tradiciones que te gustaría crear juntos?"
    ],
    context: "Las tradiciones nos conectan con nuestras raíces y crean un significado compartido.",
    tags: ['family', 'traditions', 'nostalgia']
  },
  {
    id: 'conv-get-004',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Hay algo sobre la dinámica de tu familia que tardaste años en entender?",
    followUps: [
      "¿Cómo cambió esa comprensión tu relación con ellos?",
      "¿Ves alguno de esos patrones en ti mismo/a?",
      "¿Cómo ha moldeado lo que quieres para nosotros?"
    ],
    context: "Los patrones familiares a menudo influyen inconscientemente en nuestras relaciones adultas.",
    tags: ['deep', 'family', 'self-awareness']
  },
  {
    id: 'conv-get-005',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Cuál era tu rol en tu familia cuando crecías? (El pacificador, el rebelde, el logrador...)",
    followUps: [
      "¿Sigues desempeñando ese rol hoy?",
      "¿Cómo te sirvió o limitó ese rol?",
      "¿Qué rol sientes que desempeñas en nuestra relación?"
    ],
    context: "Los roles familiares a menudo persisten en la adultez a menos que los examinemos conscientemente.",
    tags: ['family', 'patterns', 'self-awareness']
  },
  {
    id: 'conv-get-006',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algún olor o sonido que te transporte instantáneamente a la infancia?",
    followUps: [
      "¿Qué recuerdo evoca?",
      "¿Era un momento feliz para ti?",
      "¿Podemos recrear esa sensación de alguna manera?"
    ],
    context: "Las memorias sensoriales son poderosas puertas hacia nuestras experiencias pasadas.",
    tags: ['nostalgia', 'sensory', 'childhood']
  },
  {
    id: 'conv-get-007',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Qué aprendiste sobre las relaciones al observar a tus padres?",
    followUps: [
      "¿Qué quieres imitar?",
      "¿Qué harías diferente?",
      "¿Ha influido eso en cómo manejas el conflicto conmigo?"
    ],
    context: "Nuestro primer modelo de relaciones viene de lo que observamos de niños.",
    tags: ['deep', 'family', 'relationships', 'patterns']
  },
  {
    id: 'conv-get-008',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Cuál era tu mayor sueño cuando eras niño/a?",
    followUps: [
      "¿Sigue viva alguna parte de ese sueño en ti?",
      "¿Qué te hizo soltarlo, si fue así?",
      "¿Cómo puedo apoyar las partes que aún importan?"
    ],
    context: "Los sueños de la infancia revelan nuestros valores fundamentales y deseos auténticos.",
    tags: ['dreams', 'childhood', 'aspirations']
  },
  {
    id: 'conv-get-009',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algo que tu familia hacía y que pensabas era normal hasta que conociste a otras familias?",
    followUps: [
      "¿Cómo reaccionaste cuando te diste cuenta de que era diferente?",
      "¿Sigues haciéndolo?",
      "¿Es algo que querrías transmitir?"
    ],
    context: "Cada familia tiene su propia cultura—descubrir diferencias nos ayuda a elegir conscientemente.",
    tags: ['family', 'culture', 'fun']
  },
  {
    id: 'conv-get-010',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Hay una herida de tu infancia de la que todavía te estás sanando?",
    followUps: [
      "¿Cómo aparece en tu vida ahora?",
      "¿Qué necesitas cuando esa herida se activa?",
      "¿Cómo puedo apoyar tu sanación?"
    ],
    context: "La sanación ocurre en relaciones donde nos sentimos seguros de ser vulnerables.",
    tags: ['deep', 'vulnerable', 'healing', 'intimacy']
  },

  // Relaciones pasadas - Lecciones aprendidas (10 preguntas)
  {
    id: 'conv-get-011',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Cuál es la lección más importante que te enseñó una relación pasada?",
    followUps: [
      "¿Cómo ha cambiado esa lección la manera en que estás conmigo?",
      "¿Fue una lección dolorosa o una comprensión gradual?",
      "¿Qué sigues desaprendiendo?"
    ],
    context: "Las relaciones pasadas son maestras—lo que aprendemos moldea lo que creamos ahora.",
    tags: ['deep', 'growth', 'past-relationships']
  },
  {
    id: 'conv-get-012',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Qué patrón en las relaciones has tenido que romper conscientemente?",
    followUps: [
      "¿De dónde crees que vino ese patrón?",
      "¿Cómo te das cuenta cuando empieza?",
      "¿Qué te ayuda a mantenerte consciente?"
    ],
    context: "La conciencia de los patrones es el primer paso para crear algo diferente.",
    tags: ['deep', 'patterns', 'self-awareness']
  },
  {
    id: 'conv-get-013',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿En qué solías ceder que ya no aceptas?",
    followUps: [
      "¿Cuál fue el punto de quiebre?",
      "¿Cómo comunicas ese límite ahora?",
      "¿Qué te hizo darte cuenta de que merecías algo mejor?"
    ],
    context: "Nuestros límites irrompibles a menudo nacen de entender lo que no funciona para nosotros.",
    tags: ['deep', 'boundaries', 'self-worth']
  },
  {
    id: 'conv-get-014',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algo que solías creer sobre el amor y en lo que has cambiado de opinión?",
    followUps: [
      "¿Qué experiencia cambió esa creencia?",
      "¿Cómo afecta ese cambio a nuestra relación?",
      "¿Qué crees sobre el amor ahora?"
    ],
    context: "Nuestras creencias sobre el amor evolucionan a medida que crecemos y tenemos nuevas experiencias.",
    tags: ['deep', 'love', 'growth']
  },
  {
    id: 'conv-get-015',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Hay un miedo sobre las relaciones que todavía llevas contigo?",
    followUps: [
      "¿De dónde crees que viene ese miedo?",
      "¿Qué lo activa más?",
      "¿Cómo puedo ayudarte a sentirte seguro/a con ese miedo?"
    ],
    context: "Nombrar nuestros miedos disminuye su poder e invita a nuestra pareja a apoyarnos.",
    tags: ['deep', 'vulnerable', 'fear', 'trust']
  },
  {
    id: 'conv-get-016',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Qué pensabas que querías en una pareja que resultó no importar tanto?",
    followUps: [
      "¿Qué te sorprendió de lo que realmente importa?",
      "¿Cómo cambió eso tu enfoque al salir con alguien?",
      "¿Qué es lo que más valoras de mí que no estaba en tu lista original?"
    ],
    context: "La conexión real a menudo trasciende nuestras listas de requisitos y expectativas.",
    tags: ['reflection', 'growth', 'priorities']
  },
  {
    id: 'conv-get-017',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Hay algo que hiciste en relaciones pasadas de lo que no estás orgulloso/a?",
    followUps: [
      "¿Qué has aprendido de eso?",
      "¿Cómo te has perdonado?",
      "¿Qué harías diferente ahora?"
    ],
    context: "Asumir la responsabilidad de nuestros errores es parte de convertirnos en una mejor pareja.",
    tags: ['deep', 'accountability', 'growth']
  },
  {
    id: 'conv-get-018',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Qué te hizo darte cuenta de que estabas listo/a para una relación seria?",
    followUps: [
      "¿Fue un momento específico o un cambio gradual?",
      "¿Qué buscabas de manera diferente?",
      "¿Cómo lo supiste cuando me conociste a mí?"
    ],
    context: "La disposición para el compromiso a menudo proviene de cambios internos, no de presión externa.",
    tags: ['commitment', 'readiness', 'reflection']
  },
  {
    id: 'conv-get-019',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Hay alguna señal de alerta que ignoraste en el pasado y que ahora vigilas?",
    followUps: [
      "¿Qué te hizo pasarla por alto entonces?",
      "¿Cómo confías mejor en tu intuición ahora?",
      "¿Qué señales positivas buscas en cambio?"
    ],
    context: "Aprender a confiar en nuestros instintos nos protege y nos ayuda a elegir mejor.",
    tags: ['boundaries', 'self-awareness', 'trust']
  },
  {
    id: 'conv-get-020',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algo de cuando eras soltero/a que en realidad extrañas?",
    followUps: [
      "¿Hay alguna manera de traer algo de eso a nuestra relación?",
      "¿Qué te ayudó a apreciar ese tiempo?",
      "¿Cómo equilibramos independencia y unidad?"
    ],
    context: "Honrar lo que extrañamos nos ayuda a crear una relación que no requiera perdernos a nosotros mismos.",
    tags: ['independence', 'balance', 'honesty']
  },

  // Valores y creencias personales (10 preguntas)
  {
    id: 'conv-get-021',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Cuál es un valor que tienes y que jamás comprometerías, sin importar qué?",
    followUps: [
      "¿De dónde viene ese valor?",
      "¿Ha sido puesto a prueba alguna vez?",
      "¿Cómo guía tus decisiones diarias?"
    ],
    context: "Los valores fundamentales son la base de quiénes somos y cómo vivimos.",
    tags: ['deep', 'values', 'integrity']
  },
  {
    id: 'conv-get-022',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay alguna creencia que heredaste de tu cultura y que has cuestionado?",
    followUps: [
      "¿Qué te hizo empezar a cuestionarla?",
      "¿Cómo ha cambiado tu perspectiva?",
      "¿Qué partes de tu cultura sigues atesorando?"
    ],
    context: "Examinar las creencias culturales nos ayuda a elegir lo que verdaderamente resuena con nosotros.",
    tags: ['culture', 'growth', 'identity']
  },
  {
    id: 'conv-get-023',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Qué crees que sucede después de que morimos?",
    followUps: [
      "¿Cómo afecta esa creencia la manera en que vives?",
      "¿Ha cambiado esa creencia con el tiempo?",
      "¿Te trae consuelo o ansiedad?"
    ],
    context: "Nuestras creencias sobre la mortalidad moldean nuestras prioridades y cómo usamos nuestro tiempo.",
    tags: ['deep', 'spirituality', 'philosophy']
  },
  {
    id: 'conv-get-024',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Sobre qué causa social eres más apasionado/a y por qué?",
    followUps: [
      "¿Qué experiencia personal te conecta con ella?",
      "¿Qué desearías que más personas entendieran?",
      "¿Cómo actúas al respecto?"
    ],
    context: "Nuestras pasiones revelan lo que nos importa profundamente y aquello por lo que luchamos.",
    tags: ['values', 'passion', 'purpose']
  },
  {
    id: 'conv-get-025',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Qué significa el éxito para ti? No la definición de la sociedad—la tuya.",
    followUps: [
      "¿Ha cambiado esa definición con el tiempo?",
      "¿Estás viviendo de acuerdo con esa definición ahora?",
      "¿Cómo puedo apoyar tu visión del éxito?"
    ],
    context: "Definir el éxito por nosotros mismos nos libera de la comparación y la validación externa.",
    tags: ['values', 'success', 'authenticity']
  },
  {
    id: 'conv-get-026',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Qué crees sobre el perdón?",
    followUps: [
      "¿Es algo que das libremente o algo que debe ganarse?",
      "¿Has tenido que perdonar algo importante?",
      "¿Cómo te perdonas a ti mismo/a?"
    ],
    context: "Nuestra relación con el perdón afecta cómo atravesamos el conflicto y el dolor.",
    tags: ['deep', 'forgiveness', 'healing']
  },
  {
    id: 'conv-get-027',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algún principio por el que intentas vivir todos los días?",
    followUps: [
      "¿Cómo te lo recuerdas?",
      "¿Cuándo fue la última vez que realmente lo pusiste en práctica?",
      "¿Qué pasa cuando no estás a la altura?"
    ],
    context: "Los principios diarios guían nuestras acciones y moldean nuestro carácter con el tiempo.",
    tags: ['values', 'integrity', 'daily-life']
  },
  {
    id: 'conv-get-028',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Qué papel juega la fe o la espiritualidad en tu vida, si es que la tiene?",
    followUps: [
      "¿Siempre ha sido así?",
      "¿Qué encuentras significativo en ello?",
      "¿Cómo moldea tu visión del mundo?"
    ],
    context: "Las creencias espirituales, o su ausencia, influyen profundamente en cómo vemos el mundo.",
    tags: ['spirituality', 'beliefs', 'meaning']
  },
  {
    id: 'conv-get-029',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Qué crees sobre la naturaleza del amor?",
    followUps: [
      "¿Es una elección o un sentimiento?",
      "¿Cambia con el tiempo?",
      "¿Qué hace que el amor dure, en tu opinión?"
    ],
    context: "Nuestra filosofía del amor moldea cómo enfocamos y nutrimos nuestra relación.",
    tags: ['deep', 'love', 'philosophy']
  },
  {
    id: 'conv-get-030',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algo que solías juzgar en los demás que ahora entiendes?",
    followUps: [
      "¿Qué cambió tu perspectiva?",
      "¿Has experimentado algo similar?",
      "¿Cómo te ha hecho más compasivo/a?"
    ],
    context: "La empatía creciente a menudo viene de experiencias de vida que nos humillan.",
    tags: ['growth', 'empathy', 'perspective']
  },

  // Sueños y aspiraciones (10 preguntas)
  {
    id: 'conv-get-031',
    category: 'getting_to_know',
    intensity: 2,
    question: "Si el dinero y el tiempo no fueran limitaciones, ¿qué harías con tu vida?",
    followUps: [
      "¿Qué te atrae de eso?",
      "¿Hay alguna manera de incorporar elementos de eso en nuestra vida actual?",
      "¿Qué te impide avanzar hacia ello ahora?"
    ],
    context: "Nuestros sueños sin restricciones revelan nuestros deseos y valores más profundos.",
    tags: ['dreams', 'aspirations', 'freedom']
  },
  {
    id: 'conv-get-032',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Qué es algo que quieres aprender o dominar en los próximos cinco años?",
    followUps: [
      "¿Por qué específicamente eso?",
      "¿Qué significaría para ti dominarlo?",
      "¿Cómo puedo apoyar ese objetivo?"
    ],
    context: "Nuestros objetivos de aprendizaje muestran lo que valoramos y en quién queremos convertirnos.",
    tags: ['growth', 'learning', 'goals']
  },
  {
    id: 'conv-get-033',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Qué legado quieres dejar atrás?",
    followUps: [
      "¿Por qué eso te importa?",
      "¿Qué estás haciendo ahora para construir hacia eso?",
      "¿Cómo quieres ser recordado/a?"
    ],
    context: "Pensar en el legado nos ayuda a alinear nuestras acciones diarias con nuestros valores más profundos.",
    tags: ['deep', 'legacy', 'purpose']
  },
  {
    id: 'conv-get-034',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algún lugar en el que siempre hayas querido vivir?",
    followUps: [
      "¿Qué te atrae de ese lugar?",
      "¿Es el lugar o el estilo de vida?",
      "¿Podríamos hacer que eso suceda algún día?"
    ],
    context: "Las ubicaciones deseadas a menudo reflejan el estilo de vida y los valores a los que aspiramos.",
    tags: ['dreams', 'travel', 'lifestyle']
  },
  {
    id: 'conv-get-035',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Cómo sería tu día ideal si pudieras diseñarlo perfectamente?",
    followUps: [
      "¿Qué elementos de eso podríamos incorporar ahora?",
      "¿Se trata más de actividad o de descanso?",
      "¿Cómo se compara con tu día típico?"
    ],
    context: "Nuestro día ideal revela lo que verdaderamente necesitamos para sentirnos realizados y felices.",
    tags: ['dreams', 'lifestyle', 'happiness']
  },
  {
    id: 'conv-get-036',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Qué miedo te impide perseguir lo que realmente quieres?",
    followUps: [
      "¿De dónde viene ese miedo?",
      "¿Cuál es lo peor que podría pasar?",
      "¿Qué harías si no tuvieras miedo?"
    ],
    context: "Nuestros miedos a menudo guardan la puerta hacia nuestros deseos más auténticos.",
    tags: ['deep', 'fear', 'courage', 'growth']
  },
  {
    id: 'conv-get-037',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algún proyecto creativo o idea de negocio que siempre hayas tenido en mente?",
    followUps: [
      "¿Qué te ha impedido empezarlo?",
      "¿Qué se necesitaría para comenzar?",
      "¿Cómo puedo ser tu animador/a en esto?"
    ],
    context: "Nuestras ideas latentes a menudo representan partes de nosotros mismos que esperan ser expresadas.",
    tags: ['creativity', 'ambition', 'dreams']
  },
  {
    id: 'conv-get-038',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Cómo sería tu jubilación perfecta?",
    followUps: [
      "¿Dónde estamos?",
      "¿Qué estamos haciendo?",
      "¿Para qué estamos ahorrando ahora para hacer eso posible?"
    ],
    context: "Las visiones compartidas del futuro nos ayudan a alinear nuestras acciones presentes.",
    tags: ['future', 'dreams', 'planning']
  },
  {
    id: 'conv-get-039',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Qué harías si supieras que no puedes fracasar?",
    followUps: [
      "¿Qué te detiene realmente?",
      "¿Cómo sería intentarlo, incluso si pudieras fallar?",
      "¿Cómo podemos hacer que sea seguro intentarlo?"
    ],
    context: "El miedo al fracaso a menudo enmascara nuestros deseos más profundos.",
    tags: ['deep', 'fear', 'courage', 'dreams']
  },
  {
    id: 'conv-get-040',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algo que quieras experimentar antes de morir?",
    followUps: [
      "¿Por qué es eso importante para ti?",
      "¿Cómo se sentiría lograrlo?",
      "¿Cómo podemos hacerlo realidad?"
    ],
    context: "Los elementos de nuestra lista de deseos revelan lo que encontramos más significativo en la vida.",
    tags: ['dreams', 'experiences', 'meaning']
  },

  // "¿Hay algo que nunca te he preguntado?" (10 preguntas)
  {
    id: 'conv-get-041',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algo de lo que estés muy orgulloso/a y de lo que nunca hablas?",
    followUps: [
      "¿Por qué no lo compartes más?",
      "¿Qué requirió lograrlo?",
      "¿Cómo te cambió?"
    ],
    context: "A menudo compartimos poco nuestros logros por modestia o por costumbre.",
    tags: ['pride', 'achievement', 'discovery']
  },
  {
    id: 'conv-get-042',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Hay un sueño secreto que nunca le has contado a nadie?",
    followUps: [
      "¿Por qué lo has guardado en secreto?",
      "¿Qué significaría perseguirlo?",
      "¿Cómo puedo ayudarte a que te sienta seguro/a compartiéndolo?"
    ],
    context: "Nuestros sueños secretos son a menudo las partes más vulnerables y preciosas de nosotros mismos.",
    tags: ['deep', 'vulnerable', 'dreams', 'trust']
  },
  {
    id: 'conv-get-043',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algo sobre lo que sabes mucho y que me sorprendería?",
    followUps: [
      "¿Cómo te metiste en eso?",
      "¿Cuál es lo más interesante de ello?",
      "¿Puedes enseñarme algo?"
    ],
    context: "Todos tenemos experiencia y pasiones ocultas esperando ser descubiertas.",
    tags: ['discovery', 'knowledge', 'fun']
  },
  {
    id: 'conv-get-044',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Hay alguna parte de ti mismo/a que todavía estás aprendiendo a aceptar?",
    followUps: [
      "¿Qué hace que esa parte sea difícil de aceptar?",
      "¿Cómo sería la aceptación plena?",
      "¿Cómo puedo ayudarte a abrazar esa parte?"
    ],
    context: "La autoaceptación es un viaje—todos somos obras en progreso.",
    tags: ['deep', 'self-acceptance', 'vulnerable']
  },
  {
    id: 'conv-get-045',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay alguna pequeña cosa que te da una alegría desproporcionada?",
    followUps: [
      "¿Por qué crees que te afecta tanto?",
      "¿Cuándo lo notaste por primera vez?",
      "¿Podemos hacer más de eso juntos?"
    ],
    context: "Nuestras pequeñas alegrías a menudo revelan lo que realmente valoramos y necesitamos.",
    tags: ['joy', 'discovery', 'happiness']
  },
  {
    id: 'conv-get-046',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Hay algo por lo que te preocupas y que nunca has mencionado?",
    followUps: [
      "¿Por qué lo has guardado para ti?",
      "¿Qué ayudaría a aliviar esa preocupación?",
      "¿Cómo podemos enfrentarlo juntos?"
    ],
    context: "Compartir nuestras preocupaciones invita a nuestra pareja a nuestro mundo interior.",
    tags: ['deep', 'vulnerable', 'trust', 'worry']
  },
  {
    id: 'conv-get-047',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algún recuerdo que atesoras y que yo no conozco?",
    followUps: [
      "¿Qué lo hizo tan especial?",
      "¿Por qué no lo has compartido antes?",
      "¿Qué significa para ti ahora?"
    ],
    context: "Nuestros recuerdos atesorados nos moldean—compartirlos profundiza la intimidad.",
    tags: ['memories', 'discovery', 'intimacy']
  },
  {
    id: 'conv-get-048',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algo en lo que desearías ser mejor?",
    followUps: [
      "¿Por qué eso te importa?",
      "¿Qué te ha impedido mejorar?",
      "¿En realidad querrías trabajar en ello, o es suficiente con desearlo?"
    ],
    context: "Las áreas en que nos percibimos cortos a menudo revelan nuestros valores y aspiraciones.",
    tags: ['growth', 'self-awareness', 'honesty']
  },
  {
    id: 'conv-get-049',
    category: 'getting_to_know',
    intensity: 3,
    question: "¿Hay alguna pregunta que siempre hayas querido hacerme pero no te hayas atrevido?",
    followUps: [
      "¿Qué te detuvo?",
      "¿Qué temes que sea la respuesta?",
      "¿Es este un buen momento para hacerla?"
    ],
    context: "Las preguntas sin hacer a menudo representan territorio sin explorar en nuestras relaciones.",
    tags: ['deep', 'discovery', 'curiosity']
  },
  {
    id: 'conv-get-050',
    category: 'getting_to_know',
    intensity: 2,
    question: "¿Hay algo sobre ti mismo/a que todavía estás descubriendo?",
    followUps: [
      "¿Qué lo hace confuso?",
      "¿Cómo sería la claridad?",
      "¿Cómo puedo apoyar tu exploración?"
    ],
    context: "Todos estamos evolucionando—reconocer nuestra incertidumbre es parte del crecimiento.",
    tags: ['growth', 'self-discovery', 'honesty']
  }
];

export default gettingToKnowStartersES;
