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
  | "avalanche"
  | "jackpot"
  | "blindfold"
  | "hotPotato"
  | "masterThief"
  | "thaw"
  | "robinHood";

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
    id: "avalanche",
    emoji: "🏔️",
    weight: 1,
    possible: (_ph, p, actor) =>
      p.length >= 4 &&
      avalancheChain(actor, p.length)
        .slice(1)
        .every((i) => i !== actor && hasUnlocked(p[i])),
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
  {
    id: "masterThief",
    emoji: "🦹",
    weight: 1,
    possible: (_ph, p, actor) => richestOther(p, actor) !== null,
  },
  {
    id: "thaw",
    emoji: "🫠",
    weight: 1.2,
    possible: (ph, p) => ph === "endgame" && p.some((pl) => pl.packages.some((pkg) => pkg.locked)),
  },
  {
    id: "robinHood",
    emoji: "🏹",
    weight: 1,
    possible: (_ph, p) => p.length >= 3 && robinPair(p) !== null,
  },
];

export const wildcardById = (id: string) => WILDCARDS.find((w) => w.id === id);

export const possibleWildcards = (phase: GamePhase, players: Player[], actor: number) =>
  WILDCARDS.filter((w) => w.possible(phase, players, actor));

/**
 * Robin Hood: the richest guest (with something stealable) and the poorest guest.
 * Ties are broken at random so it's never the same pair by default.
 */
export const robinPair = (players: Player[]): [number, number] | null => {
  const order = players.map((_, i) => i).sort(() => Math.random() - 0.5);
  const rich = order
    .filter((i) => hasUnlocked(players[i]))
    .sort((a, b) => players[b].packages.length - players[a].packages.length)[0];
  if (rich === undefined) return null;
  const poor = order.sort((a, b) => players[a].packages.length - players[b].packages.length)[0];
  if (players[rich].packages.length - players[poor].packages.length < 2) return null;
  return [rich, poor];
};

/** The guest (other than the actor) with the most stealable gifts; ties at random. */
export const richestOther = (players: Player[], actor: number): number | null => {
  const pool = players
    .map((_, i) => i)
    .filter((i) => i !== actor && hasUnlocked(players[i]))
    .sort(() => Math.random() - 0.5)
    .sort((a, b) => players[b].packages.length - players[a].packages.length);
  return pool[0] ?? null;
};

/** Avalanche: actor -> across -> their left -> across again. Three steals, one after another. */
export const avalancheChain = (actor: number, count: number) => {
  const a = oppositeOf(actor, count);
  const b = leftOf(a, count);
  // With an odd table the seat across from b is the actor again; take the actor's right instead.
  const across = oppositeOf(b, count);
  const c = across === actor ? rightOf(actor, count) : across;
  return [actor, a, b, c];
};

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
export const potatoSteps = (count: number) =>
  3 + Math.floor(Math.random() * Math.max(1, count * 2 - 2));

export const applyWildcard = (
  id: WildId,
  roster: Player[],
  pile: number,
  actorIdx: number,
  targets: ActionTargets,
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
    case "avalanche": {
      // A chain of steals rolling across the table, one at a time:
      // each robbed guest immediately robs the next one in the chain.
      const chain = avalancheChain(actorIdx, count);
      const links: NonNullable<ActionOutcome["links"]> = [];
      for (let i = 0; i < chain.length - 1; i += 1) {
        const thief = chain[i];
        const victim = chain[i + 1];
        if (thief === victim || !moveOne(players[victim], players[thief])) break;
        links.push({ from: thief, to: victim, kind: "steal" });
      }
      if (!links.length) return null;
      const names = chain.map((idx) => players[idx].name);
      return {
        ...base,
        ...msg({ actor: names[0], a: names[1], b: names[2], c: names[3] }),
        fx: "steal",
        seats: chain.slice(0, links.length + 1),
        links,
      };
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
    case "masterThief": {
      const t = richestOther(players, actorIdx);
      if (t === null || !moveOne(players[t], actor)) return null;
      return {
        ...base,
        ...msg({ actor: actor.name, target: players[t].name }),
        fx: "steal",
        seats: [actorIdx, t],
        links: [{ from: actorIdx, to: t, kind: "steal" }],
      };
    }
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
    case "robinHood": {
      const pair = robinPair(players);
      if (!pair) return null;
      const [rich, poor] = pair;
      if (!moveOne(players[rich], players[poor])) return null;
      return {
        ...base,
        ...msg({ rich: players[rich].name, poor: players[poor].name }),
        fx: "give",
        seats: [rich, poor],
        links: [{ from: rich, to: poor, kind: "give" }],
      };
    }
    default:
      return null;
  }
};
