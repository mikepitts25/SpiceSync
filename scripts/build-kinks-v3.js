// scripts/build-kinks-v3.js
// FIXED give/receive matching logic
// Give = I want to do/act on partner (I'm the giver)
// Receive = I want partner to do/act on me (I'm the receiver)
// These are complementary desires that match

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
    tier: ["romance","soft","naughty","xxx"].includes(it.tier) ? it.tier : "soft",
  };
}

function renumber(items) {
  return items.map((it, idx) => ({ ...it, id: String(idx).padStart(4, "0") }));
}

// Create properly matched pairs
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

// ============ ROMANCE TIER ============
all.push(
  single("aftercare-bath", "Recovery Soak", "Slip into warm water together, limbs tangled, whispering about what just happened. The best kind of debrief.", ["aftercare"], "aftercare", 1, "romance"),
  single("slow-morning-kisses", "Lazy Morning Kisses", "No alarms, no rush. Just soft lips and wandering hands under the sheets.", ["intimacy"], "communication", 1, "romance"),
  single("grazing-hands", "Accidental Touches", "Let your fingers 'accidentally' brush their thigh, their waist, the small of their back. See how long before they catch your drift.", ["tease"], "communication", 1, "romance"),
  single("feeding-each-other", "Feeding Each Other", "Forkfuls of dessert offered with a smirk. Fingers trailing lips after. Playing with your food has never been this adult.", ["romance"], "environment", 1, "romance"),
  single("bubble-bath", "Naked Bath Time", "Get in together. Let them lean back against your chest. The bubbles are just an excuse to get close.", ["intimacy"], "environment", 1, "romance"),
  single("shared-shower", "Steam Together", "Wash their hair. Let your hands wander. The hot water isn't the only thing making you breathless.", ["intimacy"], "environment", 1, "romance"),
  single("cuddle-naked", "Skin on Skin", "Nothing between you. Just warmth, heartbeat, and the smell of each other. Sometimes this is all you need.", ["intimacy"], "communication", 1, "romance"),
  single("whispered-secrets", "Bedroom Confessions", "In the dark, tell them things you've never said aloud. Watch trust turn into desire.", ["communication"], "communication", 1, "romance"),
  single("kitchen-dance", "Kitchen Slow Dance", "Press close while something simmers on the stove. Sway to no music. Get distracted.", ["romance"], "environment", 1, "romance"),
  single("reading-aloud", "Bedtime Stories", "Read something sexy aloud while they listen, touching themselves or you. Their voice when they can't take anymore? Worth it.", ["media"], "environment", 1, "soft"),
  single("safeword-setup", "The Safety Word", "Establish your stop word. Red for stop, yellow for slow down. The trust to play hard comes from knowing you can stop anytime.", ["safety"], "communication", 1, "romance")
);

// ============ MASSAGE PAIRS ============
all.push(...createPair(
  "massage-give",
  "Oil Them Up",
  "Be Oiled Up",
  "Warm oil between your palms. Take your time finding every knot, every sensitive spot. Make them melt under your hands.",
  "Lie still while they work warm oil into your skin. Every touch deliberate, every muscle surrendering. You're clay in their hands.",
  ["touch", "sensory"], "sensory", 1, "romance"
));

// ============ STRIP/TEASE PAIRS ============
all.push(...createPair(
  "strip-tease",
  "Put On A Show",
  "Watch The Show",
  "You are the main event. Take it slow. Let them watch but not touch until you say so. Make them ache.",
  "They perform just for you. Sit back, enjoy, and try not to reach out until the finale. They're putting on a show.",
  ["performance", "tease"], "roleplay", 2, "soft"
));

all.push(...createPair(
  "lap-dance",
  "Give A Lap Dance",
  "Receive A Lap Dance",
  "Straddle their lap, move slow, keep eye contact. Make them feel like the only person in the room. Grind until they're hard.",
  "They climb on top and take control of the rhythm. Your hands can wander... if they allow it. Let them work you up.",
  ["performance", "tease"], "roleplay", 2, "soft"
));

// ============ ORAL PAIRS ============
all.push(...createPair(
  "oral-tease",
  "Tease Them With Your Mouth",
  "Be Teased By Their Mouth",
  "Kiss everywhere except where they're aching for you. Their inner thigh, their hip, just barely grazing. Make them squirm before you give in.",
  "They torment you with almost-there kisses. So close, then away again. By the time they finally taste you, you're already halfway there.",
  ["oral", "tease"], "communication", 2, "soft"
));

all.push(...createPair(
  "oral-deep",
  "Take Them Deep In Your Mouth",
  "Be Taken Deep",
  "Show them how much you can handle. Use your tongue, your throat, your hands. Make a mess of it. Make them see stars.",
  "They take you deep, look up at you while they do it, and you feel like you're the only thing that matters in the world.",
  ["oral", "intense"], "communication", 2, "naughty"
));

all.push(...createPair(
  "oral-face-sitting",
  "Be Their Throne",
  "Ride Their Face",
  "Lie back and let them take control. Their thighs around your head, their weight on your tongue. Just breathe and enjoy the view while they use you.",
  "Straddle them, hold the headboard, grind down exactly how you need it. They're just the instrument. Play your song until you can't anymore.",
  ["oral", "control"], "communication", 2, "naughty"
));

all.push(...createPair(
  "oral-public",
  "Get Them Off In Public",
  "Be Taken In Public",
  "A dark corner, a parked car, a bathroom with a lock. Get them off fast and quiet. The adrenaline of almost getting caught makes it sweeter.",
  "Their mouth on you where someone could discover you. You have to be silent but you want to scream. Hold their hair and try not to moan.",
  ["oral", "public", "risky"], "environment", 2, "naughty"
));

all.push(...createPair(
  "oral-from-behind",
  "Taste Them From Behind",
  "Be Tasted From Behind",
  "Have them on all fours. Kiss, lick, worship from behind while they can't see you. Every unexpected touch makes them gasp.",
  "On your hands and knees, exposed and waiting. Their mouth finds you from behind, unexpected and intense. You can't see them coming.",
  ["oral", "vulnerability"], "communication", 2, "naughty"
));

all.push(...createPair(
  "oral-edge-control",
  "Bring Them To The Edge",
  "Be Brought To The Edge",
  "Get them right to the brink with your mouth, then back off. Again and again. Decide when they finally get to fall.",
  "They have you trembling, so close, then they pull away. Over and over until you're begging. They own your release completely.",
  ["oral", "control", "edging"], "communication", 2, "naughty"
));

// ============ IMPACT PAIRS ============
all.push(...createPair(
  "hair-pulling",
  "Pull Their Hair",
  "Have Your Hair Pulled",
  "Fist their hair at the crown. Pull their head back to expose their throat. Use it to guide their mouth exactly where you want it.",
  "He takes a handful of your hair and pulls your head back. You're exposed, controlled, and completely at his mercy. Resistance is futile.",
  ["impact", "dominance"], "sensory", 2, "naughty"
));

all.push(...createPair(
  "spanking-hand",
  "Spank Them",
  "Be Spanked",
  "Pull them across your lap. Make them count each one. Alternate between rubbing the sting away and adding to it until they're squirming.",
  "You're draped over their lap, vulnerable. The smacks come hard, then soft, keeping you off balance. You count and thank them for each one.",
  ["impact", "discipline"], "sensory", 2, "naughty"
));

all.push(...createPair(
  "spanking-paddle",
  "Paddle Their Ass",
  "Take The Paddle",
  "A wooden paddle for more sting. Watch their skin pink up. Listen to the sound it makes. Make them ask for the next one.",
  "The wood hits different - sharp, loud, unforgiving. You feel each impact echo through you. The marks last longer than a hand.",
  ["impact", "tools"], "sensory", 2, "naughty"
));

// ============ BONDAGE PAIRS ============
all.push(...createPair(
  "pin-wrists",
  "Pin Their Wrists",
  "Have Your Wrists Pinned",
  "Trap their wrists above their head with one hand. Use your weight to keep them there. Let them struggle. They can't go anywhere until you let them.",
  "Your wrists are locked in place above you. His weight presses you into the bed. You try to break free but you're completely at his mercy.",
  ["restraint", "dominance"], "light_restraint", 2, "naughty"
));

all.push(...createPair(
  "handcuffs",
  "Cuff Them",
  "Be Cuffed",
  "Metal cuffs on their wrists. Behind their back for more vulnerability. The cold metal reminds them who's in charge with every movement.",
  "Cold metal on your wrists. Your hands are useless behind you. You're helpless to stop them from doing whatever they want. And they want a lot.",
  ["restraint", "tools"], "light_restraint", 2, "naughty"
));

all.push(...createPair(
  "tie-spread",
  "Tie Them Spread Open",
  "Be Tied Spread Open",
  "Rope or cuffs at each corner. They're spread eagle, completely exposed, unable to close their legs or hide anything. All yours to play with for hours.",
  "Bound to the bed at wrists and ankles. Legs spread wide, totally vulnerable. They can tease you for hours and you can't do anything but take it.",
  ["restraint", "exposure"], "light_restraint", 3, "xxx"
));

all.push(...createPair(
  "blindfold",
  "Blindfold Them",
  "Be Blindfolded",
  "Take away their sight. Every touch becomes a surprise. Every sound makes them wonder what's next. Amplify every other sensation.",
  "You can't see. You can only feel, hear, smell. Every touch is magnified because you can't anticipate it. The waiting is torture.",
  ["sensory", "deprivation"], "sensory", 2, "naughty"
));

all.push(...createPair(
  "leash-collar",
  "Collar & Lead Them",
  "Wear Their Collar",
  "Put a collar around their neck. Clip a leash on. Lead them where you want them. The symbolism alone is intoxicating.",
  "The collar clicks around your neck. When they tug the leash, you follow. Marked as theirs. Owned. It's surprisingly freeing.",
  ["restraint", "symbolism"], "light_restraint", 2, "naughty"
));

// ============ ANAL PAIRS ============
all.push(...createPair(
  "anal-finger",
  "Finger Them There",
  "Be Fingered",
  "Plenty of lube. Start with gentle circles around the rim. Take your time. Make them push back onto your finger before you finally slide in.",
  "They work you open so slowly you almost can't stand it. One finger, barely moving, teasing until you're pressing back against them, desperate for more.",
  ["anal", "beginner"], "props_and_toys", 2, "naughty"
));

all.push(...createPair(
  "anal-tongue",
  "Use Your Tongue There",
  "Feel Their Tongue There",
  "Use your tongue where they blush to admit they want it. Soft licks, firm pressure, make them melt into the mattress from the intimacy.",
  "Their mouth on your most private spot. The vulnerability of it is overwhelming. You feel completely claimed and adored.",
  ["anal", "oral"], "props_and_toys", 2, "naughty"
));

all.push(...createPair(
  "anal-plug",
  "Plug Them",
  "Be Plugged",
  "Insert a plug, leave it there. Make them wear it while you do other things. Every movement reminds them who's in control.",
  "He puts it in and makes you keep it there while he ignores you. You feel full, stretched, constantly aware. Then he takes you with it still inside.",
  ["anal", "toys", "control"], "props_and_toys", 2, "naughty"
));

all.push(...createPair(
  "anal-full",
  "Take Them Anally",
  "Be Taken Anally",
  "Deep, intense, fully seated. Hold them close, make them feel every inch. Watch them adjust to the overwhelming fullness.",
  "He's all the way inside, stretching you, filling you completely. You can feel every throb, every pulse. It's almost too much but you want more.",
  ["anal", "intense"], "props_and_toys", 3, "xxx"
));

all.push(...createPair(
  "pegging",
  "Fuck Them With A Strap-On",
  "Be Fucked By Their Strap-On",
  "Wear the harness. Take control. Give them the sensation of being filled, being taken. Watch them discover how good it can feel.",
  "She straps it on and takes charge. The role reversal is electric. She fucks you like she owns you, and you let her because it feels incredible.",
  ["anal", "toys", "role-reversal"], "props_and_toys", 3, "xxx"
));

// ============ TOY PAIRS ============
all.push(...createPair(
  "vibrator-tease",
  "Vibrate Them To The Edge",
  "Be Vibrated To The Edge",
  "Hold it against them until they're right on the edge. Then pull away. Do it again. And again. Decide when they finally break.",
  "The buzz against your most sensitive spot, building, building, then gone. Over and over until you're begging. They control your release completely.",
  ["toys", "control"], "props_and_toys", 2, "naughty"
));

all.push(...createPair(
  "vibrator-forced",
  "Force Them Over The Edge",
  "Be Forced Over The Edge",
  "Don't stop. Even when they say it's too much. Hold them down and keep the vibration right on their most sensitive spot until they scream and shake.",
  "They hold you down and don't stop even when you beg. It's too intense, too much, and then you're coming hard with no control, again and again.",
  ["toys", "forced"], "props_and_toys", 3, "xxx"
));

all.push(...createPair(
  "nipple-clamps",
  "Clamp Their Nipples",
  "Have Your Nipples Clamped",
  "Apply the pressure, let them adjust to the pinch, then tug on the chain. The mix of pain and pleasure makes them dizzy.",
  "The bite of the clamp, then the rush when they flick it. Pain and pleasure so mixed up you can't tell them apart. You're leaking just from this.",
  ["pain", "sensory"], "sensory", 2, "naughty"
));

// ============ SINGLE CARDS - NAUGHTY ============
all.push(
  single("rough-kissing", "Bite & Bruise", "Not gentle. Teeth on lips, hands gripping jaw, kissing like you're fighting for dominance. Leave them swollen.", ["intense"], "communication", 2, "naughty"),
  single("scratching", "Leave Marks", "Dig your nails in when they hit the right spot. Draw red lines down their back. Make them feel you tomorrow.", ["pain"], "sensory", 2, "naughty"),
  single("biting", "Teeth & Territory", "Neck, shoulder, thigh. Sink your teeth in hard enough to leave a reminder. Let them wear your bite.", ["pain"], "sensory", 2, "naughty"),
  single("spanking-warning", "A Sharp Warning", "A quick slap on the ass when they least expect it. Just enough sting to make them pay attention.", ["impact"], "sensory", 2, "naughty"),
  single("dirty-talk", "Filthy Mouth", "Tell them exactly what you want to do. What you want them to do. Don't hold back. Make them blush with words alone.", ["communication"], "communication", 2, "naughty"),
  single("name-calling", "Those Words", "Slut. Whore. Good little toy. Only if you both want it. The right word at the right moment can make them fall apart.", ["communication"], "communication", 2, "naughty"),
  single("praise", "Good Boy/Girl", "Tell them how well they're doing. How good they look taking you. Watch them try even harder to please you.", ["communication"], "communication", 2, "naughty"),
  single("commands", "Say Please", "Give orders. Make them ask permission. 'Open your mouth.' 'Don't move.' 'Beg for it.' Control the pace completely.", ["dominance"], "communication", 2, "naughty")
);

// ============ ROLEPLAY ============
all.push(
  single("role-stranger", "Stranger At The Bar", "Pretend you don't know each other. Buy them a drink. Flirt like you're trying to take them home for the first time.", ["roleplay"], "roleplay", 2, "naughty"),
  single("role-massage", "Happy Ending", "They lie face down, you oil them up. The massage gets slower, more intimate, until your hands are doing very unprofessional things.", ["roleplay"], "roleplay", 2, "naughty"),
  single("role-captured", "Interrogation", "They're tied to a chair. You extract information. They resist. You have your methods. Everyone talks eventually.", ["roleplay"], "roleplay", 2, "naughty"),
  single("role-photoshoot", "Nude Photography", "Direct them how to pose. Make them hold embarrassing positions while you capture every angle. Review the photos together after.", ["roleplay"], "roleplay", 2, "naughty"),
  single("role-strip-search", "The Pat Down", "A very thorough search. Check everywhere. Make them spread wide. You never know what they might be hiding.", ["roleplay"], "roleplay", 2, "naughty"),
  single("role-doctor", "The Examination", "Cold professionalism while touching intimate places. 'This might feel uncomfortable.' Make them describe every sensation.", ["roleplay"], "roleplay", 2, "naughty"),
  single("role-boss", "Performance Review", "Late night in the office. The power dynamic is clear. They're eager to please. You're eager to be pleased.", ["roleplay"], "roleplay", 2, "naughty")
);

// ============ XXX TIER ============
all.push(
  single("rough-fucking", "Hold Nothing Back", "Pounding, gripping hair, leaving bruises. Animalistic. No finesse, just need. Tear each other apart.", ["intense"], "communication", 3, "xxx"),
  single("choking", "Hand On Throat", "Not to restrict air, just pressure. Control. Feeling their pulse race under your palm while you take them.", ["breath"], "sensory", 3, "xxx"),
  single("face-slapping", "A Sharp Reminder", "A quick slap across the cheek during sex. Shocking, intimate, establishing dominance. Check in after.", ["impact"], "sensory", 3, "xxx"),
  single("spanking-hard", "Make It Hurt", "Not playful. Real discipline. They count, they thank you, they ask for the next one. Red marks that last for days.", ["impact"], "sensory", 3, "xxx"),
  single("degradation", "Put Them In Their Place", "Words that sting. 'You're just a hole.' 'You're pathetic.' Make them feel small so you can build them back up after.", ["verbal"], "communication", 3, "xxx"),
  single("free-use", "Available Anytime", "Agreement that they're always available. Watching TV? Bend them over. Cooking dinner? Get on your knees. Consent given once, used often.", ["consensual"], "communication", 3, "xxx"),
  single("cnc", "Consensual 'No'", "Pre-negotiated resistance. They say no, you ignore it, they struggle, you overpower them. Safe words essential.", ["cnc"], "communication", 3, "xxx"),
  single("sleep-play", "While They're Out", "Pre-agreed touching, penetration while they pretend to sleep or actually sleep. Wake them up in the best way.", ["sleep"], "communication", 3, "xxx"),
  single("blackmail-roleplay", "The Secret", "Roleplay blackmail. 'I found your search history. Do what I say or everyone finds out.' All pretend, all consensual.", ["roleplay"], "roleplay", 3, "xxx")
);

// ============ GROUP ============
all.push(
  single("threesome-mmf", "Two For Her", "Two men focused entirely on her pleasure. Multiple hands, multiple mouths, being the absolute center of attention.", ["group"], "group", 3, "xxx"),
  single("threesome-mff", "Two For Him", "Two women sharing him. Taking turns, working together, making him feel like a king.", ["group"], "group", 3, "xxx"),
  single("cuckold-him", "He Watches Her", "He sits in the corner while she takes another man. The humiliation, the arousal, the reclaiming after.", ["cuckold"], "group", 3, "xxx"),
  single("cuckold-her", "She Watches Him", "She watches him with another woman. Deciding if he deserves to come, directing the action, owning his pleasure.", ["cuckold"], "group", 3, "xxx"),
  single("hotwife", "She Dates Others", "She goes out, has her fun, comes home full of details. He reclaims her, tastes the evidence, owns her again.", ["hotwife"], "group", 3, "xxx"),
  single("swapping", "The Trade", "Two couples switch partners for the night. Fresh bodies, new techniques, stories to share after.", ["swinging"], "group", 3, "xxx"),
  single("gangbang", "Center Of Attention", "One person, many others. Being overwhelmed, passed around, completely used. Total abandon.", ["group"], "group", 3, "xxx")
);

// ============ FETISH ============
all.push(
  single("foot-worship", "At Her Feet", "Kiss, lick, massage her feet. Admire them. Some find feet incredibly erotic. Worship accordingly.", ["feet"], "roleplay", 2, "naughty"),
  single("watersports", "Golden Showers", "Pee play. Warm, intimate, taboo. Marking territory. Shower sex makes cleanup easy.", ["fluids"], "environment", 3, "xxx"),
  single("lingerie-crotchless", "Easy Access", "Lingerie with strategic openings. Decorative but functional. No need to undress to use them.", ["lingerie"], "roleplay", 2, "naughty"),
  single("latex", "Shiny & Tight", "Second skin. The squeak, the shine, the restriction. Latex clothing makes every curve dramatic.", ["latex"], "roleplay", 2, "naughty"),
  single("leather", "The Smell Of Leather", "Harnesses, cuffs, the scent of well-worn leather. Dominant aesthetics.", ["leather"], "roleplay", 2, "naughty")
);

// ============ SOFT TIER EXTRAS ============
all.push(
  single("silk-scarf", "Silk Seduction", "Blindfold them with something soft. Let the fabric trail over their skin before you even touch them.", ["sensory"], "sensory", 1, "soft"),
  single("ice-cube", "Ice Play", "Trace a cold cube down their spine, around their nipples, between their thighs. Watch them shiver for you.", ["sensory"], "sensory", 1, "soft"),
  single("feather-touch", "Tickle & Tease", "Light as air. Everywhere except where they want it most. Make them beg for contact.", ["sensory"], "sensory", 1, "soft"),
  single("ear-nibbling", "Whispers & Bites", "Breathe against their ear. Nibble the lobe. Tell them exactly what you're going to do later.", ["sensory"], "communication", 1, "soft"),
  single("neck-kissing", "Mark Your Territory", "Suck, bite, kiss. Leave a reminder that lasts for days. Let everyone know they're taken.", ["sensory"], "sensory", 1, "soft"),
  single("thigh-grinding", "Through The Fabric", "Dry humping isn't just for teenagers. The friction, the buildup, the clothes staying on until you can't stand it.", ["tease"], "communication", 2, "soft"),
  single("phone-sex", "Voice Alone", "Hear them touch themselves. Describe what you'd do if you were there. Sometimes words hit harder than hands.", ["communication"], "communication", 2, "soft"),
  single("sexting", "Digital Foreplay", "Build anticipation all day. A photo here, a promise there. By nightfall, they'll be desperate.", ["communication"], "communication", 1, "soft"),
  single("mutual-masturbation", "Show & Tell", "Touch yourselves while watching each other. See what they like. Learn their rhythm. It's education and pornography combined.", ["voyeur"], "communication", 2, "soft"),
  single("sixty-nine", "Head To Toe", "Give and receive at the same time. The coordination is tricky but the payoff? Mutual bliss.", ["oral"], "communication", 2, "soft")
);

// ============ AFTERCARE ============
all.push(
  single("aftercare-check", "Post-Scene Care", "Blankets, water, gentle touches. Reassurance. Coming back to reality together after intense play.", ["aftercare"], "aftercare", 1, "romance"),
  single("debrief-next-day", "The Morning After Talk", "Discuss what worked, what didn't, what surprised you. Honest conversation makes next time even better.", ["communication"], "communication", 1, "romance")
);

// Flatten and remove duplicates
const flattened = all.flat().filter(Boolean);
const seen = new Set();
const unique = [];
for (const k of flattened) {
  if (!seen.has(k.slug)) {
    seen.add(k.slug);
    unique.push(k);
  }
}

// Pad to 250
while (unique.length < 250) {
  const idx = unique.length;
  unique.push(single(`wild-card-${idx}`, `Wild Card #${idx}`, "Something spontaneous you both want to try. Make it up together.", ["spontaneous"], "communication", 2, "naughty"));
}

const final = unique.slice(0, 250);
const numbered = renumber(final);

// For Spanish, copy English for now
const spanish = numbered.map(k => ({...k}));

fs.writeFileSync(EN_OUT, JSON.stringify(numbered, null, 2));
fs.writeFileSync(ES_OUT, JSON.stringify(spanish, null, 2));

console.log("=== KINKS V3 GENERATED ===");
console.log({
  total: numbered.length,
  tiers: {
    romance: numbered.filter(k => k.tier === "romance").length,
    soft: numbered.filter(k => k.tier === "soft").length,
    naughty: numbered.filter(k => k.tier === "naughty").length,
    xxx: numbered.filter(k => k.tier === "xxx").length
  },
  pairs: numbered.filter(k => k.slug.includes("-give") || k.slug.includes("-receive")).length / 2,
  sampleGive: numbered.find(k => k.slug === "oral-face-sitting-give"),
  sampleReceive: numbered.find(k => k.slug === "oral-face-sitting-receive")
});
