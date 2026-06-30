const ROLE_ORIENTED_COPY =
  /\b(your partner|your partner's|each other|each other's|give your|giving or receiving|receive|receiving|take turns|focus on|watching their reactions)\b/i;
const SPANISH_ROLE_ORIENTED_COPY =
  /\b(tu pareja|su pareja|de su pareja|del otro|el uno por el otro|el uno al otro|uno al otro|turnense|túrnense|dar o recibir|recibir|quien recibe|dar placer|la otra|el otro|una pareja|otra pareja|a la pareja|observas sus reacciones)\b/i;

const NEUTRAL_ENGLISH_BY_TITLE = new Map(
  Object.entries({
    "Deep Kissing Session": "Slow, deep kissing.",
    "Naked Cuddling": "Nude cuddling and close body contact.",
    "Romantic Whispers": "Whispered sweet, sexy, or dirty words.",
    "Slow Undressing": "Slow, deliberate undressing.",
    "Mutual Masturbation": "Mutual self-pleasure side by side.",
    "Oral Pleasure": "Oral pleasure.",
    "Light Teasing": "Light teasing with touch, pauses, and playful restraint.",
    "Feather Light Touch":
      "Feather, silk, or fingertip sensations across bare skin.",
    "Full Body Kissing Tour": "A head-to-toe body kissing tour.",
    "Erotic Storytelling": "Erotic stories read aloud or invented together.",
    "Mirror Watching": "Mirror watching and reflected intimacy.",
    "Wrist Restraints": "Soft wrist restraint play.",
    "Explicit Dirty Talk":
      "Explicit dirty talk and vivid erotic language.",
    "Nipple Play": "Nipple play with varied pressure, warmth, and touch.",
    "Sensual Biting": "Gentle biting or nibbling for building sensation.",
    "Controlled Hair Pulling":
      "Controlled hair pulling with guided pressure and positioning.",
    "Intense Bondage":
      "Full immobilization with ropes, cuffs, or restraints.",
    "Chastity Control": "Chastity and release-control rules.",
    "Consensual Degradation":
      "Degradation through welcomed words, roles, or dynamics.",
    "Group Play Fantasy": "Group-play fantasies or discussions.",
    "Rope Suspension": "Rope suspension as an advanced rope scene.",
    "Sensual Feeding":
      "Sensual feeding with fruit, chocolate, or other treats.",
    "Intimate Hair Play": "Hair play, scalp massage, and gentle pulling.",
    "Guided Hand Exploration":
      "Guided touch that shows preferred pace, pressure, and placement.",
    "Synchronized Breathing": "Matched breathing while lying close together.",
    "Erotic Love Letters": "Passionate erotic love letters.",
    "Orgasm Denial":
      "Orgasm denial through repeated edging and stopping.",
    "Strangers at a Bar": "First-meeting roleplay with stranger chemistry.",
    "Strip Tease Performance": "Slow, seductive striptease performance.",
    "Lap Dance": "A sensual lap dance.",
    "Gentle Caressing": "Soft, slow caressing across the body.",
    "Forehead Kisses": "Soft forehead kisses and tender affection.",
    "Soothing Foot Massage": "A thorough foot massage.",
    "Gentle Back Scratching": "Gentle back scratching with fingernails.",
    "Intimate Pillow Talk":
      "Quiet pillow talk about thoughts, dreams, and feelings.",
    "Bedtime Story": "Reading aloud as a tender bedtime ritual.",
    "Breakfast in Bed": "Breakfast served in bed as an intimate gesture.",
    "Relaxing Shoulder Massage":
      "Shoulder and neck massage focused on releasing tension.",
    "Gentle Face Caressing": "Gentle fingertip tracing across the face.",
    "Sincere Compliment Session": "Genuine compliments shared out loud.",
    "Gratitude Sharing": "Gratitude shared out loud.",
    "Video Call Intimacy":
      "Video-call intimacy and shared self-pleasure while apart.",
    "Food Play":
      "Food, whipped cream, chocolate, or fruit used as sensory play.",
    "Body Paint Play":
      "Edible body paint or chocolate used for playful skin art.",
    "Lingerie Show": "A private lingerie show.",
    "Consensual Exhibitionism":
      "Consensual exhibitionism with a watched or almost-watched feeling.",
    "Mummification":
      "Full-body wrapping with plastic wrap, bandages, or tape.",
    "Forced Orgasm": "Repeated orgasm control beyond the first climax.",
    "Armpit Kissing": "Armpit kissing and nuzzling.",
    "Belly Worship": "Belly kissing, caressing, and appreciation.",
    "Ear Lobe Nibbling": "Ear-lobe nibbling and sucking.",
    "Finger Sucking": "Suggestive finger sucking.",
    "Leash Play": "Leash-guided movement or symbolic control.",
    "Light Spanking":
      "Light spanking with controlled rhythm and intensity.",
    "Handcuffs": "Handcuff restraint play.",
    "Vibrator Play":
      "Vibrator play with controlled speed, pressure, and timing.",
    "Foot Worship":
      "Focused foot attention through massage, praise, or worship.",
    "Dare Play": "Playful or erotic dares.",
    "Seduction Play":
      "Tempting, pursuing, resisting, and giving in as a seduction scene.",
    "Aftercare Ritual": "Post-scene reconnection rituals.",
    "Arousal Play": "Arousal building and awareness.",
    "Service Topping":
      "Service topping centered on requested sensations.",
    "Praise Kink":
      "Sincere praise, approval, and encouragement as the turn-on.",
    "Task-Based Teasing":
      "Playful tasks, timed prompts, or private challenges that build anticipation.",
    "Kneeling Rituals":
      "Kneeling, offering, or attention as a symbolic scene ritual.",
    "Body Worship":
      "Whole-body appreciation through attention, compliments, kisses, or touch.",
    "Audio Erotica Together":
      "Adult audio or private spoken fantasies shared together.",
    "Stocking Fetish":
      "Stockings, thigh-highs, or hosiery as a visual and texture turn-on.",
    "Sweat and Musk Appreciation":
      "Natural scent after movement, dancing, or closeness as a source of attraction.",
    "Rope Bunny Role":
      "Rope bottoming as a role centered on trust and presentation.",
    "Mirror Sex": "Mirror sex with watching, posing, and reflected intimacy.",
    "Compersion Talk":
      "Compersion, jealousy, and pleasure around outside attention.",
    "Pegging": "Pegging play.",
    "Manual Stimulation":
      "Manual stimulation with attentive pace, pressure, and rhythm.",
    "Face Sitting": "Oral pleasure in a face-sitting position.",
    "Face Sitting (Giving Oral)":
      "Oral pleasure in a face-sitting position.",
    "Primal Play": "Primal chasing, pinning, and playful overpowering.",
    "Consensual Face Slapping":
      "Light cheek taps as part of intense play.",
    "Pinwheel Sensation":
      "Pinwheel sensation across skin with tingling, electric pressure.",
    "Ass Worship": "Ass worship through kisses, squeezes, and admiration.",
    "Partner Yoga":
      "Couples yoga with balance, closeness, and synchronized breathing.",
    "Washing Each Other's Hair":
      "Gentle hair washing and scalp massage under warm water.",
    "Body Art Appreciation":
      "Body art appreciation with fingertips, words, and admiration.",
    "Lap Pillow Rest":
      "Lap-pillow rest with hair stroking and quiet closeness.",
    "Intimacy Bucket List":
      "A shared wish list of intimate experiences to try someday.",
    "Muscle Appreciation":
      "Muscle appreciation through admiring touch and gentle kneading.",
    "Mutual Oral (69)":
      "Simultaneous oral pleasure in a comfortable 69 position.",
    "Grinding & Dry Humping": "Partly clothed grinding and dry humping.",
    "Breast & Cleavage Play":
      "Breast and cleavage play with kissing, caressing, and pressing.",
    "Pinned Against the Wall":
      "Urgent standing closeness pinned against a wall.",
    "Body Shots":
      "Body shots with a drink or treat tasted from skin.",
    "Size Difference Play":
      "Height or size contrast as a playful erotic focus.",
    "Rimming": "Oral-anal attention after washing up.",
    "Anal Fingering":
      "Lubed anal fingering that starts small and builds gradually.",
    "Prostate Massage": "Slow, lubed internal prostate massage.",
  })
);

const NEUTRAL_SPANISH_BY_TITLE = new Map(
  Object.entries({
    "Sesión de Besos Profundos": "Besos lentos y profundos.",
    "Placer Oral": "Placer oral.",
    "Provocación Ligera":
      "Provocación ligera con caricias, pausas y contención juguetona.",
    "Tour de Besos por Todo el Cuerpo":
      "Un recorrido de besos de pies a cabeza.",
    "Narración Erótica": "Historias eróticas leídas o inventadas juntos.",
    "Restricción de Muñecas": "Juego con restricciones suaves de muñecas.",
    "Juego de Roles Maestro/Estudiante":
      "Roleplay de maestro y estudiante con una dinámica juguetona de aprendizaje.",
    "Juego con Pezones":
      "Juego con pezones usando presión, calor y caricias variadas.",
    "Mordidas Sensuales":
      "Mordidas o mordisqueos suaves para aumentar la sensación.",
    "Jalón de Cabello Controlado":
      "Jalón de cabello controlado con presión y postura guiadas.",
    "Bondage Intenso":
      "Inmovilización completa con cuerdas, esposas o restricciones.",
    "No-Consentimiento Consensuado":
      "Fantasía de resistencia y rendición dentro de un roleplay acordado.",
    "Control de Castidad": "Reglas de castidad y control de liberación.",
    "Degradación Consensuada":
      "Degradación mediante palabras, roles o dinámicas aceptadas.",
    "Suspensión con Cuerdas":
      "Suspensión con cuerdas como escena avanzada de bondage.",
    "Toque con los Ojos Vendados":
      "Exploración sensorial con venda en los ojos.",
    "Exploración Guiada con las Manos":
      "Toque guiado para mostrar ritmo, presión y ubicación preferidos.",
    "Negación de Orgasmo":
      "Negación de orgasmo mediante edging repetido y pausas.",
    "Juego con Dildo":
      "Juego con dildo con atención al ritmo, el ángulo y la comodidad.",
    "Examen de Doctor/Paciente":
      "Roleplay de examen médico íntimo.",
    "Performance de Striptease": "Striptease lento y seductor.",
    "Baile en el Regazo": "Baile sensual en el regazo.",
    "Juego de Mascotas":
      "Roleplay de mascota y cuidador con una dinámica juguetona.",
    "Besos en la Frente": "Besos suaves y tiernos en la frente.",
    "Masaje de Pies": "Masaje completo de pies.",
    "Cuento para Dormir": "Lectura en voz alta como ritual tierno antes de dormir.",
    "Desayuno en la Cama": "Desayuno en la cama como gesto íntimo.",
    "Sesión de Cumplidos": "Cumplidos sinceros compartidos en voz alta.",
    "Compartir Gratitud": "Gratitud compartida en voz alta.",
    "Capturador/Cautivo":
      "Roleplay de captor y cautivo con tensión dramática.",
    "Desfile de Lencería": "Desfile privado de lencería.",
    "Juego de Feminización":
      "Feminización como estilo, rol o dinámica erótica.",
    "Voyeurismo Consensuado":
      "Voyeurismo consensuado centrado en mirar o ser mirado.",
    "Exhibicionismo Consensuado":
      "Exhibicionismo consensuado con sensación de ser visto.",
    "Momificación": "Envoltura corporal completa con plástico o vendas.",
    "Intercambio Total de Poder":
      "Dinámica de intercambio total de poder.",
    "Orgasmo Forzado": "Control repetido del orgasmo más allá del primer clímax.",
    "Besos en las Axilas": "Besos y caricias en las axilas.",
    "Adoración del Vientre": "Besos, caricias y aprecio del vientre.",
    "Chupar Dedos": "Chupar dedos de forma sugerente.",
    "Juego con Correa": "Movimiento guiado con correa o control simbólico.",
    "Fantasía de Cornudo":
      "Fantasía de observar deseo, sexo o atención con otra persona.",
    "Fantasía de Esposa Caliente":
      "Fantasía de citas o encuentros externos con conocimiento y aprobación.",
    "Fantasía de Intercambio":
      "Fantasía de intercambio con otras personas o parejas.",
    "Nalgadas Ligeras":
      "Nalgadas ligeras con ritmo e intensidad controlados.",
    "Esposas": "Juego de restricción con esposas.",
    "Vibrador":
      "Juego con vibrador controlando velocidad, presión y ritmo.",
    "Adoración de Pies":
      "Atención enfocada en los pies mediante masaje, elogios o adoración.",
    "Juego de Retos": "Retos juguetones o eróticos.",
    "Top de Servicio":
      "Top de servicio centrado en sensaciones solicitadas.",
    "Elogios":
      "Elogios sinceros, aprobación y ánimo como fuente de excitación.",
    "Juegos de Obediencia":
      "Instrucciones simples y recompensas como juego de obediencia.",
    "Cuidado Posterior de Domspace":
      "Arraigo y tranquilidad después de una escena intensa de intercambio de poder.",
    "Rituales de Rodillas":
      "Arrodillarse, ofrecer atención o usar una postura ritual como símbolo de escena.",
    "Adoracion del Cuerpo":
      "Aprecio de todo el cuerpo mediante atención, elogios, besos o tacto.",
    "Audio Erotico Juntos":
      "Audio adulto o fantasías habladas privadas compartidas juntos.",
    "Aprecio de Sudor y Aroma Natural":
      "Atracción por el aroma natural después de moverse, bailar o estar cerca.",
    "Ver a la Pareja Coquetear":
      "Fantasía de observar coqueteo externo con seguridad emocional.",
    "Conversacion sobre Compersion":
      "Compersión, celos y placer alrededor de la atención externa.",
    "Juego con Strap-On":
      "Juego con strap-on con atención al ajuste, ritmo y ángulo.",
    "Pegging": "Juego de pegging.",
    "Estimulación Manual":
      "Estimulación manual con ritmo, presión y reacciones atentos.",
    "Sentarse en la Cara": "Placer oral en posición de face sitting.",
    "Juego Primal (Cazador)":
      "Energía primal de persecución, sujeción y dominio juguetón.",
    "Cachetadas Consensuadas":
      "Toques ligeros en la mejilla como parte de un juego intenso.",
    "Sensación con Rueda Wartenberg":
      "Sensaciones de rueda sobre la piel con presión eléctrica y cosquilleante.",
    "Adoración de Glúteos":
      "Adoración de glúteos con besos, caricias firmes y admiración.",
    "Lavarse el Cabello Mutuamente":
      "Lavado suave de cabello y masaje del cuero cabelludo bajo agua tibia.",
    "Apreciación del Arte Corporal":
      "Aprecio de tatuajes, marcas y rasgos favoritos con tacto y palabras.",
    "Descanso en el Regazo":
      "Descanso en el regazo con caricias en el cabello y cercanía tranquila.",
    "Apreciación de la Musculatura":
      "Aprecio de la musculatura mediante admiración, tacto y masaje suave.",
    "Juego de Senos y Escote":
      "Juego de senos y escote con besos, caricias y presión.",
    "Contra la Pared": "Cercanía urgente de pie contra la pared.",
    "Tragos sobre el Cuerpo":
      "Tragos sobre el cuerpo con bebida o dulce probado desde la piel.",
    "Juego de Mucama y Empleador":
      "Roleplay coqueto de servicio doméstico y empleador.",
    "Juego de Interrogatorio":
      "Roleplay de interrogatorio tenso con una confesión como fantasía.",
    "Adoración de Diosa o Deidad":
      "Adoración, elogios y mimo como escena de deidad.",
    "Juego de Objetificación":
      "Objetificación como fantasía de posar, exhibir y admirar.",
    "Beso Negro": "Atención oral-anal después de asearse.",
    "Estimulación Anal con Dedos":
      "Estimulación anal con dedos lubricados que empieza de forma gradual.",
    "Masaje de Próstata": "Masaje prostático interno lento y lubricado.",
  })
);

function normalizeSentence(value) {
  const trimmed = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/,\s*\./g, ".")
    .trim();

  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function sentenceCase(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function cleanTitle(title) {
  return String(title || "this topic")
    .replace(
      /\s*\((?:giving|receiving|give|receive|giving oral|receiving oral|dar|recibir|dar oral|recibir oral)\)\s*$/i,
      ""
    )
    .trim();
}

function cleanSpanishTitle(title) {
  return cleanTitle(title);
}

function neutralFallback(description, title) {
  const cleanedTitle = cleanTitle(title);
  let value = String(description || "")
    .split(/(?<=[.!?])\s+/)[0]
    .replace(/\b[Gg]iving or receiving\s+/g, "")
    .replace(/\b[Gg]ive your partner an?\s+/g, "A ")
    .replace(/\b[Gg]ive your partner\s+/g, "")
    .replace(/\b[Gg]ive\s+/g, "")
    .replace(/\b[Rr]eceive\s+/g, "")
    .replace(/\b[Tt]ease your partner lightly with\b/g, "Light teasing with")
    .replace(/\b[Tt]ake turns\s+/g, "")
    .replace(/\b[Ff]ocus on\s+/g, "")
    .replace(/\b[Ss]pend time\s+/g, "")
    .replace(/\byour partner's\b/gi, "the")
    .replace(/\byour partner\b/gi, "")
    .replace(/\beach other's\b/gi, "shared")
    .replace(/\beach other\b/gi, "together")
    .replace(/\bwhile watching their reactions\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  value = normalizeSentence(sentenceCase(value));

  if (
    !value ||
    value.length < 12 ||
    hasRoleOrientedCopy(value) ||
    /^(use|watch|strip|take|send|read|serve|position|lock|fill|turn|get|put)\b/i.test(
      value
    )
  ) {
    return `${cleanedTitle} as a shared kink topic.`;
  }

  return value;
}

function neutralizeKinkDescription(description, title) {
  const override = NEUTRAL_ENGLISH_BY_TITLE.get(cleanTitle(title));
  if (override) return override;
  if (!hasRoleOrientedCopy(description)) return normalizeSentence(description);
  return neutralFallback(description, title);
}

function neutralFallbackSpanish(description, title) {
  const cleanedTitle = cleanSpanishTitle(title);
  let value = String(description || "")
    .split(/(?<=[.!?])\s+/)[0]
    .replace(/\b[Dd]ar o recibir\s+/g, "")
    .replace(/\b[Dd]a\s+/g, "")
    .replace(/\b[Dd]en a su pareja\s+/g, "")
    .replace(/\b[Uu]sa\s+/g, "")
    .replace(/\b[Uu]sen\s+/g, "")
    .replace(/\b[Tt]úrnense para\s+/g, "")
    .replace(/\b[Tt]urnense para\s+/g, "")
    .replace(/\btu pareja\b/gi, "")
    .replace(/\bsu pareja\b/gi, "")
    .replace(/\bde su pareja\b/gi, "")
    .replace(/\bdel otro\b/gi, "")
    .replace(/\bel otro\b/gi, "")
    .replace(/\bla otra\b/gi, "")
    .replace(/\buna pareja\b/gi, "")
    .replace(/\botra pareja\b/gi, "")
    .replace(/\bquien recibe\b/gi, "la experiencia")
    .replace(/\bmientras observas sus reacciones\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  value = normalizeSentence(sentenceCase(value));

  if (!value || value.length < 12 || hasSpanishRoleOrientedCopy(value)) {
    return `${cleanedTitle} como tema kink compartido.`;
  }

  return value;
}

function neutralizeSpanishKinkDescription(description, title) {
  const override = NEUTRAL_SPANISH_BY_TITLE.get(cleanSpanishTitle(title));
  if (override) return override;
  if (!hasSpanishRoleOrientedCopy(description)) return normalizeSentence(description);
  return neutralFallbackSpanish(description, title);
}

function hasRoleOrientedCopy(description) {
  return ROLE_ORIENTED_COPY.test(String(description || ""));
}

function hasSpanishRoleOrientedCopy(description) {
  return SPANISH_ROLE_ORIENTED_COPY.test(String(description || ""));
}

function neutralizeKinkDescriptions(kinks) {
  return kinks.map((kink) => ({
    ...kink,
    description: neutralizeKinkDescription(kink.description, kink.title),
    descriptionEn: kink.descriptionEn
      ? neutralizeKinkDescription(kink.descriptionEn, kink.titleEn || kink.title)
      : kink.descriptionEn,
    descriptionEs: kink.descriptionEs
      ? neutralizeSpanishKinkDescription(kink.descriptionEs, kink.titleEs || kink.title)
      : kink.descriptionEs,
  }));
}

module.exports = {
  hasRoleOrientedCopy,
  hasSpanishRoleOrientedCopy,
  neutralizeKinkDescription,
  neutralizeSpanishKinkDescription,
  neutralizeKinkDescriptions,
};
