export type Lang = "en" | "sv";

type Dict = Record<string, string>;

const en: Dict = {
  // Brand
  "brand.name": "Christmas Chaos",
  "brand.tagline": "The gift game. On steroids.",
  "brand.pitch":
    "Real gifts on the table. A phone or TV running the show. Every roll can make you rich, broke or frozen. Nobody is safe. Not even Grandma.",

  // Setup
  "setup.players.title": "Who's in?",
  "setup.players.hint": "Type a name and hit Enter. Paste a list with commas, it works.",
  "setup.players.add": "Add",
  "setup.players.placeholder": "Name…",
  "setup.players.remove": "Remove {name}",
  "setup.players.count": "{count} players",
  "setup.pile.title": "Gifts in the pile",
  "setup.pile.hint": "Tip: {suggested} gifts ({per} per player).",
  "setup.pile.auto": "Use {suggested}",
  "setup.cta.seat": "Shuffle the seats",
  "setup.error.few": "You need at least two players. Chaos needs victims.",
  "setup.error.dupes": "Two players can't share a name: {name}",
  "setup.error.pile": "The pile needs at least one gift.",
  "setup.step.players": "Players",
  "setup.step.seats": "Seats",
  "setup.step.play": "Chaos",

  // Seating
  "seating.title": "Sit like this!",
  "seating.subtitle":
    "Find your seat. Clockwise around the table. Your left and right neighbours matter, gifts travel that way.",
  "seating.shuffling": "Shuffling the seats…",
  "seating.reshuffle": "Shuffle again",
  "seating.edit": "Edit players",
  "seating.start": "Start the chaos",
  "seating.pickingStarter": "Who starts? The spotlight decides…",
  "seating.starter": "{name} starts!",
  "seating.neighbours": "left: {left} · right: {right}",
  "seating.leftArrow": "your left",
  "seating.top": "Top of the table",
  "seating.listTitle": "Who sits next to whom",

  // Top bar
  "bar.pile": "Pile",
  "bar.turn": "Turn",
  "bar.rolls": "rolls left",
  "bar.sound.on": "Sound on",
  "bar.sound.off": "Sound off",
  "bar.turbo": "Turbo",
  "bar.rules": "Rules",
  "bar.log": "Log",
  "bar.reset": "New game",
  "bar.resetConfirm": "End this game and start over?",
  "bar.seats": "Seats",
  "bar.debug": "Debug",
  "bar.lang": "Svenska",

  // Phases
  "phase.warmup": "Phase 1 · Warm-up",
  "phase.endgame": "Phase 2 · Endgame",
  "phase.ended": "Game over",
  "phase.warmup.short": "Warm-up",
  "phase.endgame.short": "Endgame",

  // Stage
  "stage.yourTurn": "{who} turn",
  "stage.rollsLeft": "{count} rolls left",
  "stage.rollsLeft.one": "Last roll!",
  "stage.roll": "Roll, {name}!",
  "stage.spinning": "Fate is deciding…",
  "stage.targeting": "Who gets hit?",
  "stage.targetingPair": "Which two?",
  "stage.ended": "Game over",
  "stage.calm": "Silent night",
  "stage.waiting": "Hit the button. Feel the fear.",
  "stage.lastAction": "What just happened",
  "stage.doIt": "Do it at the table, then the next player rolls.",
  "stage.next": "Next up: {name}",

  "board.warmup": "Warm-up deck",
  "board.endgame": "Endgame deck",
  "board.unavailable": "Not possible right now",
  "board.debugHint": "Debug: click a card to force it",

  "table.pile": "in the pile",
  "table.empty": "empty-handed",
  "table.left": "LEFT",
  "table.right": "RIGHT",
  "table.clockwise": "clockwise",
  "table.counter": "counter-clockwise",

  // Banner
  "banner.endgame.kicker": "The pile is empty",
  "banner.endgame.title": "ENDGAME",
  "banner.endgame.body":
    "Three rolls each. Gifts can be frozen, flipped, stolen and spun. Hold on to something.",
  "banner.endgame.cta": "Bring it on",

  // End
  "end.kicker": "The dust settles…",
  "end.title": "CHAOS OVER",
  "end.body": "What you hold is what you get. Open your gifts!",
  "end.award.most": "Gift hoarder",
  "end.award.none": "Left in the cold",
  "end.award.frozen": "Ice king",
  "end.gifts": "{count} gifts",
  "end.gift": "1 gift",
  "end.again": "Play again, same crew",
  "end.close": "Look at the table",

  // Rules
  "rules.title": "How it works",
  "rules.intro":
    "Put all the gifts in a pile in the middle. Everyone gets the same number of rolls. The app picks the action and the victim, you do it for real at the table.",
  "rules.warmup":
    "Phase 1 · Warm-up: {rolls} rolls each. Grab from the pile, give, steal and pass. Keeps going until the pile is empty.",
  "rules.endgame":
    "Phase 2 · Endgame: {rolls} rolls each. Freeze gifts, flip hands, swap and spin the whole table.",
  "rules.locked": "🧊 Frozen gifts are yours for good. Nobody can take, swap or rotate them.",
  "rules.seats":
    "↻ Left = clockwise, right = counter-clockwise. The seating chart shows who's who.",
  "rules.close": "Got it",

  // Log
  "log.title": "Chaos log",
  "log.empty": "Nothing has happened. Yet.",
  "log.close": "Close",

  // Actions (titles/descriptions)
  "actions.warmup.1.title": "Double Grab",
  "actions.warmup.1.desc": "Take two gifts of your choice from the pile.",
  "actions.warmup.2.title": "Grab One",
  "actions.warmup.2.desc": "Take one gift of your choice from the pile.",
  "actions.warmup.3.title": "Forced Tribute",
  "actions.warmup.3.desc": "Give one of your gifts to a random player.",
  "actions.warmup.4.title": "The Grinch Tax",
  "actions.warmup.4.desc": "Steal any gift from a random player.",
  "actions.warmup.5.title": "Tiny Toss Right",
  "actions.warmup.5.desc": "Everyone passes their smallest gift to the right.",
  "actions.warmup.6.title": "Mega Move Left",
  "actions.warmup.6.desc": "Everyone passes their biggest gift to the left.",

  "actions.endgame.1.title": "Ice Lock",
  "actions.endgame.1.desc": "Freeze one of your gifts. It's yours forever.",
  "actions.endgame.2.title": "Full Flip",
  "actions.endgame.2.desc": "Swap ALL your unfrozen gifts with a random player.",
  "actions.endgame.3.title": "Trash Trade",
  "actions.endgame.3.desc": "You and a random player swap one unwanted gift each.",
  "actions.endgame.4.title": "Joker Swap",
  "actions.endgame.4.desc": "Two random players pick one gift from each other and swap.",
  "actions.endgame.5.title": "Santa's Hand",
  "actions.endgame.5.desc": "Give away a gift. The receiver picks which one.",
  "actions.endgame.6.title": "Twist of Fate",
  "actions.endgame.6.desc": "Everyone passes ALL unfrozen gifts one seat left or right.",

  // Narratives (instructions for the table)
  "narr.warmup.1": "{actor} grabs {count} gifts from the pile. Greedy. We love it.",
  "narr.warmup.2": "{actor} picks {count} gift from the pile.",
  "narr.warmup.3": "{actor} must give a gift to {target}. Pick one. Smile.",
  "narr.warmup.4": "{actor} steals any gift from {target}. No mercy.",
  "narr.warmup.5": "Everyone: pass your SMALLEST gift to your RIGHT.",
  "narr.warmup.6": "Everyone: pass your BIGGEST gift to your LEFT.",
  "narr.endgame.1": "{actor} freezes a gift of choice. It can't be touched until the end.",
  "narr.endgame.2": "{actor} and {target} swap ALL unfrozen gifts. Total flip!",
  "narr.endgame.3": "{actor} and {target} swap one unwanted gift each. Empty-handed? Take without giving!",
  "narr.endgame.4": "{a} and {b} pick one gift from each other and swap. Empty-handed? Take without giving!",
  "narr.endgame.5": "{actor} must hand a gift to {target}, and {target} picks which one.",
  "narr.endgame.6": "EVERYONE: pass all unfrozen gifts to the {dir}!",
  "narr.calm": "Silent night. Nothing can happen for {actor} right now. Roll goes to waste.",

  // Log lines
  "log.warmup.1": "{actor} took {count} from the pile.",
  "log.warmup.2": "{actor} took {count} from the pile.",
  "log.warmup.3": "{actor} gave a gift to {target}.",
  "log.warmup.4": "{actor} stole a gift from {target}.",
  "log.warmup.5": "Everyone passed their smallest gift right.",
  "log.warmup.6": "Everyone passed their biggest gift left.",
  "log.endgame.1": "{actor} froze a gift.",
  "log.endgame.2": "{actor} flipped hands with {target}.",
  "log.endgame.3": "{actor} trash-traded with {target}.",
  "log.endgame.4": "{a} and {b} joker-swapped.",
  "log.endgame.5": "{actor} handed a gift to {target}.",
  "log.endgame.6": "Twist of fate: everything went {dir}.",
  "log.calm": "Nothing happened for {actor}.",
  "log.endgameBegins": "Endgame begins. {rolls} rolls each!",
  "log.extraRound": "Gifts left in the pile. One more round for everyone!",
  "log.start": "{name} starts. Let the chaos begin.",

  "dir.left": "left",
  "dir.right": "right",
};

const sv: Dict = {
  "brand.name": "Christmas Chaos",
  "brand.tagline": "Julklappsleken. På steroider.",
  "brand.pitch":
    "Riktiga paket på bordet. Mobilen eller TV:n styr showen. Varje kast kan göra dig rik, pank eller frusen. Ingen är säker. Inte ens mormor.",

  "setup.players.title": "Vilka är med?",
  "setup.players.hint": "Skriv ett namn och tryck Enter. Klistra in en lista med kommatecken, det funkar.",
  "setup.players.add": "Lägg till",
  "setup.players.placeholder": "Namn…",
  "setup.players.remove": "Ta bort {name}",
  "setup.players.count": "{count} spelare",
  "setup.pile.title": "Paket i högen",
  "setup.pile.hint": "Tips: {suggested} paket ({per} per spelare).",
  "setup.pile.auto": "Använd {suggested}",
  "setup.cta.seat": "Slumpa platserna",
  "setup.error.few": "Ni behöver minst två spelare. Kaos kräver offer.",
  "setup.error.dupes": "Två spelare kan inte heta samma: {name}",
  "setup.error.pile": "Högen behöver minst ett paket.",
  "setup.step.players": "Spelare",
  "setup.step.seats": "Platser",
  "setup.step.play": "Kaos",

  "seating.title": "Sätt er så här!",
  "seating.subtitle":
    "Hitta din plats. Medsols runt bordet. Grannarna till vänster och höger spelar roll, paketen vandrar åt de hållen.",
  "seating.shuffling": "Slumpar platserna…",
  "seating.reshuffle": "Slumpa om",
  "seating.edit": "Ändra spelare",
  "seating.start": "Starta kaoset",
  "seating.pickingStarter": "Vem börjar? Strålkastaren bestämmer…",
  "seating.starter": "{name} börjar!",
  "seating.neighbours": "vänster: {left} · höger: {right}",
  "seating.leftArrow": "din vänster",
  "seating.top": "Bordets topp",
  "seating.listTitle": "Vem sitter bredvid vem",

  "bar.pile": "Högen",
  "bar.turn": "Tur",
  "bar.rolls": "kast kvar",
  "bar.sound.on": "Ljud på",
  "bar.sound.off": "Ljud av",
  "bar.turbo": "Turbo",
  "bar.rules": "Regler",
  "bar.log": "Logg",
  "bar.reset": "Nytt spel",
  "bar.resetConfirm": "Avsluta spelet och börja om?",
  "bar.seats": "Platser",
  "bar.debug": "Debug",
  "bar.lang": "English",

  "phase.warmup": "Fas 1 · Uppvärmning",
  "phase.endgame": "Fas 2 · Endgame",
  "phase.ended": "Spelet är slut",
  "phase.warmup.short": "Uppvärmning",
  "phase.endgame.short": "Endgame",

  "stage.yourTurn": "{who} tur",
  "stage.rollsLeft": "{count} kast kvar",
  "stage.rollsLeft.one": "Sista kastet!",
  "stage.roll": "Kasta, {name}!",
  "stage.spinning": "Ödet bestämmer…",
  "stage.targeting": "Vem drabbas?",
  "stage.targetingPair": "Vilka två?",
  "stage.ended": "Spelet är slut",
  "stage.calm": "Stilla natt",
  "stage.waiting": "Tryck på knappen. Känn rädslan.",
  "stage.lastAction": "Det här hände nyss",
  "stage.doIt": "Gör det vid bordet, sen kastar nästa spelare.",
  "stage.next": "Näst på tur: {name}",

  "board.warmup": "Uppvärmningskort",
  "board.endgame": "Endgame-kort",
  "board.unavailable": "Går inte just nu",
  "board.debugHint": "Debug: klicka på ett kort för att tvinga fram det",

  "table.pile": "i högen",
  "table.empty": "tomhänt",
  "table.left": "VÄNSTER",
  "table.right": "HÖGER",
  "table.clockwise": "medsols",
  "table.counter": "motsols",

  "banner.endgame.kicker": "Högen är tom",
  "banner.endgame.title": "ENDGAME",
  "banner.endgame.body":
    "Tre kast var. Paket kan frysas, bytas, stjälas och snurras. Håll i er.",
  "banner.endgame.cta": "Kom igen då",

  "end.kicker": "Dammet lägger sig…",
  "end.title": "KAOSET ÄR ÖVER",
  "end.body": "Det du håller i är ditt. Öppna paketen!",
  "end.award.most": "Pakethamstraren",
  "end.award.none": "Lämnad i kylan",
  "end.award.frozen": "Iskungen",
  "end.gifts": "{count} paket",
  "end.gift": "1 paket",
  "end.again": "Kör igen, samma gäng",
  "end.close": "Kolla bordet",

  "rules.title": "Så funkar det",
  "rules.intro":
    "Lägg alla paket i en hög i mitten. Alla får lika många kast. Appen väljer handling och offer, ni gör det på riktigt vid bordet.",
  "rules.warmup":
    "Fas 1 · Uppvärmning: {rolls} kast var. Ta från högen, ge, stjäl och skicka vidare. Fortsätter tills högen är tom.",
  "rules.endgame":
    "Fas 2 · Endgame: {rolls} kast var. Frys paket, byt allt, byt ett och snurra hela bordet.",
  "rules.locked": "🧊 Frusna paket är dina för gott. Ingen kan ta, byta eller rotera dem.",
  "rules.seats":
    "↻ Vänster = medsols, höger = motsols. Platskartan visar vem som är vem.",
  "rules.close": "Fattar",

  "log.title": "Kaosloggen",
  "log.empty": "Inget har hänt. Än.",
  "log.close": "Stäng",

  "actions.warmup.1.title": "Dubbelt upp!",
  "actions.warmup.1.desc": "Ta två valfria paket från högen.",
  "actions.warmup.2.title": "Ta ett paket",
  "actions.warmup.2.desc": "Ta ett valfritt paket från högen.",
  "actions.warmup.3.title": "Tvångsgåvan",
  "actions.warmup.3.desc": "Ge ett av dina paket till en slumpad spelare.",
  "actions.warmup.4.title": "Grinchskatten",
  "actions.warmup.4.desc": "Stjäl ett valfritt paket från en slumpad spelare.",
  "actions.warmup.5.title": "Lillkastet höger",
  "actions.warmup.5.desc": "Alla skickar sitt minsta paket till höger.",
  "actions.warmup.6.title": "Megaflytt vänster",
  "actions.warmup.6.desc": "Alla skickar sitt största paket till vänster.",

  "actions.endgame.1.title": "Isblock",
  "actions.endgame.1.desc": "Frys ett av dina paket. Det är ditt för alltid.",
  "actions.endgame.2.title": "Totalflippen",
  "actions.endgame.2.desc": "Byt ALLA dina ofrusna paket med en slumpad spelare.",
  "actions.endgame.3.title": "Skräpbytet",
  "actions.endgame.3.desc": "Du och en slumpad spelare byter ett oönskat paket var.",
  "actions.endgame.4.title": "Jokerbytet",
  "actions.endgame.4.desc": "Två slumpade spelare tar ett paket från varandra och byter.",
  "actions.endgame.5.title": "Tomtens hand",
  "actions.endgame.5.desc": "Ge bort ett paket. Mottagaren väljer vilket.",
  "actions.endgame.6.title": "Ödets virvel",
  "actions.endgame.6.desc": "Alla skickar ALLA ofrusna paket ett steg vänster eller höger.",

  "narr.warmup.1": "{actor} tar {count} paket från högen. Girigt. Vi gillar det.",
  "narr.warmup.2": "{actor} väljer {count} paket från högen.",
  "narr.warmup.3": "{actor} måste ge ett paket till {target}. Välj ett. Le.",
  "narr.warmup.4": "{actor} stjäl valfritt paket från {target}. Ingen nåd.",
  "narr.warmup.5": "Alla: skicka ert MINSTA paket till HÖGER.",
  "narr.warmup.6": "Alla: skicka ert STÖRSTA paket till VÄNSTER.",
  "narr.endgame.1": "{actor} fryser valfritt paket. Det får inte röras förrän spelet är slut.",
  "narr.endgame.2": "{actor} och {target} byter ALLA ofrusna paket. Totalflipp!",
  "narr.endgame.3": "{actor} och {target} byter ett oönskat paket var. Tomhänt? Ta utan att ge!",
  "narr.endgame.4": "{a} och {b} tar ett paket från varandra och byter. Tomhänt? Ta utan att ge!",
  "narr.endgame.5": "{actor} måste ge ett paket till {target}, och {target} väljer vilket.",
  "narr.endgame.6": "ALLA: skicka alla ofrusna paket åt {dir}!",
  "narr.calm": "Stilla natt. Inget kan hända för {actor} just nu. Kastet går förlorat.",

  "log.warmup.1": "{actor} tog {count} från högen.",
  "log.warmup.2": "{actor} tog {count} från högen.",
  "log.warmup.3": "{actor} gav ett paket till {target}.",
  "log.warmup.4": "{actor} stal ett paket från {target}.",
  "log.warmup.5": "Alla skickade sitt minsta paket åt höger.",
  "log.warmup.6": "Alla skickade sitt största paket åt vänster.",
  "log.endgame.1": "{actor} frös ett paket.",
  "log.endgame.2": "{actor} totalflippade med {target}.",
  "log.endgame.3": "{actor} skräpbytte med {target}.",
  "log.endgame.4": "{a} och {b} jokerbytte.",
  "log.endgame.5": "{actor} gav ett paket till {target}.",
  "log.endgame.6": "Ödets virvel: allt åkte åt {dir}.",
  "log.calm": "Inget hände för {actor}.",
  "log.endgameBegins": "Endgame börjar. {rolls} kast var!",
  "log.extraRound": "Det finns paket kvar i högen. En runda till för alla!",
  "log.start": "{name} börjar. Låt kaoset börja.",

  "dir.left": "vänster",
  "dir.right": "höger",
};

export const messages: Record<Lang, Dict> = { en, sv };

export const detectBrowserLang = (): Lang => {
  if (typeof navigator === "undefined") return "en";
  const preferred =
    (Array.isArray(navigator.languages) ? navigator.languages[0] : navigator.language) ?? "";
  return preferred.toLowerCase().startsWith("sv") ? "sv" : "en";
};

/** Translate a key. A `dir` param ("left"/"right") is translated too. */
export const tr = (
  lang: Lang,
  key: string,
  params?: Record<string, string | number>
): string => {
  const str = messages[lang]?.[key] ?? messages.en[key] ?? key;
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k: string): string => {
    const value = params[k];
    if (value === undefined) return `{${k}}`;
    if (k === "dir") return tr(lang, `dir.${value}`);
    return String(value);
  });
};

/** "Erik" -> "Erik's" / "Eriks", "Klaus" -> "Klaus'" / "Klaus". */
export const possessive = (lang: Lang, name: string) => {
  const endsWithS = /[sxz]$/i.test(name);
  if (lang === "sv") return endsWithS ? name : `${name}s`;
  return endsWithS ? `${name}'` : `${name}'s`;
};
