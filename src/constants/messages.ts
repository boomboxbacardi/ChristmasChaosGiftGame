export type Lang = "en" | "sv";

export const messages: Record<Lang, Record<string, string>> = {
  en: {
    "ui.hero.title": "Christmas Chaos Game",
    "ui.hero.eyebrow": "Gift exchange, but chaos",
    "ui.hero.subtitle":
      "Gift exchange with dice rolls where luck drives the drama.",
    "ui.setup.title": "Players & Gifts",
    "ui.setup.hint": "",
    "ui.setup.playerPlaceholder": "Player {num}",
    "ui.setup.addPlayer": "+ Add player",
    "ui.setup.remove": "Remove",
    "ui.setup.total": "Total gifts",
    "ui.setup.randomize": "Randomize order & start",
    "ui.setup.randomizing": "Randomizing…",
    "ui.order.heading": "Turn order",
    "ui.order.subtitle": "Who gets to start first? 🎲",
    "ui.order.playerFallback": "Player {num}",
    "ui.order.start": "Start Christmas Chaos",
    "ui.order.starting": "Wrapping all the gifts…",
    "ui.banner.endgame": "Phase 2: Endgame — three rolls each!",
    "ui.banner.body": "Hold on to your gifts — the chaos just got wilder.",
    "ui.banner.cta": "Let’s go",
    "ui.status.pile": "Pile",
    "ui.status.current": "Current player",
    "ui.status.rollsPlayer": "Rolls left (player)",
    "ui.status.rollsTotal": "Rolls left (total)",
    "ui.lastRoll": "Last roll",
    "ui.lastRoll.empty": "No rolls yet.",
    "ui.rules.warmup": "Phase 1 — Warm up",
    "ui.rules.endgame": "Phase 2 — Endgame",
    "ui.rules.lockedNote":
      "Frozen gifts stay with their owner — they cannot be traded, stolen, given away, or rotated.",
    "ui.phase.ended": "Game ended",
    "ui.reset": "Reset game",
    "ui.debug.on": "Debug on",
    "ui.debug.off": "Debug off",
    "ui.debug.togglePhase": "Toggle phase (debug)",
    "ui.roll.btn": "Randomize",
    "ui.roll.randomizing": "Randomizing…",
    "ui.roll.finished": "Finished",
    "ui.lang.en": "EN",
    "ui.lang.sv": "SV",
    "ui.randomizer.headingWarmup": "ROLLING PLAYER",
    "ui.randomizer.headingEndgame": "ROLLING PLAYER",
    "ui.randomizer.hint": "Pick a random action",
    "ui.randomizer.hintDebug": "Click any action to trigger (debug)",
    "ui.players.title": "Players",
    "ui.players.legend": "🎁 unlocked · 🔒🎁 locked",
    "ui.players.empty": "No gifts",
    "ui.log.title": "Action log",
    "ui.log.subtitle": "Newest first",
    "ui.log.empty": "No actions yet.",
    "ui.modal.giveVerb": "gives a gift to",
    "ui.modal.stealVerb": "steals from",
    "ui.modal.flipVerb": "swaps all gifts with",
    "ui.modal.trashVerb": "will swap unwanted gifts with",
    "ui.modal.jokerPairVerb": "picks two players to swap gifts",
    "ui.modal.santaVerb": "gets to pick any gift from",
    "ui.modal.twistVerb": "rotates all gifts to",
    "ui.modal.gameEnded.title": "Game ended",
    "ui.modal.gameEnded.line1":
      "All gifts have been handed out and the game is over. ",
    "ui.modal.gameEnded.line2": "Hope you had fun!",
    "ui.modal.gameEnded.line3":
      'If you want to start over, choose "Reset" in the menu.',
    "ui.modal.close": "Close",
    "ui.narrative.placeholder": "Waiting for the next action…",

    // Action titles/descriptions
    "actions.warmup.1.title": "Double Grab",
    "actions.warmup.1.desc": "Take any two gifts from the pile.",
    "actions.warmup.2.title": "Single Grab",
    "actions.warmup.2.desc": "Take one gift from the pile.",
    "actions.warmup.3.title": "Forced Tribute",
    "actions.warmup.3.desc": "Give one of your gifts to a random player.",
    "actions.warmup.4.title": "The Grinch Tax",
    "actions.warmup.4.desc": "Steal any gift from a random player.",
    "actions.warmup.5.title": "Tiny Toss Right",
    "actions.warmup.5.desc": "Send your smallest unlocked gift to the right.",
    "actions.warmup.6.title": "Mega Move Left",
    "actions.warmup.6.desc": "Send your largest unlocked gift to the left.",

    "actions.endgame.1.title": "Ice Lock",
    "actions.endgame.1.desc":
      "Freeze one gift. Frozen gifts cannot be traded, stolen, given away, or rotated.",
    "actions.endgame.2.title": "Full Flip",
    "actions.endgame.2.desc":
      "Swap all unlocked gifts with a random player. Frozen gifts stay put.",
    "actions.endgame.3.title": "Trash Trade",
    "actions.endgame.3.desc":
      "Two players each pick an unwanted gift and swap with each other.",
    "actions.endgame.4.title": "Joker Swap",
    "actions.endgame.4.desc":
      "Two players each choose any gift from the other to swap.",
    "actions.endgame.5.title": "Santa's Hand",
    "actions.endgame.5.desc": "Give away a gift chosen by another player.",
    "actions.endgame.6.title": "Twist of Fate",
    "actions.endgame.6.desc":
      "Everyone rotates all gifts one step left or right.",

    // Narratives
    "narr.warmup.1": "{actor} takes {count} gift(s) from the pile 🎁",
    "narr.warmup.2": "{actor} takes {count} gift(s) from the pile 🎁",
    "narr.warmup.3": "{actor} picks a gift to give to {target} 🎁✨",
    "narr.warmup.4": "{actor} steals a gift from {target} 🔫🎁",
    "narr.warmup.5": "Everyone sends their smallest gift to the right 🎁🤏",
    "narr.warmup.6": "Everyone sends their largest gift to the left 🫸 🎁 🫷",

    "narr.endgame.1": "{actor} freezes any gift and keeps it permanently. 🥶🧊",
    "narr.endgame.2": "{actor} swaps all unlocked gifts with {target}. 🔄🎁",
    "narr.endgame.3": "{actor} trades unwanted gifts with {target}. ♻️🎁",
    "narr.endgame.4": "{a} and {b} swap a gift each. 🎭🎁",
    "narr.endgame.5": "{target} picks a gift from {actor}. 🎅🫳🎁",
    "narr.endgame.6": "Gifts rotate {dir}! 🔄🎁",

    // Logs
    "log.warmup.1": "{actor} takes {count} from the pile.",
    "log.warmup.2": "{actor} takes {count} from the pile.",
    "log.warmup.nothingToGive": "{actor} had nothing to give.",
    "log.warmup.gave": "{actor} gives 1 gift to {target}.",
    "log.warmup.noUnlockedSteal": "No unlocked gifts to steal.",
    "log.warmup.steal": "{actor} steals 1 gift from {target}.",
    "log.warmup.tiny":
      "Tiny Toss Right: everyone sends their smallest gift right.",
    "log.warmup.mega":
      "Mega Move Left: everyone sends their largest gift left.",

    "log.endgame.noFreeze": "{actor} has nothing to freeze.",
    "log.endgame.freeze": "{actor} freezes a gift — it is now locked.",
    "log.endgame.noSwap": "{actor} had no one to swap with.",
    "log.endgame.flip": "{actor} swaps unlocked gifts with {target}.",
    "log.endgame.trash.notEnough":
      "Trash Trade failed — nobody else had unlocked gifts.",
    "log.endgame.trash.failed":
      "Trash Trade failed — selection could not be made.",
    "log.endgame.trash.missing": "Trash Trade failed — missing unlocked gifts.",
    "log.endgame.trash.swap":
      "Trash Trade: {actor} swaps unlocked gifts with {target}.",
    "log.endgame.joker.notEnough":
      "Joker Swap failed — need two players with unlocked gifts.",
    "log.endgame.joker.failed":
      "Joker Swap failed — selection could not be made.",
    "log.endgame.joker.missing": "Joker Swap failed — missing unlocked gifts.",
    "log.endgame.joker.swap":
      "Joker Swap: {a} and {b} each choose an unlocked gift from the other.",
    "log.endgame.santa.none": "{actor} had nothing to hand over.",
    "log.endgame.santa.gave":
      "Santa's Hand: {target} chooses an unlocked gift from {actor}.",
    "log.endgame.twist": "Twist of Fate: gifts rotate {dir}.",
    "dir.left": "left",
    "dir.right": "right",
  },
  sv: {
    "ui.hero.title": "Christmas Chaos Game",
    "ui.hero.eyebrow": "Julklappsleken fast kaos",
    "ui.hero.subtitle": "Julklappsleken med kast där slumpen styr dramat!",
    "ui.setup.title": "Spelare & Paket",
    "ui.setup.hint": "",
    "ui.setup.playerPlaceholder": "Spelare {num}",
    "ui.setup.addPlayer": "+ Lägg till spelare",
    "ui.setup.remove": "Ta bort",
    "ui.setup.total": "Totalt antal paket",
    "ui.setup.randomize": "Slumpa ordning & starta",
    "ui.setup.randomizing": "Slumpar…",
    "ui.order.heading": "Spelordning",
    "ui.order.subtitle": "Vem får börja först? 🎲",
    "ui.order.playerFallback": "Spelare {num}",
    "ui.order.start": "Starta Christmas Chaos 🎲",
    "ui.order.starting": "Packar in alla presenter.. 🎁",
    "ui.banner.endgame": "Fas 2: Endgame — tre kast var!",
    "ui.banner.body": "Håll hårt i paketen — kaoset blev just värre.",
    "ui.banner.cta": "Kör!",
    "ui.status.pile": "Högen",
    "ui.status.current": "Nuvarande spelare",
    "ui.status.rollsPlayer": "Kast kvar (spelare)",
    "ui.status.rollsTotal": "Kast kvar (totalt)",
    "ui.lastRoll": "Senaste kast",
    "ui.lastRoll.empty": "Inga kast ännu.",
    "ui.rules.warmup": "Fas 1 — Warm up",
    "ui.rules.endgame": "Fas 2 — Endgame",
    "ui.rules.lockedNote":
      "Frusna paket stannar hos ägaren – de kan inte bytas, stjälas, ges bort eller roteras.",
    "ui.phase.ended": "Spelet är slut",
    "ui.reset": "Nollställ",
    "ui.debug.on": "Debug på",
    "ui.debug.off": "Debug av",
    "ui.debug.togglePhase": "Byt fas (debug)",
    "ui.roll.btn": "Slumpa",
    "ui.roll.randomizing": "Slumpar…",
    "ui.roll.finished": "Klart",
    "ui.lang.en": "EN",
    "ui.lang.sv": "SV",
    "ui.randomizer.headingWarmup": "SLUMPAR SPELARE",
    "ui.randomizer.headingEndgame": "SLUMPAR SPELARE",
    "ui.randomizer.hint": "Välj slumpmässig handling",
    "ui.randomizer.hintDebug": "Klicka på en action för att trigga (debug)",
    "ui.players.title": "Spelare",
    "ui.players.legend": "🎁 olåst · 🔒🎁 låst",
    "ui.players.empty": "Inga paket",
    "ui.log.title": "Actionlogg",
    "ui.log.subtitle": "Senaste först",
    "ui.log.empty": "Inga actions ännu.",
    "ui.modal.giveVerb": "väljer ett av sina paket och ger till",
    "ui.modal.stealVerb": "stjäl valfritt paket från",
    "ui.modal.flipVerb": "byter alla paket med",
    "ui.modal.trashVerb": "ska byta oönskade paket med",
    "ui.modal.jokerPairVerb": "väljer två spelare som byter paket",
    "ui.modal.santaVerb": "får välja ett valfritt paket från",
    "ui.modal.twistVerb": "roterar alla paket åt",
    "ui.modal.gameEnded.title": "Spelet är slut",
    "ui.modal.gameEnded.line1":
      "Nu är alla julklappar utdelade och spelet är slut. ",
    "ui.modal.gameEnded.line2": "Hoppas du hade det roligt!",
    "ui.modal.gameEnded.line3":
      'Om du vill börja om spelet, välj "Nollställ" i menyn.',
    "ui.modal.close": "Stäng",
    "ui.narrative.placeholder": "Väntar på nästa händelse…",

    // Actions
    "actions.warmup.1.title": "Dubbelt Upp!",
    "actions.warmup.1.desc": "Ta två valfria paket från högen 🎁🎁",
    "actions.warmup.2.title": "Ta ett paket",
    "actions.warmup.2.desc": "Ta ett valfritt paket från högen 🎁",
    "actions.warmup.3.title": "Forced Tribute",
    "actions.warmup.3.desc":
      "Ge ett av dina paket till en slumpmässig spelare 🫴🎁",
    "actions.warmup.4.title": "The Grinch Tax",
    "actions.warmup.4.desc":
      "Stjäl ett valfritt paket från en slumpmässig spelare 🔫🎁",
    "actions.warmup.5.title": "Tiny Toss Right",
    "actions.warmup.5.desc": "Skicka ditt minsta olåsta paket till höger 🎁🤏",
    "actions.warmup.6.title": "Mega Move Left",
    "actions.warmup.6.desc":
      "Skicka ditt största olåsta paket till vänster 🫸🎁🫷",

    "actions.endgame.1.title": "Ice Lock",
    "actions.endgame.1.desc": "Frys ett valfritt paket. 🥶🧊",
    "actions.endgame.2.title": "Full Flip",
    "actions.endgame.2.desc":
      "Byt alla dina paket med en slumpmässig spelare. 🔄",
    "actions.endgame.3.title": "Trash Trade",
    "actions.endgame.3.desc": "Två spelare byter oönskade paket 🗑️",
    "actions.endgame.4.title": "Joker Swap",
    "actions.endgame.4.desc":
      "Två spelare väljer varsitt valfritt paket från den andre och byter. 🎭",
    "actions.endgame.5.title": "Santa's Hand",
    "actions.endgame.5.desc": "Du måste ge bort ett valfritt paket 🎅🫳",
    "actions.endgame.6.title": "Twist of Fate",
    "actions.endgame.6.desc":
      "Alla roterar sina paket ett steg vänster eller höger 🔮",

    // Narratives
    "narr.warmup.1": "{actor} tar {count} paket från högen 🎁",
    "narr.warmup.2": "{actor} tar {count} paket från högen 🎁",
    "narr.warmup.3": "{actor} väljer ett paket att ge till {target} 🎁✨",
    "narr.warmup.4": "{actor} stjäl ett valfritt paket från {target} 🔫🎁",
    "narr.warmup.5": "Alla skickar sitt minsta paket till höger 🎁🤏",
    "narr.warmup.6": "Alla skickar sitt största paket till vänster 🫸 🎁 🫷",

    "narr.endgame.1":
      "{actor} fryser ett valfritt paket och behåller det permanent tills spelets slut. 🥶🧊",
    "narr.endgame.2":
      "{actor} byter alla paket med {target}. Frusna paket ligger kvar hos ägaren. 🔄",
    "narr.endgame.3":
      "{actor} & {target} väljer varsitt oönskat paket och byter med varandra. Har du inget paket så tar du utan att ge! ♻️",
    "narr.endgame.4":
      "{a} och {b} väljer ett varsitt paket från den andre och byter. Har du inget paket så tar du utan att ge! 🎭",
    "narr.endgame.5":
      "{actor} tvingas ge bort ett paket till {target} som får välja fritt! 🎅🫳",
    "narr.endgame.6": "Alla byter paket! Rotera alla dina paket åt {dir}! 🔮",

    // Logs
    "log.warmup.1": "{actor} tar {count} från högen.",
    "log.warmup.2": "{actor} tar {count} från högen.",
    "log.warmup.nothingToGive": "{actor} hade inget att ge.",
    "log.warmup.gave": "{actor} ger 1 paket till {target}.",
    "log.warmup.noUnlockedSteal": "Inga olåsta paket att stjäla.",
    "log.warmup.steal": "{actor} stjäl 1 paket från {target}.",
    "log.warmup.tiny":
      "Tiny Toss Right: alla skickar sitt minsta paket åt höger.",
    "log.warmup.mega":
      "Mega Move Left: alla skickar sitt största paket åt vänster.",

    "log.endgame.noFreeze": "{actor} har inget att frysa.",
    "log.endgame.freeze": "{actor} fryser ett paket.",
    "log.endgame.noSwap": "{actor} hade ingen att byta med.",
    "log.endgame.flip": "{actor} byter olåsta paket med {target}.",
    "log.endgame.trash.notEnough":
      "Trash Trade misslyckades – ingen annan hade olåsta paket.",
    "log.endgame.trash.failed":
      "Trash Trade misslyckades – val kunde inte göras.",
    "log.endgame.trash.missing":
      "Trash Trade misslyckades – saknar olåsta paket.",
    "log.endgame.trash.swap":
      "Trash Trade: {actor} byter olåsta paket med {target}.",
    "log.endgame.joker.notEnough":
      "Joker Swap misslyckades – behöver två spelare med olåsta paket.",
    "log.endgame.joker.failed":
      "Joker Swap misslyckades – val kunde inte göras.",
    "log.endgame.joker.missing":
      "Joker Swap misslyckades – saknar olåsta paket.",
    "log.endgame.joker.swap":
      "Joker Swap: {a} och {b} väljer varsitt olåst paket från den andre.",
    "log.endgame.santa.none": "{actor} hade inget att ge bort.",
    "log.endgame.santa.gave":
      "Santa’s Hand: {target} väljer ett olåst paket från {actor}.",
    "log.endgame.twist": "Twist of Fate: paketen roterar {dir}.",
    "dir.left": "vänster",
    "dir.right": "höger",
  },
};

export const detectBrowserLang = (): Lang => {
  if (typeof navigator === "undefined") return "en";
  const preferred =
    (Array.isArray(navigator.languages)
      ? navigator.languages[0]
      : navigator.language) ?? "";
  const lower = preferred.toLowerCase();
  if (lower.startsWith("sv")) return "sv";
  return "en";
};

export const tr = (
  lang: Lang,
  key: string,
  params?: Record<string, string | number>
) => {
  const fallback = messages.en[key];
  const str = messages[lang]?.[key] ?? fallback ?? key;
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
};
