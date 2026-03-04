// scripts/build-kinks-v6.js
// Lean version: 80 high-quality kink cards
// Cut romance tier, cut vanilla activities, focus on actual kinks
// Give = I want to do this TO my partner
// Receive = I want my partner to do this TO me

const fs = require("fs");
const EN_OUT = "./apps/mobile/data/kinks.en.json";
const ES_OUT = "./apps/mobile/data/kinks.es.json";

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
    createdBy: "system",
    tier: ["soft","naughty","xxx"].includes(it.tier) ? it.tier : "soft",
  };
}

function renumber(items) {
  return items.map((it, idx) => ({ ...it, id: String(idx).padStart(4, "0") }));
}

function createPair(baseSlug, giveTitle, receiveTitle, giveDesc, receiveDesc, tags, category, intensity, tier) {
  const base = { tags, category, intensityScale: intensity, aliases: [], createdBy: "system", tier };
  
  const give = normalize({ 
    ...base, 
    slug: `${baseSlug}-give`,
    title: giveTitle, 
    description: giveDesc 
  });
  
  const receive = normalize({ 
    ...base, 
    slug: `${baseSlug}-receive`,
    title: receiveTitle, 
    description: receiveDesc 
  });
  
  return [give, receive];
}

function single(slug, title, desc, tags, category, intensity, tier) {
  return normalize({ slug, title, description: desc, tags, category, intensityScale: intensity, aliases: [], createdBy: "system", tier });
}

const all = [];

// ============ SOFT TIER (~20 cards) - Teasing & Light Play ============

// Oral pairs
all.push(...createPair(
  "oral-tease",
  "Giving Oral (Teasing)",
  "Receiving Oral (Teasing)",
  "Kiss everywhere except where they're aching for you. Their inner thigh, their hip, just barely grazing. Make them squirm before you give in.",
  "They torment you with almost-there kisses. So close, then away again. By the time they finally taste you, you're already halfway there.",
  ["oral", "tease"], "communication", 1, "soft"
));

all.push(...createPair(
  "oral-deep",
  "Giving Deep Oral",
  "Receiving Deep Oral",
  "Show them how much you can handle. Use your tongue, your throat, your hands. Make a mess of it. Make them see stars.",
  "They take you deep, look up at you while they do it, and you feel like you're the only thing that matters in the world.",
  ["oral", "intense"], "communication", 1, "soft"
));

all.push(...createPair(
  "oral-face-sitting",
  "Receiving Face Sitting",
  "Giving Face Sitting",
  "Lie back and let them take control. Their thighs around your head, their weight on your tongue. Just breathe and enjoy the view while they use you.",
  "Straddle them, hold the headboard, grind down exactly how you need it. They're just the instrument. Play your song until you can't anymore.",
  ["oral", "control"], "communication", 1, "soft"
));

// Mutual
all.push(single("sixty-nine", "69 Position", "Give and receive at the same time. The coordination is tricky but the payoff? Mutual bliss.", ["oral", "mutual"], "communication", 1, "soft"));
all.push(single("mutual-masturbation", "Mutual Masturbation", "Touch yourselves while watching each other. See what they like. Learn their rhythm.", ["voyeur", "exhibition"], "communication", 1, "soft"));

// Teasing
all.push(single("strip-tease", "Strip Tease", "Take it slow. Let them watch but not touch until you say so. Make them ache.", ["performance", "tease"], "roleplay", 1, "soft"));
all.push(single("lap-dance", "Lap Dance", "Straddle their lap, move slow, keep eye contact. Grind until they're hard.", ["performance", "tease"], "roleplay", 1, "soft"));
all.push(single("edging", "Edging", "Get them right to the brink, then back off. Again and again. Decide when they finally get to fall.", ["control", "tease"], "communication", 1, "soft"));

// Sensory
all.push(...createPair(
  "blindfold",
  "Blindfolding Partner",
  "Being Blindfolded",
  "Take away their sight. Every touch becomes a surprise. Every sound makes them wonder what's next.",
  "You can't see. You can only feel, hear, smell. Every touch is magnified because you can't anticipate it.",
  ["sensory", "deprivation"], "sensory", 1, "soft"
));

all.push(single("ice-play", "Ice Play", "Trace a cold cube down their spine, around their nipples, between their thighs. Watch them shiver.", ["temperature", "sensory"], "sensory", 1, "soft"));
all.push(single("wax-play", "Wax Play", "Drip warm candle wax on their skin. The sting, the heat, the anticipation of where the next drop lands.", ["temperature", "sensory"], "sensory", 1, "soft"));
all.push(single("feather-tease", "Feather Teasing", "Light as air. Everywhere except where they want it most. Make them beg for contact.", ["sensory", "tease"], "sensory", 1, "soft"));

// Remote
all.push(single("sexting", "Sexting", "Build anticipation all day. A photo here, a promise there. By nightfall, they'll be desperate.", ["communication", "remote"], "communication", 1, "soft"));
all.push(single("phone-sex", "Phone Sex", "Hear them touch themselves. Describe what you'd do if you were there.", ["communication", "remote"], "communication", 1, "soft"));

// ============ NAUGHTY TIER (~50 cards) - Impact, Bondage, Toys, Roleplay ============

// Impact
all.push(...createPair(
  "spanking",
  "Spanking",
  "Being Spanked",
  "Pull them across your lap. Make them count each one. Alternate between rubbing the sting away and adding to it.",
  "You're draped over their lap, vulnerable. The smacks come hard, then soft. You count and thank them for each one.",
  ["impact", "discipline"], "sensory", 2, "naughty"
));

all.push(...createPair(
  "hair-pulling",
  "Pulling Hair",
  "Hair Being Pulled",
  "Fist their hair at the crown. Pull their head back to expose their throat. Use it to guide them.",
  "Your partner takes a handful of your hair and pulls your head back. You're exposed, controlled, at their mercy.",
  ["impact", "dominance"], "sensory", 2, "naughty"
));

all.push(single("slapping", "Face Slapping", "A quick slap across the cheek during sex. Shocking, intimate, establishing dominance.", ["impact", "face"], "sensory", 2, "naughty"));
all.push(single("scratching", "Scratching", "Dig your nails in when they hit the right spot. Draw red lines down their back.", ["pain", "marking"], "sensory", 2, "naughty"));
all.push(single("biting", "Biting", "Neck, shoulder, thigh. Sink your teeth in hard enough to leave a reminder.", ["pain", "marking"], "sensory", 2, "naughty"));
all.push(single("flogging", "Flogging", "A flogger's tails across their back or thighs. The sound, the spread of impact, the rhythm.", ["impact", "tools"], "sensory", 2, "naughty"));

// Bondage
all.push(...createPair(
  "handcuffs",
  "Using Handcuffs",
  "Being Handcuffed",
  "Metal cuffs on their wrists. Behind their back for more vulnerability. The cold metal reminds them who's in charge.",
  "Cold metal on your wrists. Your hands are useless. You're helpless to stop them from doing whatever they want.",
  ["restraint", "tools"], "light_restraint", 2, "naughty"
));

all.push(...createPair(
  "rope-bondage",
  "Rope Bondage",
  "Being Tied With Rope",
  "Shibari-style or simple restraint. The rope bites into their skin, holds them exactly where you want them.",
  "The rope wraps around you, holding you in place. Every movement reminds you that you're bound, owned, secure.",
  ["restraint", "rope"], "light_restraint", 2, "naughty"
));

all.push(single("spread-bar", "Spreader Bar", "A bar between their ankles or wrists, keeping them exposed and unable to close up.", ["restraint", "exposure"], "light_restraint", 2, "naughty"));
all.push(single("leash-collar", "Collar & Leash", "A collar around their neck. Clip a leash on. Lead them where you want them.", ["restraint", "symbolism"], "light_restraint", 2, "naughty"));

// Power Exchange
all.push(single("commands", "Giving Commands", "Give orders. Make them ask permission. 'Open your mouth.' 'Don't move.' 'Beg for it.'", ["dominance", "control"], "communication", 2, "naughty"));
all.push(single("praise", "Praise", "Tell them how well they're doing. How good they look taking you. Watch them try harder.", ["communication", "affirmation"], "communication", 2, "naughty"));
all.push(single("degradation", "Degradation", "Words that sting. 'You're just a hole.' 'You're pathetic.' Make them feel small.", ["communication", "degradation"], "communication", 2, "naughty"));
all.push(single("name-calling", "Name Calling", "Slut. Whore. Good little toy. The right word at the right moment makes them fall apart.", ["communication", "degradation"], "communication", 2, "naughty"));
all.push(single("orgasm-control", "Orgasm Control", "Decide when they get to come. Make them ask permission. Deny them. Make them earn it.", ["control", "dominance"], "communication", 2, "naughty"));
all.push(single("begging", "Making Them Beg", "Make them ask for what they want. Make them say please. Make them desperate enough to beg.", ["control", "tease"], "communication", 2, "naughty"));

// Toys
all.push(...createPair(
  "vibrator",
  "Using Vibrator",
  "Being Vibrated",
  "Hold it against them until they're trembling. Change speeds, change positions, keep them guessing.",
  "The buzz against your most sensitive spot, building until you're right on the edge. They decide when you fall.",
  ["toys", "control"], "props_and_toys", 2, "naughty"
));

all.push(...createPair(
  "nipple-clamps",
  "Using Nipple Clamps",
  "Wearing Nipple Clamps",
  "Apply the pressure, let them adjust to the pinch, then tug on the chain. Mix of pain and pleasure.",
  "The bite of the clamp, then the rush when they flick it. Pain and pleasure so mixed up you can't tell them apart.",
  ["pain", "sensory"], "sensory", 2, "naughty"
));

all.push(single("butt-plug", "Butt Plug", "Insert a plug, leave it there. Make them wear it while you do other things. Every movement reminds them.", ["anal", "toys"], "props_and_toys", 2, "naughty"));
all.push(single("cock-ring", "Cock Ring", "Keeps them hard, sensitive, unable to soften. They'll last longer but feel everything more intensely.", ["toys", "stamina"], "props_and_toys", 2, "naughty"));
all.push(single("strap-on", "Strap-On", "Wear the harness. Take control. Give them the sensation of being filled, being taken.", ["toys", "role-reversal"], "props_and_toys", 2, "naughty"));
all.push(single("prostate-play", "Prostate Play", "Find that spot inside. Rub it. Press it. Make them feel things they didn't know their body could do.", ["anal", "toys"], "props_and_toys", 2, "naughty"));

// Anal
all.push(...createPair(
  "anal-finger",
  "Anal Fingering",
  "Receiving Anal Fingering",
  "Plenty of lube. Start with gentle circles around the rim. Take your time. Make them push back onto your finger.",
  "They work you open so slowly you almost can't stand it. One finger, barely moving, teasing until you're desperate for more.",
  ["anal", "beginner"], "props_and_toys", 2, "naughty"
));

all.push(...createPair(
  "anal-sex",
  "Anal Sex",
  "Receiving Anal Sex",
  "Deep, intense, fully seated. Hold them close, make them feel every inch. Watch them adjust to the fullness.",
  "Your partner is all the way inside, stretching you, filling you completely. You can feel every throb, every pulse.",
  ["anal", "intense"], "props_and_toys", 2, "naughty"
));

all.push(single("rimming", "Rimming", "Use your tongue where they blush to admit they want it. Soft licks, firm pressure.", ["anal", "oral"], "props_and_toys", 2, "naughty"));

// Roleplay
all.push(single("role-stranger", "Stranger Roleplay", "Pretend you don't know each other. Buy them a drink. Flirt like you're trying to take them home.", ["roleplay"], "roleplay", 2, "naughty"));
all.push(single("role-captured", "Captive Roleplay", "They're tied up, helpless. You extract what you want. They resist. You have your methods.", ["roleplay", "power"], "roleplay", 2, "naughty"));
all.push(single("role-boss", "Boss/Employee", "Late night in the office. The power dynamic is clear. They're eager to please. You're eager to be pleased.", ["roleplay", "power"], "roleplay", 2, "naughty"));
all.push(single("role-doctor", "Doctor/Patient", "Cold professionalism while touching intimate places. 'This might feel uncomfortable.'", ["roleplay", "professional"], "roleplay", 2, "naughty"));
all.push(single("role-teacher", "Teacher/Student", "They need to earn their grade. Extra credit is available. Office hours are now.", ["roleplay", "power"], "roleplay", 2, "naughty"));

// Public/Risky
all.push(single("public-oral", "Public Oral", "A dark corner, a parked car, a bathroom with a lock. Get them off fast and quiet.", ["oral", "public", "risky"], "environment", 2, "naughty"));
all.push(single("public-exposure", "Public Exposure", "A hand under the table, a whispered promise. The thrill of almost getting caught.", ["exhibition", "risky"], "environment", 2, "naughty"));
all.push(single("remote-vibrator", "Remote Vibrator", "They wear it, you control it from across the room. Or across the restaurant.", ["toys", "public", "control"], "environment", 2, "naughty"));

// ============ XXX TIER (~20 cards) - Hard Kinks, Power Exchange, Group ============

all.push(single("rough-sex", "Rough Sex", "Pounding, gripping hair, leaving bruises. Animalistic. No finesse, just need. Tear each other apart.", ["intense", "rough"], "communication", 3, "xxx"));
all.push(single("choking", "Choking (Breath Play)", "Not to restrict air, just pressure. Control. Feeling their pulse race under your palm.", ["breath", "control"], "sensory", 3, "xxx"));
all.push(single("hard-spanking", "Hard Spanking", "Not playful. Real discipline. They count, they thank you, they ask for the next one. Red marks that last.", ["impact", "discipline"], "sensory", 3, "xxx"));
all.push(single("free-use", "Free Use", "Agreement that they're always available. Watching TV? Bend them over. Consent given once, used often.", ["consensual", "availability"], "communication", 3, "xxx"));
all.push(single("cnc", "CNC", "Consensual non-consent. They say no, you ignore it, they struggle, you overpower them. Safe words essential.", ["cnc", "resistance"], "communication", 3, "xxx"));
all.push(single("sleep-play", "Sleep Play", "Pre-agreed touching, penetration while they sleep or pretend to. Wake them up in the best way.", ["sleep", "surprise"], "communication", 3, "xxx"));

// Restraint - intense
all.push(single("hogtie", "Hogtie", "Rope or cuffs at wrists and ankles, pulled together behind their back. Completely immobilized.", ["restraint", "exposure"], "light_restraint", 3, "xxx"));
all.push(single("suspension", "Suspension Bondage", "Rope harness holding them off the ground. Complete vulnerability, total trust.", ["restraint", "rope", "advanced"], "light_restraint", 3, "xxx"));

// Toys - intense
all.push(single("forced-orgasm", "Forced Orgasm", "Hold them down and don't stop even when they beg. Make them come until they can't take anymore.", ["toys", "forced", "control"], "props_and_toys", 3, "xxx"));
all.push(single("fucking-machine", "Fucking Machine", "Mechanical rhythm, relentless, unstoppable. You control the speed and depth.", ["toys", "intense"], "props_and_toys", 3, "xxx"));
all.push(single("electrostim", "Electrostimulation", "Electric pulses to their most sensitive areas. Control their nerves, control their pleasure.", ["toys", "sensory", "intense"], "props_and_toys", 3, "xxx"));

// Group
all.push(single("threesome", "Threesome", "Three bodies, endless combinations. Taking turns, working together, overwhelming the center of attention.", ["group"], "group", 3, "xxx"));
all.push(single("cuckold", "Cuckolding", "Your partner watches you with someone else. The humiliation, the arousal, the reclaiming after.", ["cuckold", "voyeur"], "group", 3, "xxx"));
all.push(single("swinging", "Swinging", "Two couples switch partners. Fresh bodies, new techniques, stories to share after.", ["swinging", "group"], "group", 3, "xxx"));
all.push(single("orgy", "Group Play", "Multiple people, multiple connections. Being passed around, completely used, total abandon.", ["group", "intense"], "group", 3, "xxx"));

// Fetish
all.push(single("age-play", "Age Play", "Adults roleplaying different ages. Power dynamics, caretaking, regression.", ["roleplay", "taboo"], "roleplay", 3, "xxx"));
all.push(single("pet-play", "Pet Play", "Collar, tail plug, crawling. They become your pet. Train them, reward them, own them.", ["pet-play", "roleplay"], "roleplay", 3, "xxx"));
all.push(single("latex", "Latex/Rubber", "Second skin. The squeak, the shine, the restriction. Every curve dramatic.", ["latex", "fetish"], "roleplay", 3, "xxx"));
all.push(single("foot-worship", "Foot Worship", "Kiss, lick, massage their feet. Admire them. Some find feet incredibly erotic.", ["feet", "worship"], "roleplay", 3, "xxx"));

// Gender & Transformation
all.push(...createPair(
  "cross-dressing",
  "Dressing Them Up",
  "Being Dressed Up",
  "Pick out their outfit—lingerie, dress, makeup. Transform them into someone new. Take photos to capture the moment.",
  "They dress you in clothes you wouldn't normally wear. Makeup, wig, the full look. You feel exposed and transformed.",
  ["gender", "transformation", "roleplay"], "roleplay", 3, "xxx"
));

all.push(...createPair(
  "feminization",
  "Feminizing Them",
  "Being Feminized",
  "Transform them into your perfect girl. Dress them, teach them to walk, to serve. They exist to please you as your feminized pet.",
  "They dress you, train you, mold you into their ideal feminine submissive. You learn to serve, to be pretty, to be theirs.",
  ["gender", "feminization", "transformation", "roleplay"], "roleplay", 3, "xxx"
));

all.push(...createPair(
  "slutification",
  "Slutifying Them",
  "Being Slutified",
  "Dress them like a whore—short skirt, no underwear, 'slut' written on their body. Send them out in public. Make them feel every eye.",
  "They dress you like a desperate slut. Everyone can see what you are. You feel dirty, exposed, and incredibly turned on.",
  ["humiliation", "exhibition", "degradation"], "roleplay", 3, "xxx"
));

all.push(...createPair(
  "gender-reversal",
  "Gender Reversal Roleplay",
  "Receiving Gender Reversal",
  "Take the 'opposite' role—if they usually lead, you lead. If they usually receive, they give. Flip the dynamic completely.",
  "They flip the script. You take their usual role, they take yours. Experience sex from the other side of the dynamic.",
  ["gender", "role-reversal", "roleplay"], "roleplay", 2, "naughty"
));

// Humiliation (intense)
all.push(...createPair(
  "public-humiliation",
  "Public Humiliation",
  "Being Publicly Humiliated",
  "Whisper what a slut they are in a crowded restaurant. Make them wear something obvious under their clothes. Send them to the bar to order while plugged.",
  "They humiliate you where people might notice. A whispered insult, a secret task, the constant fear of being discovered.",
  ["humiliation", "degradation", "public", "risky"], "environment", 3, "xxx"
));

all.push(...createPair(
  "objectification",
  "Objectifying Them",
  "Being Objectified",
  "Treat them as furniture, a footrest, a hole to use. No eye contact, no names, just their body for your pleasure. They're an object.",
  "You're not a person, you're a thing. A hole, a toy, furniture. They use you without acknowledging your humanity. You're just an object for their pleasure.",
  ["humiliation", "degradation", "objectification"], "communication", 3, "xxx"
));

// Aftercare (1 card - important but not a kink)
all.push(single("aftercare", "Aftercare", "Blankets, water, gentle touches. Reassurance. Coming back to reality together after intense play.", ["aftercare", "intimacy"], "aftercare", 1, "soft"));

// Flatten and process
const flattened = all.flat().filter(Boolean);
const seen = new Set();
const unique = [];
for (const k of flattened) {
  if (!seen.has(k.slug)) {
    seen.add(k.slug);
    unique.push(k);
  }
}

const numbered = renumber(unique);

// For Spanish, copy English for now
const spanish = numbered.map(k => ({...k}));

fs.writeFileSync(EN_OUT, JSON.stringify(numbered, null, 2));
fs.writeFileSync(ES_OUT, JSON.stringify(spanish, null, 2));

console.log("=== KINKS V6 LEAN ===");
console.log({
  total: numbered.length,
  tiers: {
    soft: numbered.filter(k => k.tier === "soft").length,
    naughty: numbered.filter(k => k.tier === "naughty").length,
    xxx: numbered.filter(k => k.tier === "xxx").length
  },
  pairs: numbered.filter(k => k.slug.includes("-give") || k.slug.includes("-receive")).length / 2,
  singles: numbered.filter(k => !k.slug.includes("-give") && !k.slug.includes("-receive")).length
});
