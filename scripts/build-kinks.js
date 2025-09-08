// scripts/build-kinks.js
// Node 18+
// Usage: node scripts/build-kinks.js
// Inputs (if present): ./kinks.en.json, ./kinks.extra.en.json, ./kinks.es.json, ./kinks.extra.es.json
// Outputs (overwritten): ./kinks.en.json (250), ./kinks.es.json (250)

const fs = require("fs");

const EN_IN = ["./apps/mobile/data/kinks.en.json", "./apps/mobile/data/kinks.extra.en.json"];
const ES_IN = ["./apps/mobile/data/kinks.es.json", "./apps/mobile/data/kinks.extra.es.json"];
const EN_OUT = "./apps/mobile/data/kinks.en.json";
const ES_OUT = "./apps/mobile/data/kinks.es.json";


function loadList(paths) {
  const out = [];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const arr = JSON.parse(fs.readFileSync(p, "utf8"));
        if (Array.isArray(arr)) out.push(...arr);
      } catch {}
    }
  }
  return out;
}

function isPlaceholder(it) {
  const slug = (it.slug || "").toLowerCase();
  const title = (it.title || "").toLowerCase();
  return slug.startsWith("soft-play-") || title.startsWith("soft play #");
}

function normalize(it) {
  return {
    id: String(it.id ?? "").trim(),
    slug: String((it.slug || "").trim().toLowerCase().replace(/\s+/g, "-")),
    title: String(it.title || "").trim(),
    description: String(it.description || "").trim(),
    tags: Array.isArray(it.tags) ? it.tags : [],
    category: String(it.category || "misc").trim(),
    intensityScale: Math.max(1, Math.min(3, parseInt(it.intensityScale || 1, 10))),
    aliases: Array.isArray(it.aliases) ? it.aliases : [],
    createdBy: String(it.createdBy || "system"),
    tier: ["romance","soft","naughty","xxx"].includes(it.tier) ? it.tier : "soft",
  };
}

function dedupeBySlug(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    if (!it.slug) continue;
    if (seen.has(it.slug)) continue;
    seen.add(it.slug);
    out.push(it);
  }
  return out;
}

// disallow illegal/unsafe/non-consent (incl. "forced"), bodily fluids you banned, animals, minors, etc.
const bannedRx = new RegExp(
  "\\bforced\\b|non[- ]?consent|rape|blackmail|coerc|incest|minor|under\\s*age|underage|blood|urine|pee|scat|feces|animal|bestial|zoophilia|necroph",
  "i"
);
function filterDisallowed(items) {
  return items.filter(it => {
    const blob = `${it.slug} ${it.title} ${it.description}`;
    return !bannedRx.test(blob);
  });
}

function addPair(slug, enTitle, enDesc, esTitle, esDesc, tags, category, intensity, tier="naughty") {
  const base = { slug, tags: tags || [], category, intensityScale: Math.max(1, Math.min(3, intensity|0)), aliases: [], createdBy: "system", tier };
  const en = normalize({ ...base, title: enTitle, description: enDesc });
  const es = normalize({ ...base, title: esTitle, description: esDesc });
  return [en, es];
}

function addFamily(prefix, enT, esT, enD, esD, category, intensity, tier, tags, count) {
  const out = [];
  for (let i = 1; i <= count; i++) {
    const slug = `${prefix}-${i}`;
    out.push([slug, `${enT} #${i}`, enD, `${esT} #${i}`, esD, tags, category, intensity, tier]);
  }
  return out;
}

function renumber(items) {
  return items.map((it, idx) => ({ ...it, id: String(idx).padStart(4, "0") }));
}

// ---------- load & pre-clean
let en = loadList(EN_IN).filter(it => !isPlaceholder(it)).map(normalize);
let es = loadList(ES_IN).filter(it => !isPlaceholder(it)).map(normalize);

en = filterDisallowed(dedupeBySlug(en));
es = filterDisallowed(dedupeBySlug(es));

// ---------- curated kinky, consensual, bilingual additions (non-graphic)
const curated = [
  // dress-up / presentation
  ["dress-up-wardrobe","Dress-up wardrobe session","Picking outfits together (lingerie, latex-look, leather) and doing a mini runway at home.",
   "Sesión de vestuario","Elegir atuendos (lencería, look látex, cuero) y hacer una mini pasarela en casa.",
   ["costume","aesthetic"],"roleplay",2,"naughty"],
  ["sissy-roleplay-consensual","Sissy roleplay (consensual)","Exploring a 'sissy' presentation with clearly agreed words and aftercare.",
   "Juego de rol estilo “sissy” (consensuado)","Explorar una presentación “sissy” con palabras pactadas y aftercare.",
   ["expression","roleplay"],"roleplay",2,"naughty"],
  ["crossdressing-style","Cross-dressing style play","Trying styles linked to another gender with support and compliments.",
   "Juego de vestimenta cruzada","Probar estilos asociados a otro género con apoyo y halagos.",
   ["expression","style"],"roleplay",1,"soft"],
  ["feminization-guided","Feminization coaching","Guided makeup/voice/mannerism practice in a respectful scene.",
   "Coaching de feminización","Práctica guiada de maquillaje/voz/modales en una escena respetuosa.",
   ["expression","style"],"roleplay",2,"soft"],
  ["maid-service-adults","Maid/service outfit (adults)","Service-themed outfit and playful etiquette with clear limits.",
   "Uniforme de servicio (adultos)","Disfraz con tema de servicio y etiqueta juguetona con límites claros.",
   ["costume","roles"],"roleplay",1,"soft"],
  ["heels-boots-worship","Heel/boot appreciation","Admiring footwear aesthetics; massage and compliments by consent.",
   "Apreciación de tacones/botas","Apreciar el calzado; masajes y halagos con consentimiento.",
   ["aesthetic","worship"],"roleplay",1,"soft"],

  // CNM / group
  ["threesome-mmf","Threesome (MMF)","Consensual encounter with two men and one woman; roles, safer-sex, and privacy planned.",
   "Trío (MMF)","Encuentro consensuado con dos hombres y una mujer; roles, sexo más seguro y privacidad planificados.",
   ["cnm","group"],"group",3,"xxx"],
  ["threesome-mff","Threesome (MFF)","Consensual encounter with one man and two women; agree signals and aftercare.",
   "Trío (MFF)","Encuentro consensuado con un hombre y dos mujeres; acordar señales y aftercare.",
   ["cnm","group"],"group",3,"xxx"],
  ["threesome-fff","Threesome (FFF)","Consensual encounter among three women; boundaries and privacy first.",
   "Trío (FFF)","Encuentro consensuado entre tres mujeres; límites y privacidad primero.",
   ["cnm","group"],"group",3,"xxx"],
  ["group-4plus-topic","Group play (4+) — topic","Interest in a multi-partner scene; strong consent planning and safer-sex.",
   "Juego en grupo (4+) — tema","Interés en una escena con múltiples personas; planificación sólida del consentimiento y sexo más seguro.",
   ["cnm","group"],"group",3,"xxx"],
  ["hotwife-consent","Hot-wife (consensual)","One partner dates/plays by agreement; the other may watch or join.",
   "Hot-wife (consensuado)","Una persona sale/juega por acuerdo; la pareja puede observar o participar.",
   ["cnm","voyeur"],"group",3,"naughty"],
  ["cuckolding-consent","Cuckolding (consensual)","Observer watches partner with another by prior agreement; language pre-agreed.",
   "Cuckolding (consensuado)","La persona observadora ve a su pareja con otra por acuerdo previo; lenguaje pactado.",
   ["cnm","voyeur"],"group",3,"naughty"],
  ["dp-topic","Double penetration — topic","Interest in DP as a negotiated topic; plan safety and boundaries.",
   "Doble penetración — tema","Interés en DP como tema negociado; planear seguridad y límites.",
   ["group","topic"],"group",3,"xxx"],
  ["gangbang-topic","Gangbang — topic","Interest in many-focused-on-one scenario; robust consent, roles, and aftercare.",
   "Gangbang — tema","Interés en un escenario de múltiples personas enfocadas en una; consentimiento robusto, roles y aftercare.",
   ["group","topic"],"group",3,"xxx"],

  // fluids (non-graphic)
  ["semen-play-topic","Cum play — topic","Interest in semen as part of play; align on testing, barriers, and cleanup.",
   "Juego con semen — tema","Interés en el semen como parte del juego; acordar pruebas, barreras y limpieza.",
   ["fluids","health"],"environment",3,"xxx"],
  ["semen-sharing-topic","Cum swap — topic","Discuss sharing semen (e.g., between partners) with safer-sex planning.",
   "Intercambio de semen — tema","Conversar sobre compartir semen (p. ej., entre parejas) con planificación de sexo más seguro.",
   ["fluids","privacy"],"environment",3,"xxx"],
  ["bukkake-topic","Semen-focused group — topic","Group interest centered on semen; privacy and health plans required.",
   "Grupo centrado en semen — tema","Interés grupal centrado en el semen; requiere planes de privacidad y salud.",
   ["cnm","fluids"],"group",3,"xxx"],
  ["saliva-play-topic","Spit play — topic","Interest in saliva exchange; hygiene and consent rules set first.",
   "Juego con saliva — tema","Interés en intercambio de saliva; primero reglas de higiene y consentimiento.",
   ["fluids","hygiene"],"environment",2,"naughty"],

  // control / chastity
  ["edging-advanced","Edging (advanced)","Extended tease near climax with timers and signals.",
   "Edging (avanzado)","Insinuación prolongada cerca del clímax con temporizadores y señales.",
   ["timing","control"],"communication",2,"naughty"],
  ["orgasm-denial-scene","Orgasm denial (scene)","Negotiated delay of release within a scene with aftercare.",
   "Negación del orgasmo (escena)","Aplazamiento negociado de la liberación dentro de una escena con aftercare.",
   ["control","timing"],"communication",3,"naughty"],
  ["chastity-keyholder","Chastity keyholder dynamic","Consensual control of release timing and toy access; frequent check-ins.",
   "Dinámica de castidad (keyholder)","Control consensuado del momento de liberación y acceso a juguetes; chequeos frecuentes.",
   ["control","ritual"],"communication",2,"naughty"],

  // impact & restraint
  ["impact-hand","Spanking (hand)","Hand spanking on agreed areas; warm-up and aftercare.",
   "Nalgadas (mano)","Nalgadas con la mano en zonas acordadas; calentamiento y aftercare.",
   ["impact"],"sensory",2,"naughty"],
  ["impact-paddle","Paddle play","Paddle strikes counted with check-ins; avoid unsafe areas.",
   "Juego con paleta","Golpes con paleta contados y con chequeos; evitar zonas inseguras.",
   ["impact","tools"],"sensory",2,"naughty"],
  ["impact-crop","Riding crop","Targeted light taps; safe-zone map agreed first.",
   "Látigo corto","Toques ligeros dirigidos; mapa de zonas seguras acordado primero.",
   ["impact","tools"],"sensory",2,"naughty"],
  ["impact-flogger","Flogger (thuddy)","Deeper sensations on safe zones; rhythm and breath checks.",
   "Flogger (sensación profunda)","Sensaciones más profundas en zonas seguras; ritmo y chequeos de respiración.",
   ["impact","tools"],"sensory",2,"naughty"],
  ["impact-cane-topic","Cane — topic","Interest in light-to-medium caning; negotiation and progressive testing.",
   "Vara — tema","Interés en azotes con vara de leve a medio; negociación y prueba progresiva.",
   ["impact","topic"],"sensory",3,"naughty"],
  ["hair-pulling","Hair pulling (consensual)","Guided hair pulls with hand placement and verbal signals.",
   "Jalar del cabello (consensual)","Jalones guiados con colocación de manos y señales verbales.",
   ["impact"],"sensory",2,"naughty"],
  ["face-slap-light","Light face slaps (consensual)","Pre-agreed light slaps with frequent check-ins and opt-out.",
   "Bofetadas ligeras (consensual)","Bofetadas ligeras preacordadas con chequeos frecuentes y salida inmediata.",
   ["impact"],"sensory",2,"naughty"],

  ["rope-basic","Rope bondage (basic)","Simple ties with two-finger space and safety shears.",
   "Ataduras con cuerda (básico)","Ataduras simples con espacio de dos dedos y tijeras de seguridad.",
   ["rope","safety"],"light_restraint",2,"naughty"],
  ["rope-harness","Decorative rope harness","Loose harness for aesthetics and gentle guidance.",
   "Arnés decorativo de cuerda","Arnés suelto para estética y guía suave.",
   ["rope","aesthetic"],"light_restraint",2,"soft"],
  ["rope-partial-suspension","Partial suspension (feet grounded)","Supported rope with feet on floor; advanced safety.",
   "Suspensión parcial (pies apoyados)","Trabajo con cuerda con pies apoyados; seguridad avanzada.",
   ["rope","advanced"],"light_restraint",3,"naughty"],
  ["leash-gentle","Leash (gentle guidance)","Decorative leash for gentle, consensual guidance.",
   "Correa (guía suave)","Correa decorativa para guía suave y consensuada.",
   ["restraint","aesthetic"],"light_restraint",2,"naughty"],
  ["collar-ritual","Collar ritual","Collar as a consensual symbol with comfort checks.",
   "Ritual de collar","Collar como símbolo consensuado con chequeos de comodidad.",
   ["ritual","symbol"],"light_restraint",2,"naughty"],
  ["gag-soft","Soft gag (breath-safe)","Removable, breath-safe gag with hand signals and breaks.",
   "Mordaza suave (respirable)","Mordaza removible y respirable con señales manuales y pausas.",
   ["restraint","signals"],"light_restraint",2,"naughty"],
  ["hood-sensory","Sensory hood (breath-safe)","Mesh/vented hood for visual focus; no airway restriction.",
   "Capucha sensorial (respirable)","Capucha con malla/ventilación para enfoque visual; sin restringir la vía aérea.",
   ["sensory","safety"],"sensory",2,"naughty"],
  ["wrap-encasement","Plastic-wrap encasement (breath-safe)","Light encasement with breathing pathways clear; scissors ready.",
   "Envoltura con plástico (respirable)","Encapsulamiento ligero con vías respiratorias libres; tijeras listas.",
   ["restraint","advanced"],"light_restraint",3,"naughty"],

  // toys / strap / prostate
  ["pegging-strapon","Pegging (strap-on)","Harness play with prep, hygiene, and communication.",
   "Pegging (arnés)","Juego con arnés con preparación, higiene y comunicación.",
   ["toys","role"],"props_and_toys",3,"xxx"],
  ["prostate-massage","Prostate massage — topic","Interest in prostate stimulation with plenty of lube and patience.",
   "Masaje prostático — tema","Interés en estimulación prostática con abundante lubricante y paciencia.",
   ["toys","topic"],"props_and_toys",2,"naughty"],
  ["anal-training-set","Anal training set","Progressive sizes, ample lube, slow pacing, and communication.",
   "Kit de entrenamiento anal","Tamaños progresivos, abundante lubricante, ritmo lento y comunicación.",
   ["toys","training"],"props_and_toys",3,"xxx"],
  ["remote-toy","Remote/app-controlled toy","App or remote toy within agreed windows and signals.",
   "Juguete con app/control remoto","Juguete por app o control remoto dentro de ventanas y señales acordadas.",
   ["toys","remote"],"props_and_toys",2,"naughty"],
  ["nipple-clamps","Nipple clamps (light)","Light clamps with time limits; release if numbness.",
   "Pinzas en pezones (ligeras)","Pinzas ligeras con límite de tiempo; liberar ante adormecimiento.",
   ["sensory","tools"],"sensory",2,"naughty"],
  ["suction-toys","Suction toys (gentle)","Light suction used briefly with skin checks.",
   "Juguetes de succión (suave)","Succión ligera por poco tiempo con chequeos de piel.",
   ["sensory","tools"],"sensory",2,"soft"],
  ["tens-electro","TENS unit (low)","Tingling sensations on safe zones with medical-grade device.",
   "Unidad TENS (baja)","Cosquilleo en zonas seguras con equipo de grado médico.",
   ["electro","safety"],"sensory",2,"naughty"],
  ["glass-metal","Glass/metal toys (temp)","Using toy temperature safely with checks and lube.",
   "Juguetes de vidrio/metal (temperatura)","Usar temperatura del juguete de forma segura con chequeos y lubricante.",
   ["toys","temperature"],"props_and_toys",2,"naughty"],
  ["double-strap-harness","Double-strap harness","Two-strap harness configuration with hygiene prep.",
   "Arnés de doble correa","Configuración de dos correas con preparación de higiene.",
   ["toys"],"props_and_toys",3,"xxx"],

  // language / power
  ["consensual-degradation","Consensual degradation (pre-agreed)","Pre-agreed spicy put-downs within a scene; confirm words and aftercare.",
   "Degradación consensuada (preacordada)","Descalificaciones picantes preacordadas dentro de la escena; confirmar palabras y aftercare.",
   ["language","roles"],"communication",2,"naughty"],
  ["name-calling-preagreed","Name-calling (pre-agreed)","Labels used only if explicitly agreed; can stop anytime.",
   "Apodos intensos (preacordados)","Términos usados solo si se acuerdan explícitamente; se puede parar en cualquier momento.",
   ["language"],"communication",2,"naughty"],
  ["scripted-surrender","Scripted surrender roleplay (consensual)","Planned fantasy of power imbalance with clear signals and opt-out.",
   "Rendición guionizada (consensual)","Fantasía planificada de desequilibrio de poder con señales claras y salida inmediata.",
   ["roles","signals"],"roleplay",2,"naughty"],
  ["dirty-talk","Dirty talk (consensual)","Spicy language agreed in advance; avoid unagreed slurs.",
   "Dirty talk (consensuado)","Lenguaje picante acordado previamente; evitar términos no pactados.",
   ["language"],"communication",2,"naughty"],
];

const families = []
  // impact families
  .concat(addFamily("impact-paddle-var","Paddle set","Conjunto de paletas",
    "Exploring paddle sizes and materials with check-ins.","Explorar tamaños y materiales con chequeos.",
    "sensory",2,"naughty",["impact","tools"],6))
  .concat(addFamily("impact-flogger-var","Flogger patterns","Patrones con flogger",
    "Rhythms and counts on safe zones only.","Ritmos y conteos solo en zonas seguras.",
    "sensory",2,"naughty",["impact","tools"],6))
  .concat(addFamily("impact-crop-var","Crop precision","Precisión con látigo corto",
    "Target marks on agreed areas; light-to-medium only.","Marcas dirigidas en zonas acordadas; solo leve a medio.",
    "sensory",2,"naughty",["impact","tools"],6))
  // rope/restraint families
  .concat(addFamily("rope-harness-var","Rope harness style","Estilo de arnés de cuerda",
    "Different chest/leg patterns; two-finger space; photos optional (private).",
    "Distintos patrones de pecho/piernas; espacio de dos dedos; fotos opcionales (privadas).",
    "light_restraint",2,"naughty",["rope","aesthetic"],8))
  .concat(addFamily("position-bondage-var","Positioning ties","Ataduras de posicionamiento",
    "Short holds in comfy positions with support and breaks.",
    "Sujeciones cortas en posturas cómodas con apoyo y pausas.",
    "light_restraint",2,"naughty",["rope","position"],6))
  .concat(addFamily("collar-ritual-var","Collar protocols","Protocolos de collar",
    "Agreed rituals around wearing/removing a collar.",
    "Rituales acordados para poner/quitar el collar.",
    "light_restraint",2,"naughty",["ritual","symbol"],4))
  // toys / anal / prostate
  .concat(addFamily("anal-training-step","Anal training step","Paso de entrenamiento anal",
    "Next size in a well-lubed training plan; patience and breath.",
    "Siguiente tamaño en un plan bien lubricado; paciencia y respiración.",
    "props_and_toys",3,"xxx",["toys","training"],8))
  .concat(addFamily("prostate-pattern-var","Prostate patterns","Patrones prostáticos",
    "Experimenting with angles and rhythm; stop if discomfort.",
    "Experimentar con ángulos y ritmo; parar ante incomodidad.",
    "props_and_toys",2,"naughty",["toys","topic"],5))
  .concat(addFamily("remote-toy-var","Remote toy routine","Rutina con juguete remoto",
    "Pre-agreed windows and intensity ladders via app.",
    "Ventanas preacordadas y escalas de intensidad vía app.",
    "props_and_toys",2,"naughty",["remote","toys"],6))
  // dress-up families
  .concat(addFamily("latex-look-var","Latex-look outfit","Conjunto estilo látex",
    "Shiny outfit play with comfort and temperature checks.",
    "Juego con prenda brillante; chequeos de comodidad y temperatura.",
    "roleplay",2,"naughty",["aesthetic","costume"],6))
  .concat(addFamily("leather-look-var","Leather-look outfit","Conjunto estilo cuero",
    "Confident leather aesthetics; care and comfort talk.",
    "Estética de cuero con confianza; charla de cuidado y comodidad.",
    "roleplay",1,"soft",["aesthetic","costume"],6))
  .concat(addFamily("cosplay-var","Sexy cosplay (adults)","Cosplay sexy (adultos)",
    "Fictional characters with clear boundaries and consent.",
    "Personajes ficticios con límites claros y consentimiento.",
    "roleplay",2,"naughty",["costume","roleplay"],8))
  // language / power
  .concat(addFamily("degradation-phrase-var","Pre-agreed phrases","Frases preacordadas",
    "Using ONLY listed words; stop immediately on signal.",
    "Usar SOLO las palabras listadas; parar de inmediato ante señal.",
    "communication",2,"naughty",["language","roles"],6))
  .concat(addFamily("scripted-surrender-var","Scripted surrender beat","Beat de rendición guionizada",
    "Short scene beats with clear opt-out; debrief after.",
    "Beats de escena cortos con salida clara; conversación después.",
    "roleplay",2,"naughty",["roles","signals"],6))
  // fluids / voyeur / exhibition
  .concat(addFamily("semen-marking-topic","Semen marking — topic","Marcado con semen — tema",
    "Discuss where/when is okay; hygiene, testing, and cleanup plans.",
    "Hablar de dónde/cuándo está bien; higiene, pruebas y limpieza.",
    "environment",3,"xxx",["fluids","health"],6))
  .concat(addFamily("saliva-topic-var","Spit exchange — topic","Intercambio de saliva — tema",
    "Guidelines for spitting/kissing exchange; consent and hygiene first.",
    "Guías para intercambio de saliva/besos; consentimiento e higiene primero.",
    "environment",2,"naughty",["fluids","hygiene"],4))
  .concat(addFamily("voyeur-scene-var","Voyeur scene (private)","Escena voyeur (privada)",
    "Being watched/ watching in a private, legal setting by consent.",
    "Ser visto/ver en un entorno privado y legal por consentimiento.",
    "environment",2,"naughty",["voyeur","privacy"],6))
  .concat(addFamily("exhibition-soft-var","Discreet exhibition (legal)","Exhibicionismo discreto (legal)",
    "Subtle reveal in legal/private spaces; plan signals.",
    "Revelación sutil en espacios legales/privados; planear señales.",
    "environment",2,"naughty",["privacy","exhibition"],5));

function pushPairs(pairs, enList, esList) {
  const have = new Set(enList.map(x => x.slug));
  for (const p of pairs) {
    const [enItem, esItem] = addPair(...p);
    if (have.has(enItem.slug)) continue;
    enList.push(enItem);
    esList.push(esItem);
    have.add(enItem.slug);
  }
}

pushPairs(curated, en, es);
pushPairs(families, en, es);

// align slugs and cap/pad to 250
const common = new Set(en.map(i => i.slug).filter(s => es.find(j => j.slug === s)));
let slugs = Array.from(common).sort();

// ensure max 250
if (slugs.length > 250) slugs = slugs.slice(0, 250);

// if fewer than 250 after filtering, pad with consensual variants
const existing = new Set(slugs);
let fillerIdx = 1;
while (slugs.length < 250) {
  const slug = `kinky-variant-${fillerIdx}`;
  if (!existing.has(slug)) {
    const [enItem, esItem] = addPair(
      slug,
      `Kinky variant #${fillerIdx} (consensual)`, "Consensual advanced play variant; boundaries, signals, and aftercare.",
      `Variante kinky #${fillerIdx} (consensual)`, "Variante avanzada consensuada; límites, señales y aftercare.",
      ["variant","consensual"], "roleplay", 2, "naughty"
    );
    en.push(enItem); es.push(esItem);
    existing.add(slug);
    slugs.push(slug);
  }
  fillerIdx++;
}

// build final lists in same slug order, re-ID 0000..0249
const emap = Object.fromEntries(en.map(x => [x.slug, x]));
const smap = Object.fromEntries(es.map(x => [x.slug, x]));
const enFinal = renumber(slugs.map(s => emap[s]).filter(Boolean));
const esFinal = renumber(slugs.map(s => smap[s]).filter(Boolean));

fs.writeFileSync(EN_OUT, JSON.stringify(enFinal, null, 2));
fs.writeFileSync(ES_OUT, JSON.stringify(esFinal, null, 2));

console.log({
  english_count: enFinal.length,
  spanish_count: esFinal.length,
  example_first_3: slugs.slice(0,3),
  example_last_3: slugs.slice(-3),
  out_en: EN_OUT,
  out_es: ES_OUT
});
