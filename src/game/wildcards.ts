import type { GamePhase, Player } from "../types/game";
import { clonePlayers } from "../utils/players";
import type { ActionOutcome, ActionTargets } from "./actions";
import { leftOf, oppositeOf, rightOf, seatAt } from "./seating";

/**
 * Wildcards: the ⭐ card on both decks. Rolling it spins a second wheel of
 * ridiculous events. Each one is a small pure function like the regular actions.
 */
export type WildId =
  | "seatSwap"
  | "blizzard"
  | "jackpot"
  | "blindfold"
  | "hotPotato"
  | "encore"
  | "thaw"
  | "fruitSalad";

export type Wildcard = {
  id: WildId;
  emoji: string;
  weight: number;
  possible: (phase: GamePhase, players: Player[], actor: number) => boolean;
};

const unlockedOf = (p: Player) => p.packages.filter((pkg) => !pkg.locked);
const hasUnlocked = (p: Player) => p.packages.some((pkg) => !pkg.locked);

export const WILDCARDS: Wildcard[] = [
  { id: "seatSwap", emoji: "💺", weight: 1, possible: (_ph, p) => p.length >= 4 },
  {
    id: "blizzard",
    emoji: "🌨️",
    weight: 1,
    possible: (_ph, p) => p.filter(hasUnlocked).length >= 2,
  },
  {
    id: "jackpot",
    emoji: "🎰",
    weight: 1,
    possible: (_ph, p) => p.length >= 3 && p.some(hasUnlocked),
  },
  {
    id: "blindfold",
    emoji: "🙈",
    weight: 1,
    possible: (_ph, p, actor) => p.some((pl, i) => i !== actor && hasUnlocked(pl)),
  },
  {
    id: "hotPotato",
    emoji: "🥔",
    weight: 1,
    possible: (_ph, p, actor) => p.length >= 3 && hasUnlocked(p[actor]),
  },
  { id: "encore", emoji: "🔁", weight: 0.8, possible: () => true },
  {
    id: "thaw",
    emoji: "🫠",
    weight: 1.2,
    possible: (ph, p) => ph === "endgame" && p.some((pl) => pl.packages.some((pkg) => pkg.locked)),
  },
  {
    id: "fruitSalad",
    emoji: "🥗",
    weight: 1,
    possible: (_ph, p) => p.length >= 4 && p.filter(hasUnlocked).length >= 2,
  },
];

export const wildcardById = (id: string) => WILDCARDS.find((w) => w.id === id);

export const possibleWildcards = (phase: GamePhase, players: Player[], actor: number) =>
  WILDCARDS.filter((w) => w.possible(phase, players, actor));

const pickRandom = <T>(items: T[]): T | undefined =>
  items.length ? items[Math.floor(Math.random() * items.length)] : undefined;

const moveOne = (from: Player, to: Player) => {
  const gift = pickRandom(unlockedOf(from));
  if (!gift) return false;
  from.packages = from.packages.filter((pkg) => pkg.id !== gift.id);
  to.packages.push(gift);
  return true;
};

/** Hot potato distance: at least 3 seats, at most twice round the table. */
export const potatoSteps = (count: number) => 3 + Math.floor(Math.random() * Math.max(1, count * 2 - 2));

export const applyWildcard = (
  id: WildId,
  roster: Player[],
  pile: number,
  actorIdx: number,
  targets: ActionTargets
): ActionOutcome | null => {
  const players = clonePlayers(roster);
  const actor = players[actorIdx];
  const count = players.length;
  const base = { players, pile, fx: "swap" as const, seats: [actorIdx] };
  const msg = (params: Record<string, string | number> = {}) => ({
    log: [{ key: `log.wild.${id}`, params }],
    narrative: { key: `narr.wild.${id}`, params },
  });

  switch (id) {
    case "seatSwap": {
      const [a, b] = targets.pair ?? [];
      if (a === undefined || b === undefined || a === b) return null;
      const params = { a: players[a].name, b: players[b].name };
      [players[a], players[b]] = [players[b], players[a]];
      return { ...base, ...msg(params), fx: "rotate", seats: [a, b], reseated: true };
    }
    case "blizzard": {
      // Everyone's unfrozen gifts into the middle, dealt back one at a time from the actor.
      const pool = players.flatMap(unlockedOf);
      for (const p of players) p.packages = p.packages.filter((pkg) => pkg.locked);
      pool.forEach((gift, i) => {
        players[(actorIdx + i) % count].packages.push(gift);
      });
      return { ...base, ...msg({ actor: actor.name, count: pool.length }), fx: "rotate" };
    }
    case "jackpot": {
      const winIdx = targets.target ?? actorIdx;
      const winner = players[winIdx];
      const left = players[leftOf(winIdx, count)];
      const right = players[rightOf(winIdx, count)];
      const took = [left, right].filter((n) => n !== winner && moveOne(n, winner));
      if (!took.length) return null;
      return {
        ...base,
        ...msg({ winner: winner.name, left: left.name, right: right.name }),
        fx: "grab",
        seats: [winIdx, leftOf(winIdx, count), rightOf(winIdx, count)],
        links: [
          { from: winIdx, to: leftOf(winIdx, count), kind: "steal" },
          { from: winIdx, to: rightOf(winIdx, count), kind: "steal" },
        ],
      };
    }
    case "blindfold": {
      const t = targets.target;
      if (t === undefined || !moveOne(players[t], actor)) return null;
      return {
        ...base,
        ...msg({ actor: actor.name, target: players[t].name }),
        fx: "steal",
        seats: [actorIdx, t],
        links: [{ from: actorIdx, to: t, kind: "steal" }],
      };
    }
    case "hotPotato": {
      const steps = targets.steps ?? 3;
      const landIdx = seatAt(actorIdx, count, "left", steps);
      if (landIdx === actorIdx) {
        return { ...base, ...msg({ actor: actor.name, steps, target: actor.name }), fx: "calm" };
      }
      if (!moveOne(actor, players[landIdx])) return null;
      return {
        ...base,
        ...msg({ actor: actor.name, steps, target: players[landIdx].name }),
        fx: "give",
        seats: [actorIdx, landIdx],
        links: [{ from: actorIdx, to: landIdx, kind: "give" }],
        direction: "left",
        steps,
      };
    }
    case "encore":
      return { ...base, ...msg({ actor: actor.name }), fx: "grab", extraRoll: true };
    case "thaw": {
      let thawed = 0;
      for (const p of players) {
        p.packages = p.packages.map((pkg) => {
          if (pkg.locked) thawed += 1;
          return { ...pkg, locked: false };
        });
      }
      return { ...base, ...msg({ count: thawed }), fx: "freeze" };
    }
    case "fruitSalad": {
      // Everyone swaps one gift with the person straight across, all at once.
      const half = Math.floor(count / 2);
      const links: ActionOutcome["links"] = [];
      for (let i = 0; i < half; i += 1) {
        const j = oppositeOf(i, count);
        const a = players[i];
        const b = players[j];
        const ga = pickRandom(unlockedOf(a));
        const gb = pickRandom(unlockedOf(b));
        if (ga && gb) {
          a.packages = [...a.packages.filter((p) => p.id !== ga.id), gb];
          b.packages = [...b.packages.filter((p) => p.id !== gb.id), ga];
          links.push({ from: i, to: j, kind: "swap" });
        } else if (ga || gb) {
          // Empty-handed across the table? You take without giving.
          const [from, to] = ga ? [i, j] : [j, i];
          moveOne(players[from], players[to]);
          links.push({ from: to, to: from, kind: "steal" });
        }
      }
      if (!links.length) return null;
      return { ...base, ...msg({}), fx: "swap", seats: [], links };
    }
    default:
      return null;
  }
};
