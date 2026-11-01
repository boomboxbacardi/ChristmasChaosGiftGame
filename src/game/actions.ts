import type { Direction, FxKind, GamePhase, Message, Package, Player } from "../types/game";
import { clonePlayers } from "../utils/players";
import { uid } from "./engine";
import { oppositeOf, seatAt } from "./seating";
import { type WildId, applyWildcard, potatoSteps } from "./wildcards";

export type SeatLink = { from: number; to: number; kind: "give" | "steal" | "swap" };

export type ActionOutcome = {
  players: Player[];
  pile: number;
  log: Message[];
  narrative: Message;
  fx: FxKind;
  /** Seats involved in the action (actor first). */
  seats: number[];
  /** Arrows to draw on the table. */
  links?: SeatLink[];
  direction?: Direction;
  steps?: number;
  /** The actor rolls again right away. */
  extraRoll?: boolean;
  /** Seats were rearranged. */
  reseated?: boolean;
};

export type ActionTargets = {
  /** Seat index of the other player picked by the target roll. */
  target?: number;
  /** Two seat indices picked for Joker Swap. */
  pair?: [number, number];
  /** Seats a relay gift travels through, after the actor. */
  chain?: number[];
  direction?: Direction;
  steps?: number;
  wild?: WildId;
};

const pickRandom = <T>(items: T[]): T | undefined =>
  items.length ? items[Math.floor(Math.random() * items.length)] : undefined;

const unlockedOf = (player: Player) => player.packages.filter((pkg) => !pkg.locked);
const lockedOf = (player: Player) => player.packages.filter((pkg) => pkg.locked);
const hasUnlocked = (player: Player) => player.packages.some((pkg) => !pkg.locked);
const without = (packages: Package[], gift: Package) =>
  packages.filter((pkg) => pkg.id !== gift.id);

const otherSeats = (players: Player[], actor: number, filter?: (p: Player) => boolean) =>
  players
    .map((player, idx) => ({ player, idx }))
    .filter(({ player, idx }) => idx !== actor && (!filter || filter(player)))
    .map(({ idx }) => idx);

/** Everyone simultaneously sends one unlocked gift `steps` seats away. */
const passOneGift = (
  players: Player[],
  dir: Direction,
  steps: number,
  pick: (unlocked: Package[]) => Package | undefined
) => {
  const next = clonePlayers(players);
  const outgoing = next.map((p) => pick(unlockedOf(p)));
  outgoing.forEach((gift, idx) => {
    if (gift) next[idx].packages = without(next[idx].packages, gift);
  });
  outgoing.forEach((gift, idx) => {
    if (gift) next[seatAt(idx, next.length, dir, steps)].packages.push(gift);
  });
  return next;
};

/** Everyone passes ALL unlocked gifts `steps` seats away; frozen gifts stay. */
const rotateUnlocked = (players: Player[], dir: Direction, steps: number) => {
  const next = clonePlayers(players);
  const pools = next.map(unlockedOf);
  for (const p of next) p.packages = lockedOf(p);
  pools.forEach((pool, idx) => {
    next[seatAt(idx, next.length, dir, steps)].packages.push(...pool);
  });
  return next;
};

/** Move one random unlocked gift from one player to another. */
const moveOne = (from: Player, to: Player) => {
  const gift = pickRandom(unlockedOf(from));
  if (!gift) return false;
  from.packages = without(from.packages, gift);
  to.packages.push(gift);
  return true;
};

/** Swap one unlocked gift each; falls back to a one-way move. */
const swapOne = (a: Player, b: Player) => {
  const giftA = pickRandom(unlockedOf(a));
  const giftB = pickRandom(unlockedOf(b));
  if (giftA && giftB) {
    a.packages = [...without(a.packages, giftA), giftB];
    b.packages = [...without(b.packages, giftB), giftA];
    return true;
  }
  if (giftA) return moveOne(a, b);
  if (giftB) return moveOne(b, a);
  return false;
};

/** Swap every unlocked gift between two players. */
const swapAll = (a: Player, b: Player) => {
  const mine = unlockedOf(a);
  const theirs = unlockedOf(b);
  a.packages = [...lockedOf(a), ...theirs];
  b.packages = [...lockedOf(b), ...mine];
  return mine.length + theirs.length > 0;
};

const calm = (players: Player[], pile: number, actor: number): ActionOutcome => ({
  players,
  pile,
  log: [{ key: "log.calm", params: { actor: players[actor]?.name ?? "" } }],
  narrative: { key: "narr.calm", params: { actor: players[actor]?.name ?? "" } },
  fx: "calm",
  seats: [actor],
});

const randomSteps = (count: number) => {
  const max = Math.max(1, Math.min(3, Math.floor(count / 2)));
  return 1 + Math.floor(Math.random() * max);
};

/** A relay: the gift hops through 3 random players (fewer at small tables). */
export const randomChain = (players: Player[], actor: number) => {
  const others = otherSeats(players, actor);
  const hops = Math.min(3, others.length);
  const chain: number[] = [];
  const pool = [...others];
  for (let i = 0; i < hops; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    chain.push(pool.splice(idx, 1)[0]);
  }
  return chain;
};

/** Randomness that isn't animated as a target roll: direction, steps, relay path. */
export const rollExtras = (
  phase: GamePhase,
  roll: number,
  players: Player[],
  actor: number,
  wild?: WildId
): ActionTargets => {
  if (roll === WILD_ROLL && wild === "hotPotato") return { steps: potatoSteps(players.length) };
  if (phase === "warmup" && (roll === 5 || roll === 6)) {
    return { steps: randomSteps(players.length) };
  }
  if (phase === "warmup" && roll === 8) return { chain: randomChain(players, actor) };
  if (phase === "endgame" && roll === 6) {
    return {
      direction: Math.random() > 0.5 ? "left" : "right",
      steps: randomSteps(players.length),
    };
  }
  return {};
};

const stepsParams = (steps: number, dir: Direction) => ({
  steps,
  dir,
  where: `${steps}:${dir}`,
});

export const applyWarmupRoll = (
  roll: number,
  roster: Player[],
  pile: number,
  actorIdx: number,
  targets: ActionTargets = {}
): ActionOutcome => {
  const players = clonePlayers(roster);
  const actor = players[actorIdx];
  const name = actor.name;

  if (roll === 1 || roll === 2) {
    const count = Math.min(roll === 1 ? 2 : 1, pile);
    if (!count) return calm(players, pile, actorIdx);
    for (let i = 0; i < count; i += 1) actor.packages.push({ id: uid(), locked: false });
    const params = { actor: name, count };
    return {
      players,
      pile: pile - count,
      log: [{ key: `log.warmup.${roll}`, params }],
      narrative: { key: `narr.warmup.${roll}`, params },
      fx: "grab",
      seats: [actorIdx],
    };
  }

  if (roll === 3 || roll === 4) {
    const filter = roll === 4 ? hasUnlocked : undefined;
    const targetIdx = targets.target ?? pickRandom(otherSeats(players, actorIdx, filter));
    const target = targetIdx !== undefined ? players[targetIdx] : undefined;
    const ok =
      target && (roll === 3 ? moveOne(actor, target) : moveOne(target, actor));
    if (!target || targetIdx === undefined || !ok) return calm(players, pile, actorIdx);
    const params = { actor: name, target: target.name };
    return {
      players,
      pile,
      log: [{ key: `log.warmup.${roll}`, params }],
      narrative: { key: `narr.warmup.${roll}`, params },
      fx: roll === 3 ? "give" : "steal",
      seats: [actorIdx, targetIdx],
      links: [{ from: actorIdx, to: targetIdx, kind: roll === 3 ? "give" : "steal" }],
    };
  }

  if (roll === 5 || roll === 6) {
    // 5: smallest to the right, 6: biggest to the left, 1–3 seats away.
    const direction: Direction = roll === 5 ? "right" : "left";
    const steps = targets.steps ?? 1;
    const next = passOneGift(players, direction, steps, (unlocked) =>
      roll === 5 ? unlocked[0] : unlocked[unlocked.length - 1]
    );
    const params = stepsParams(steps, direction);
    return {
      players: next,
      pile,
      log: [{ key: `log.warmup.${roll}`, params }],
      narrative: { key: `narr.warmup.${roll}`, params },
      fx: "rotate",
      seats: [actorIdx],
      direction,
      steps,
    };
  }

  if (roll === 7) {
    const oppIdx = oppositeOf(actorIdx, players.length);
    const opp = players[oppIdx];
    if (oppIdx === actorIdx || !swapOne(actor, opp)) return calm(players, pile, actorIdx);
    const params = { actor: name, target: opp.name };
    return {
      players,
      pile,
      log: [{ key: "log.warmup.7", params }],
      narrative: { key: "narr.warmup.7", params },
      fx: "swap",
      seats: [actorIdx, oppIdx],
      links: [{ from: actorIdx, to: oppIdx, kind: "swap" }],
    };
  }

  // 8: Gift relay. The actor's gift hops through the chain; the last one keeps it.
  const chain = targets.chain ?? randomChain(players, actorIdx);
  const last = chain[chain.length - 1];
  if (last === undefined || !moveOne(actor, players[last])) return calm(players, pile, actorIdx);
  const path = [actorIdx, ...chain];
  const names = path.map((idx) => players[idx].name);
  return {
    players,
    pile,
    log: [{ key: "log.warmup.8", params: { actor: name, target: players[last].name } }],
    narrative: {
      key: "narr.warmup.8",
      params: { actor: name, path: names.join(" → "), target: players[last].name },
    },
    fx: "give",
    seats: path,
    links: path.slice(1).map((to, i) => ({ from: path[i], to, kind: "give" as const })),
  };
};

export const applyEndgameRoll = (
  roll: number,
  roster: Player[],
  pile: number,
  actorIdx: number,
  targets: ActionTargets = {}
): ActionOutcome => {
  const players = clonePlayers(roster);
  const actor = players[actorIdx];
  const name = actor.name;

  if (roll === 1) {
    const pick = pickRandom(unlockedOf(actor));
    if (!pick) return calm(players, pile, actorIdx);
    actor.packages = actor.packages.map((pkg) =>
      pkg.id === pick.id ? { ...pkg, locked: true } : pkg
    );
    const params = { actor: name };
    return {
      players,
      pile,
      log: [{ key: "log.endgame.1", params }],
      narrative: { key: "narr.endgame.1", params },
      fx: "freeze",
      seats: [actorIdx],
    };
  }

  if (roll === 2 || roll === 3 || roll === 5) {
    const filter = roll === 2 ? hasUnlocked : undefined;
    const targetIdx = targets.target ?? pickRandom(otherSeats(players, actorIdx, filter));
    const target = targetIdx !== undefined ? players[targetIdx] : undefined;
    if (!target || targetIdx === undefined) return calm(players, pile, actorIdx);

    const ok =
      roll === 2 ? swapAll(actor, target) : roll === 3 ? swapOne(actor, target) : moveOne(actor, target);
    if (!ok) return calm(players, pile, actorIdx);

    const params = { actor: name, target: target.name };
    const kind = roll === 5 ? "give" : "swap";
    return {
      players,
      pile,
      log: [{ key: `log.endgame.${roll}`, params }],
      narrative: { key: `narr.endgame.${roll}`, params },
      fx: kind,
      seats: [actorIdx, targetIdx],
      links: [{ from: actorIdx, to: targetIdx, kind }],
    };
  }

  if (roll === 4) {
    const candidates = players.map((_, idx) => idx);
    const pair =
      targets.pair ??
      (() => {
        const a = pickRandom(candidates.filter((idx) => hasUnlocked(players[idx])));
        const b = pickRandom(candidates.filter((idx) => idx !== a));
        return a !== undefined && b !== undefined ? ([a, b] as [number, number]) : undefined;
      })();
    if (!pair || !swapOne(players[pair[0]], players[pair[1]])) {
      return calm(players, pile, actorIdx);
    }
    const params = { a: players[pair[0]].name, b: players[pair[1]].name };
    return {
      players,
      pile,
      log: [{ key: "log.endgame.4", params }],
      narrative: { key: "narr.endgame.4", params },
      fx: "swap",
      seats: pair,
      links: [{ from: pair[0], to: pair[1], kind: "swap" }],
    };
  }

  if (roll === 6) {
    const direction: Direction = targets.direction ?? (Math.random() > 0.5 ? "left" : "right");
    const steps = targets.steps ?? 1;
    const params = stepsParams(steps, direction);
    return {
      players: rotateUnlocked(players, direction, steps),
      pile,
      log: [{ key: "log.endgame.6", params }],
      narrative: { key: "narr.endgame.6", params },
      fx: "rotate",
      seats: [actorIdx],
      direction,
      steps,
    };
  }

  if (roll === 7) {
    // Robin Hood: the richest (by unfrozen gifts) gives one to the poorest.
    const unlockedCounts = players.map((p) => unlockedOf(p).length);
    const totals = players.map((p) => p.packages.length);
    const maxUnlocked = Math.max(...unlockedCounts);
    const minTotal = Math.min(...totals);
    const richIdx = pickRandom(
      players.map((_, i) => i).filter((i) => unlockedCounts[i] === maxUnlocked && maxUnlocked > 0)
    );
    const poorIdx = pickRandom(
      players.map((_, i) => i).filter((i) => totals[i] === minTotal && i !== richIdx)
    );
    if (richIdx === undefined || poorIdx === undefined || !moveOne(players[richIdx], players[poorIdx])) {
      return calm(players, pile, actorIdx);
    }
    const params = { actor: name, rich: players[richIdx].name, poor: players[poorIdx].name };
    return {
      players,
      pile,
      log: [{ key: "log.endgame.7", params }],
      narrative: { key: "narr.endgame.7", params },
      fx: "steal",
      seats: [richIdx, poorIdx],
      links: [{ from: richIdx, to: poorIdx, kind: "give" }],
    };
  }

  // 8: swap ALL unfrozen gifts with the person straight across the table.
  const oppIdx = oppositeOf(actorIdx, players.length);
  const opp = players[oppIdx];
  if (oppIdx === actorIdx || !swapAll(actor, opp)) return calm(players, pile, actorIdx);
  const params = { actor: name, target: opp.name };
  return {
    players,
    pile,
    log: [{ key: "log.endgame.8", params }],
    narrative: { key: "narr.endgame.8", params },
    fx: "swap",
    seats: [actorIdx, oppIdx],
    links: [{ from: actorIdx, to: oppIdx, kind: "swap" }],
  };
};

export const WILD_ROLL = 9;

export const applyRoll = (
  phase: GamePhase,
  roll: number,
  roster: Player[],
  pile: number,
  actorIdx: number,
  targets?: ActionTargets
) =>
  roll === 0
    ? calm(clonePlayers(roster), pile, actorIdx)
    : roll === WILD_ROLL
      ? ((targets?.wild && applyWildcard(targets.wild, roster, pile, actorIdx, targets)) ||
        calm(clonePlayers(roster), pile, actorIdx))
      : phase === "warmup"
      ? applyWarmupRoll(roll, roster, pile, actorIdx, targets)
      : applyEndgameRoll(roll, roster, pile, actorIdx, targets);

/**
 * Christmas Miracle: after the last roll, everyone empty-handed takes one gift
 * from whoever holds the most (unfrozen first). Guarantees nobody goes home with nothing.
 */
export const christmasMiracle = (roster: Player[]) => {
  const players = clonePlayers(roster);
  const transfers: { from: number; to: number }[] = [];
  for (let guard = 0; guard < players.length; guard += 1) {
    const emptyIdx = players.findIndex((p) => p.packages.length === 0);
    if (emptyIdx === -1) break;
    const score = (p: Player) => unlockedOf(p).length * 100 + p.packages.length;
    let richIdx = -1;
    players.forEach((p, i) => {
      if (p.packages.length >= 2 && (richIdx === -1 || score(p) > score(players[richIdx]))) richIdx = i;
    });
    if (richIdx === -1) break;
    const rich = players[richIdx];
    const gift = pickRandom(unlockedOf(rich)) ?? rich.packages[0];
    rich.packages = without(rich.packages, gift);
    players[emptyIdx].packages.push({ ...gift, locked: false });
    transfers.push({ from: richIdx, to: emptyIdx });
  }
  return { players, transfers };
};
