<div align="center">

# 🎁 CHRISTMAS CHAOS 🎄

### The gift game. On steroids.

**Real gifts on the table. One screen running the show. Every roll can make you rich, broke or frozen.<br/>Nobody is safe. Not even Grandma.**

[**▶ Play it now**](https://christmas-chaos-gift-exchange.vercel.app/) · No sign-up · No backend · Works on phone, laptop and TV

![Christmas Chaos start screen](docs/hero.jpg)

</div>

---

## What is this?

You know the classic dice gift game. Pile of presents in the middle, everybody rolls, people grab, steal and swap until the timer runs out and someone ends up crying over a scented candle.

**Christmas Chaos is that game with the volume knob ripped off.** The app is the game master: it seats you, picks who starts, rolls the fate, chooses the victim and tells the table exactly what to do. You just do it, for real, with real gifts. Then you scream.

- 🎲 **Everyone gets the same number of rolls.** Fair, then brutal.
- 🪑 **The app decides where you sit.** Your left and right neighbours suddenly matter a lot.
- 🔦 **A spotlight picks the victim.** Watch the table light up while it decides who you rob.
- 🧊 **Freeze your favourite gift** before someone flips your whole hand.
- 🔥 **Two phases:** a greedy warm-up, then an ENDGAME where the table literally catches fire.
- 🏆 **Final standings and awards:** Gift Hoarder, Ice King and the one Left in the Cold.

## Sit like this

Before the first roll, the app shuffles everyone into seats around a round table and shows who sits next to whom. Re-roll if your cousin ended up next to their ex. Then a spotlight sweeps the table and picks who starts.

Seats go **clockwise**. Facing the middle of the table, the person clockwise from you is on your **left**, so turns pass to the left, and every "pass it left / right" action follows the seating chart.

![Seating chart](docs/seating.jpg)

## How a round plays

1. Put all the gifts in a pile in the middle.
2. Hit **ROLL**. The action board spins like a slot machine and lands on your fate.
3. If someone gets hit, the spotlight spins around the table and picks them.
4. The stage card tells you what to do, in plain words. Do it at the table.
5. Next player. Repeat until the chaos is over. Open your gifts.

![Warm-up in action](docs/warmup.jpg)

### Phase 1 · Warm-up (3 rolls each, keeps going until the pile is empty)

| | Action | What happens |
|---|---|---|
| 🎁🎁 | **Double Grab** | Take two gifts from the pile. |
| 🎁 | **Grab One** | Take one gift from the pile. |
| 🫴 | **Forced Tribute** | Give one of your gifts to a random player. |
| 🥷 | **The Grinch Tax** | Steal any gift from a random player. |
| 🤏 | **Tiny Toss Right** | Everyone passes their smallest gift to the right. |
| 💪 | **Mega Move Left** | Everyone passes their biggest gift to the left. |

### Phase 2 · ENDGAME (3 rolls each)

| | Action | What happens |
|---|---|---|
| 🧊 | **Ice Lock** | Freeze one of your gifts. Nobody can touch it again. |
| 🔄 | **Full Flip** | Swap ALL your unfrozen gifts with a random player. |
| 🗑️ | **Trash Trade** | You and a random player swap one unwanted gift each. |
| 🃏 | **Joker Swap** | Two random players take one gift from each other. |
| 🎅 | **Santa's Hand** | Give a gift away. The receiver picks which one. |
| 🌪️ | **Twist of Fate** | Everyone passes ALL unfrozen gifts one seat left or right. |

The app only offers actions that are actually possible (no stealing from empty hands), and keeps track of every gift so the table and the screen never disagree.

![Endgame](docs/endgame.jpg)

## Party features

- **Swedish and English**, switchable any time. Defaults to your browser language.
- **Sound effects** synthesized in the browser (yes, there is a jingle). Mute with one tap.
- **Turbo mode** for impatient families.
- **Space / Enter rolls** so the host can drive from a keyboard while the game is on the TV.
- **Survives reloads.** Close the tab by accident, come back, keep playing.
- **Chaos log** of every move, for settling arguments.
- Respects **reduced motion** settings.
- Secret **debug mode**: add `?debug` to the URL (or tap the logo five times) to force any action and skip phases.

## Run it yourself

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # static site in dist/, host it anywhere
pnpm lint       # Biome
```

100% client-side. No backend, no accounts, nothing stored except game state, language and sound settings in `localStorage`.

## Under the hood

React 18 + TypeScript + Vite, plain CSS, zero runtime dependencies beyond React.

| Where | What |
|---|---|
| `src/game/actions.ts` | Pure rules: what each roll does to the players and the pile. |
| `src/game/seating.ts` | Seat shuffling and left/right neighbour maths. |
| `src/constants/tables.ts` | The two action tables, roll counts and when each action is possible. |
| `src/constants/messages.ts` | Every word of copy, in English and Swedish. |
| `src/hooks/useChaosGame.ts` | Game state, turn flow, animations and persistence. |
| `src/components/` | Atomic design: atoms → molecules → organisms → templates. |

Bugs, ideas, even more chaotic actions: open an issue or a PR. 🎄
