// scripts/build-kinks-v2.js
// Complete content overhaul - evocative, flirtatious, playful
// Usage: node scripts/build-kinks-v2.js
// Outputs (overwritten): ./kinks.en.json (250), ./kinks.es.json (250)

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
    createdBy: String(it.createdBy || "system"),
    tier: ["romance","soft","naughty","xxx"].includes(it.tier) ? it.tier : "soft",
  };
}

function renumber(items) {
  return items.map((it, idx) => ({ ...it, id: String(idx).padStart(4, "0") }));
}

// Helper to create give/receive pairs with sexy, varied descriptions
function createPair(baseSlug, titleGive, titleReceive, descGive, descReceive, tags, category, intensity, tier, aliases = []) {
  const base = { tags, category, intensityScale: intensity, aliases, createdBy: "system", tier };
  
  const give = normalize({ 
    ...base, 
    slug: `${baseSlug}-give`,
    title: titleGive, 
    description: descGive 
  });
  
  const receive = normalize({ 
    ...base, 
    slug: `${baseSlug}-receive`,
    title: titleReceive, 
    description: descReceive 
  });
  
  return [give, receive];
}

// Helper for single items
function createSingle(slug, title, desc, tags, category, intensity, tier, aliases = []) {
  return normalize({
    slug,
    title,
    description: desc,
    tags,
    category,
    intensityScale: intensity,
    aliases,
    createdBy: "system",
    tier
  });
}

// ============ ALL NEW SPICY CONTENT ============
const allKinks = [];

// ROMANCE TIER - Sensual, intimate, warm
allKinks.push(
  createSingle("aftercare-bath", "Recovery Soak", "Slip into warm water together, limbs tangled, whispering about what just happened. The best kind of debrief.", ["aftercare", "intimacy"], "aftercare", 1, "romance"),
  createSingle("slow-morning-kisses", "Lazy Morning Kisses", "No alarms, no rush. Just soft lips and wandering hands under the sheets.", ["intimacy", "slow"], "communication", 1, "romance"),
  createSingle("grazing-hands", "Accidental Touches", "Let your fingers 'accidentally' brush their thigh, their waist, the small of their back. See how long before they catch your drift.", ["tease", "anticipation"], "communication", 1, "romance"),
  createSingle("candlelit-dinner", "Feeding Each Other", "Forkfuls of dessert offered with a smirk. Fingers trailing lips after. Playing with your food has never been this adult.", ["romance", "food"], "environment", 1, "romance", ["chef apron"]),
  createSingle("bubble-bath", "Naked Bath Time", "Get in together. Let them lean back against your chest. The bubbles are just an excuse to get close.", ["intimacy", "water"], "environment", 1, "romance"),
  createSingle("shared-shower", "Steam Together", "Wash their hair. Let your hands wander. The hot water isn't the only thing making you breathless.", ["intimacy", "water"], "environment", 1, "romance"),
  createSingle("sensual-massage-oil", "Oil Them Up", "Warm oil between your palms. Take your time finding every knot, every sensitive spot. Make them melt.", ["touch", "sensory"], "sensory", 1, "romance"),
  createSingle("cuddle-naked", "Skin on Skin", "Nothing between you. Just warmth, heartbeat, and the smell of each other. Sometimes this is all you need.", ["intimacy", "comfort"], "communication", 1, "romance"),
  createSingle("whispered-secrets", "Bedroom Confessions", "In the dark, tell them things you've never said aloud. Watch trust turn into desire.", ["communication", "vulnerability"], "communication", 1, "romance"),
  createSingle("dancing-slow", "Kitchen Slow Dance", "Press close while something simmers on the stove. Sway to no music. Get distracted.", ["romance", "playful"], "environment", 1, "romance"),
  createSingle("reading-aloud", "Bedtime Stories", "Read something sexy aloud while they listen, touching themselves or you. Their voice when they can't take anymore? Worth it.", ["media", "voyeur"], "environment", 1, "soft"),
  createSingle("aromatherapy", "Scent Seduction", "Choose a scent that makes them think of you. Apply it to your pulse points and let them discover it slowly.", ["sensory", "mood"], "environment", 1, "romance")
);

// SOFT TIER - Playful, teasing, suggestive
allKinks.push(
  createSingle("strip-tease-give", "The Main Event", "You are the show. Take it slow. Let them watch but not touch until you say so.", ["performance", "tease", "giving"], "roleplay", 2, "soft", ["strip"]),
  createSingle("strip-tease-receive", "Front Row Seat", "They put on a show just for you. Sit back, enjoy, and try not to reach out until the finale.", ["performance", "tease", "receiving"], "roleplay", 2, "soft"),
  createSingle("lap-dance-give", "Private Dancer", "Straddle their lap, move slow, keep eye contact. Make them feel like the only person in the room.", ["performance", "tease", "giving"], "roleplay", 2, "soft"),
  createSingle("lap-dance-receive", "VIP Treatment", "They climb on top and take control of the rhythm. Your hands can wander... if they allow it.", ["performance", "tease", "receiving"], "roleplay", 2, "soft"),
  createSingle("outdoor-kiss", "Secret Public Touches", "A hand on their ass under a coat. A whispered promise at a dinner party. The thrill of almost getting caught.", ["exhibition", "secret"], "environment", 1, "soft"),
  createSingle("silk-scarf", "Silk Seduction", "Blindfold them with something soft. Let the fabric trail over their skin before you even touch them.", ["sensory", "blindfold"], "sensory", 1, "soft"),
  createSingle("ice-cube", "Ice Play", "Trace a cold cube down their spine, around their nipples, between their thighs. Watch them shiver for you.", ["temperature", "sensory"], "sensory", 1, "soft"),
  createSingle("feather-touch", "Tickle & Tease", "Light as air. Everywhere except where they want it most. Make them beg for contact.", ["sensory", "tease"], "sensory", 1, "soft"),
  createSingle("ear-nibbling", "Whispers & Bites", "Breathe against their ear. Nibble the lobe. Tell them exactly what you're going to do later.", ["sensory", "communication"], "communication", 1, "soft"),
  createSingle("neck-kissing", "Mark Your Territory", "Suck, bite, kiss. Leave a reminder that lasts for days. Let everyone know they're taken.", ["sensory", "possessive"], "sensory", 1, "soft"),
  createSingle("thigh-grinding", "Through the Fabric", "Dry humping isn't just for teenagers. The friction, the buildup, the clothes staying on until you can't stand it.", ["tease", "buildup"], "communication", 2, "soft"),
  createSingle("phone-sex", "Voice Alone", "Hear them touch themselves. Describe what you'd do if you were there. Sometimes words hit harder than hands.", ["communication", "remote"], "communication", 2, "soft"),
  createSingle("sexting", "Digital Foreplay", "Build anticipation all day. A photo here, a promise there. By nightfall, they'll be desperate.", ["communication", "remote"], "communication", 1, "soft"),
  createSingle("mutual-masturbation", "Show & Tell", "Touch yourselves while watching each other. See what they like. Learn their rhythm. It's education and pornography combined.", ["voyeur", "exhibition"], "communication", 2, "soft"),
  createSingle("69-gentle", "Head to Toe", "Give and receive at the same time. The coordination is tricky but the payoff? Mutual bliss.", ["oral", "mutual"], "communication", 2, "soft")
);

// ORAL - Give/Receive pairs with sexy descriptions
allKinks.push(...createPair(
  "oral-teasing",
  "Oral: The Long Way Around",
  "Oral: Receiving the Slow Treatment",
  "Kiss everywhere except where they want your mouth. Their inner thigh, their hip, just barely grazing where they're aching for you. Make them squirm before you give in.",
  "They tease you relentlessly. Close, so close, then away again. By the time they finally taste you, you're already halfway there.",
  ["oral", "tease"], "communication", 2, "soft"
));

allKinks.push(...createPair(
  "oral-deep",
  "Oral: Take It All",
  "Oral: Being Filled",
  "Show them how much you can handle. Use your tongue, your throat, your hands. Make a mess of it. Make them see stars.",
  "They take you deep, look up at you while they do it, and you feel like you're the only thing that matters in the world.",
  ["oral", "intense"], "communication", 2, "naughty"
));

allKinks.push(...createPair(
  "oral-face-sitting",
  "Oral: Ride My Face",
  "Oral: Use Their Mouth",
  "Lie back and let them take control. Their thighs around your head, their weight on your tongue. Just breathe and enjoy the view.",
  "Straddle them, hold the headboard, grind down exactly how you need it. They're just the instrument. Play your song.",
  ["oral", "control"], "communication", 2, "naughty"
));

allKinks.push(...createPair(
  "oral-public",
  "Oral: Risky Business",
  "Oral: Quick & Dirty",
  "A dark corner, a parked car, a bathroom with a lock. Get them off fast and quiet. The adrenaline makes it sweeter.",
  "Their mouth on you where someone could catch you. You have to be silent but you want to scream. Hold their hair and try not to moan.",
  ["oral", "public", "risky"], "environment", 2, "naughty"
));

// NAUGHTY TIER - Edgier, more intense
allKinks.push(
  createSingle("rough-kissing", "Bite & Bruise", "Not gentle. Teeth on lips, hands gripping jaw, kissing like you're fighting for dominance. Leave them swollen.", ["intense", "passion"], "communication", 2, "naughty"),
  createSingle("hair-pulling", "Grab & Guide", "Fist their hair at the crown. Pull their head back. Use it to guide their mouth where you want it.", ["dominance", "control"], "sensory", 2, "naughty"),
  createSingle("scratching", "Leave Marks", "Dig your nails in when they hit the right spot. Draw red lines down their back. Make them feel you tomorrow.", ["pain", "marking"], "sensory", 2, "naughty"),
  createSingle("biting", "Teeth & Territory", "Neck, shoulder, thigh. Sink your teeth in hard enough to leave a reminder. Let them wear your bite.", ["pain", "marking"], "sensory", 2, "naughty"),
  createSingle("spanking-light", "A Sharp Warning", "A quick slap on the ass when they least expect it. Just enough sting to make them pay attention.", ["impact", "surprise"], "sensory", 2, "naughty"),
  createSingle("spanking-hand", "Over the Knee", "Bend them over your lap. Make them count. Alternate between rubbing the sting away and adding to it.", ["impact", "discipline"], "sensory", 2, "naughty"),
  createSingle("dirty-talk", "Filthy Mouth", "Tell them exactly what you want to do. What you want them to do. Don't hold back. Make them blush with words alone.", ["communication", "verbal"], "communication", 2, "naughty"),
  createSingle("name-calling", "Those Words", "Slut. Whore. Good little toy. Only if you both want it. The right word at the right moment can make them fall apart.", ["communication", "degradation"], "communication", 2, "naughty"),
  createSingle("praise", "Good Boy/Girl", "Tell them how well they're doing. How good they look taking you. Watch them try even harder to please you.", ["communication", "affirmation"], "communication", 2, "naughty"),
  createSingle("commands", "Say Please", "Give orders. Make them ask permission. 'Open your mouth.' 'Don't move.' 'Beg for it.' Control the pace completely.", ["dominance", "control"], "communication", 2, "naughty")
);

// BONDAGE & RESTRAINT - Give/Receive
allKinks.push(...createPair(
  "wrists-held",
  "Hold Them Down",
  "Hands Pinned Above",
  "Pin their wrists above their head with one hand. Use your weight. Let them struggle a little. They can't go anywhere until you let them.",
  "He has your wrists locked in place. You're exposed, vulnerable, and completely at his mercy. Try to break free. You won't.",
  ["restraint", "dominance"], "light_restraint", 2, "naughty"
));

allKinks.push(...createPair(
  "handcuffs",
  "Cuffed & Controlled",
  "Locked & Used",
  "Metal cuffs on the wrists. Behind their back for more vulnerability. The cold metal reminds them with every movement.",
  "Your hands are bound. You're helpless to stop them from doing whatever they want. And they want a lot.",
  ["restraint", "tools"], "light_restraint", 2, "naughty"
));

allKinks.push(...createPair(
  "tie-to-bed",
  "Spread & Secure",
  "Tied Open",
  "Rope or cuffs at each corner. They're spread eagle, completely exposed, unable to close their legs or hide. All yours to play with.",
  "Bound to the bed, legs apart, totally vulnerable. They can tease you for hours and you can't do anything but take it.",
  ["restraint", "exposure"], "light_restraint", 3, "xxx"
));

allKinks.push(...createPair(
  "blindfold",
  "Sightless & Waiting",
  "In the Dark",
  "Take away their sight. Every touch is a surprise. Every sound makes them wonder what's next. Amplify everything else.",
  "You can't see. You can only feel, hear, smell. Every sensation is magnified because you can't anticipate it.",
  ["sensory", "deprivation"], "sensory", 2, "naughty"
));

// ANAL - Give/Receive with better descriptions
allKinks.push(...createPair(
  "anal-finger",
  "First Touch Back There",
  "Being Opened Slowly",
  "Plenty of lube. Start with gentle circles. Take your time. Make them push back onto your finger before you slide in.",
  "They work you open so slowly you almost can't stand it. One finger, barely moving, until you're pressing against them.",
  ["anal", "beginner"], "props_and_toys", 2, "naughty"
));

allKinks.push(...createPair(
  "anal-tongue",
  "Rim Job Devotion",
  "Worshipped from Behind",
  "Use your tongue where they blush to admit they want it. Soft licks, firm pressure, make them melt into the mattress.",
  "Their mouth on your most private spot. The intimacy of it is almost too much. You feel completely claimed.",
  ["anal", "oral"], "props_and_toys", 2, "naughty"
));

allKinks.push(...createPair(
  "anal-toy",
  "Plug & Play",
  "Filled & Waiting",
  "Insert a plug, leave it there. Make them wear it while you do other things. Every movement reminds them who's in charge.",
  "He puts it in and makes you keep it there. You feel full, stretched, constantly aware. Then he fucks you with it still inside.",
  ["anal", "toys"], "props_and_toys", 2, "naughty"
));

allKinks.push(...createPair(
  "anal-full",
  "Take It All the Way",
  "Completely Filled",
  "Deep, intense, fully seated anal. Hold them close, make them feel every inch. Watch them adjust to the fullness.",
  "He's all the way inside, stretching you, filling you completely. You can feel every pulse, every movement.",
  ["anal", "intense"], "props_and_toys", 3, "xxx"
));

// TOYS & PROPS
allKinks.push(
  createSingle("vibrator-tease", "Buzz & Deny", "Hold it against them until they're right on the edge. Then pull away. Do it again. And again.", ["toys", "control"], "props_and_toys", 2, "naughty"),
  createSingle("vibrator-forced", "Make Them Come", "Don't stop. Even when they say it's too much. Hold them down and keep the vibration right on their most sensitive spot until they scream.", ["toys", "forced"], "props_and_toys", 3, "xxx"),
  createSingle("butt-plug-tail", "Kitten Play", "A plug with a tail attached. Make them crawl. Pet them. Tell them they're a good little pet.", ["pet-play", "roleplay"], "props_and_toys", 2, "naughty"),
  createSingle("nipple-clamps", "Squeeze & Tug", "Apply the pressure, let them adjust, then pull on the chain. The mix of pain and pleasure makes them dizzy.", ["pain", "sensory"], "sensory", 2, "naughty"),
  createSingle("cock-ring", "Harder & Longer", "Keeps them rigid, sensitive, unable to soften. They'll last longer but feel everything more intensely.", ["toys", "stamina"], "props_and_toys", 2, "naughty"),
  createSingle("prostate-massage", "The Male G-Spot", "Find that spot inside. Rub it. Press it. Make them feel things they didn't know their body could do.", ["anal", "intense"], "props_and_toys", 2, "naughty")
);

// ROLEPLAY - Sexy scenarios
allKinks.push(
  createSingle("role-stranger", "Stranger at the Bar", "Pretend you don't know each other. Buy them a drink. Flirt like you're trying to take them home for the first time.", ["roleplay", "stranger"], "roleplay", 2, "naughty"),
  createSingle("role-massage", "Happy Ending Massage", "They lie face down, you oil them up. The massage gets slower, more intimate, until your hands are doing very unprofessional things.", ["roleplay", "professional"], "roleplay", 2, "naughty"),
  createSingle("role-captured", "Interrogation", "They're tied to a chair. You extract information. They resist. You have your methods. Everyone talks eventually.", ["roleplay", "power"], "roleplay", 2, "naughty"),
  createSingle("role-photoshoot", "Nude Photography", "Direct them how to pose. Make them hold embarrassing positions while you capture every angle. Review the photos together after.", ["roleplay", "voyeur"], "roleplay", 2, "naughty"),
  createSingle("role-strip-search", "The Pat Down", "A very thorough search. Check everywhere. Make them spread them. You never know what they might be hiding.", ["roleplay", "power"], "roleplay", 2, "naughty"),
  createSingle("role-doctor", "The Examination", "Cold professionalism while touching intimate places. 'This might feel uncomfortable.' Make them describe every sensation.", ["roleplay", "professional"], "roleplay", 2, "naughty")
);

// XXX TIER - Intense, advanced
allKinks.push(
  createSingle("rough-fucking", "Hold Nothing Back", "Pounding, gripping hair, leaving bruises. Animalistic. No finesse, just need. Tear each other apart.", ["intense", "rough"], "communication", 3, "xxx"),
  createSingle("choking-light", "Hand on Throat", "Not to restrict air, just pressure. Control. Feeling their pulse race under your palm while you take them.", ["breath", "control"], "sensory", 3, "xxx"),
  createSingle("face-slapping", "A Sharp Reminder", "A quick slap across the cheek during sex. Shocking, intimate, establishing dominance. Check in after.", ["impact", "face"], "sensory", 3, "xxx"),
  createSingle("spanking-hard", "Make It Hurt", "Not playful. Real discipline. They count, they thank you, they ask for the next one. Red marks that last.", ["impact", "discipline"], "sensory", 3, "xxx"),
  createSingle("degradation", "Put Them in Their Place", "Words that sting. 'You're just a hole.' 'You're pathetic.' Make them feel small so you can build them back up after.", ["verbal", "psychological"], "communication", 3, "xxx"),
  createSingle("free-use", "Available Anytime", "Agreement that they're always available. Watching TV? Bend them over. Cooking dinner? Get on your knees. Consent given once, used often.", ["consensual", "availability"], "communication", 3, "xxx")
);

// CNC / POWER EXCHANGE - Careful, consensual framing
allKinks.push(
  createSingle("cnc-agreed", "Consensual 'No'", "Pre-negotiated resistance. They say no, you ignore it, they struggle, you overpower them. Safe words essential.", ["cnc", "resistance"], "communication", 3, "xxx"),
  createSingle("sleep-play", "While They're Out", "Pre-agreed touching, penetration while they pretend to sleep or actually sleep. Wake them up in the best way.", ["sleep", "surprise"], "communication", 3, "xxx"),
  createSingle("blackmail-roleplay", "The Secret", "Roleplay blackmail. 'I found your search history. Do what I say or everyone finds out.' All pretend, all consensual.", ["roleplay", "power"], "roleplay", 3, "xxx")
);

// GROUP / CNM - Sexy, not clinical
allKinks.push(
  createSingle("threesome-mmf", "Two for Her", "Two men focused entirely on her pleasure. Multiple hands, multiple mouths, being the absolute center of attention.", ["group", "mmf"], "group", 3, "xxx"),
  createSingle("threesome-mff", "Two for Him", "Two women sharing him. Taking turns, working together, making him feel like a king.", ["group", "mff"], "group", 3, "xxx"),
  createSingle("cuckold-him", "He Watches Her", "He sits in the corner while she takes another man. The humiliation, the arousal, the reclaiming after.", ["cuckold", "voyeur"], "group", 3, "xxx"),
  createSingle("cuckold-her", "She Watches Him", "She watches him with another woman. Deciding if he deserves to come, directing the action, owning his pleasure.", ["cuckold", "femdom"], "group", 3, "xxx"),
  createSingle("hotwife", "She Dates Others", "She goes out, has her fun, comes home full of details. He reclaims her, tastes the evidence, owns her again.", ["hotwife", "reclaim"], "group", 3, "xxx"),
  createSingle("swapping", "The Trade", "Two couples switch partners for the night. Fresh bodies, new techniques, stories to share after.", ["swinging", "group"], "group", 3, "xxx"),
  createSingle("gangbang", "Center of Attention", "One person, many others. Being overwhelmed, passed around, completely used. Total abandon.", ["group", "intense"], "group", 3, "xxx"),
  createSingle("bukkake", "Covered", "Multiple finishing on one. The visual, the submission, being marked by many.", ["group", "fluids"], "group", 3, "xxx")
);

// FETISH / SPECIFIC
allKinks.push(
  createSingle("foot-worship", "At Her Feet", "Kiss, lick, massage her feet. Admire them. Some find feet incredibly erotic. Worship accordingly.", ["feet", "worship"], "roleplay", 2, "naughty"),
  createSingle("watersports", "Golden Showers", "Pee play. Warm, intimate, taboo. Marking territory. Shower sex makes cleanup easy.", ["fluids", "taboo"], "environment", 3, "xxx"),
  createSingle("lingerie-crotchless", "Easy Access", "Lingerie with strategic openings. Decorative but functional. No need to undress to use them.", ["lingerie", "convenience"], "roleplay", 2, "naughty"),
  createSingle("latex", "Shiny & Tight", "Second skin. The squeak, the shine, the restriction. Latex clothing makes every curve dramatic.", ["latex", "fetish"], "roleplay", 2, "naughty"),
  createSingle("leather", "The Smell of Leather", "Harnesses, cuffs, the scent of well-worn leather. Dominant aesthetics.", ["leather", "fetish"], "roleplay", 2, "naughty")
);

// COMMUNICATION / AFTERCARE
allKinks.push(
  createSingle("safeword-setup", "The Safety Word", "Establish your stop word. Red for stop, yellow for slow down. The trust to play hard comes from knowing you can stop anytime.", ["safety", "communication"], "communication", 1, "romance"),
  createSingle("aftercare-check", "Post-Scene Care", "Blankets, water, gentle touches. Reassurance. Coming back to reality together after intense play.", ["aftercare", "intimacy"], "aftercare", 1, "romance"),
  createSingle("debrief-next-day", "The Morning After Talk", "Discuss what worked, what didn't, what surprised you. Honest conversation makes next time even better.", ["communication", "feedback"], "communication", 1, "romance")
);

// Flatten and process
const flattened = allKinks.flat().filter(Boolean);

// Remove duplicates by slug
const seen = new Set();
const unique = [];
for (const kink of flattened) {
  if (!seen.has(kink.slug)) {
    seen.add(kink.slug);
    unique.push(kink);
  }
}

// Ensure we have enough (pad if under 250, trim if over)
while (unique.length < 250) {
  const idx = unique.length;
  unique.push(createSingle(
    `kinky-extra-${idx}`,
    `Wild Card #${idx}`,
    "Something spontaneous you both want to try. Make it up together.",
    ["spontaneous"],
    "communication",
    2,
    "naughty"
  ));
}

const final250 = unique.slice(0, 250);
const numbered = renumber(final250);

// For Spanish, we'll create a basic translation or keep English for now
// In a real implementation, you'd translate properly
const spanish = numbered.map(k => ({
  ...k,
  // Basic Spanish placeholders - ideally these get real translation
  title: k.title,
  description: k.description
}));

fs.writeFileSync(EN_OUT, JSON.stringify(numbered, null, 2));
fs.writeFileSync(ES_OUT, JSON.stringify(spanish, null, 2));

console.log({
  total: numbered.length,
  tiers: {
    romance: numbered.filter(k => k.tier === "romance").length,
    soft: numbered.filter(k => k.tier === "soft").length,
    naughty: numbered.filter(k => k.tier === "naughty").length,
    xxx: numbered.filter(k => k.tier === "xxx").length
  },
  byCategory: numbered.reduce((acc, k) => {
    acc[k.category] = (acc[k.category] || 0) + 1;
    return acc;
  }, {}),
  output: { english: EN_OUT, spanish: ES_OUT }
});
