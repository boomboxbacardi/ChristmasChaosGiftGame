import type { Direction, FxKind, GamePhase, Message, Package, Player } from "../types/game";
import { clonePlayers } from "../utils/players";
import { uid } from "./engine";
import { neighbourOf } from "./seating";

export type ActionOutcome = {
  players: Player[];
  pile: number;
  log: Message[];
  narrative: Message;
  fx: FxKind;
  seats: number[];
  direction?: Direction;
};

export type ActionTargets = {
  /** Seat index of the other player picked by the target roll. */
  target?: number;
  /** Two seat indices picked for Joker Swap. */
  pair?: [number, number];
  direction?: Direction;
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

/** Everyone simultaneously sends one unlocked gift to their neighbour. */
const passOneGift = (
  players: Player[],
  dir: Direction,
  pick: (unlocked: Package[]) => Package | undefined
) => {
  const next = clonePlayers(players);
  const outgoing = next.map((p) => pick(unlockedOf(p)));
  outgoing.forEach((gift, idx) => {
    if (!gift) return;
    next[idx].packages = without(next[idx].packages, gift);
  });
  outgoing.forEach((gift, idx) => {
    if (!gift) return;
    next[neighbourOf(idx, next.length, dir)].packages.push(gift);
  });
  return next;
};

/** Everyone passes ALL unlocked gifts to their neighbour; frozen gifts stay. */
const rotateUnlocked = (players: Player[], dir: Direction) => {
  const next = clonePlayers(players);
  const pools = next.map(unlockedOf);
  next.forEach((p) => {
    p.packages = lockedOf(p);
  });
  pools.forEach((pool, idx) => {
    next[neighbourOf(idx, next.length, dir)].packages.push(...pool);
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

const calm = (players: Player[], pile: number, actor: number): ActionOutcome => ({
  players,
  pile,
  log: [{ key: "log.calm", params: { actor: players[actor]?.name ?? "" } }],
  narrative: { key: "narr.calm", params: { actor: players[actor]?.name ?? "" } },
  fx: "calm",
  seats: [actor],
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

  if (roll === 3) {
    const targetIdx = targets.target ?? pickRandom(otherSeats(players, actorIdx));
    const target = targetIdx !== undefined ? players[targetIdx] : undefined;
    if (!target || targetIdx === undefined || !moveOne(actor, target)) {
      return calm(players, pile, actorIdx);
    }
    const params = { actor: name, target: target.name };
    return {
      players,
      pile,
      log: [{ key: "log.warmup.3", params }],
      narrative: { key: "narr.warmup.3", params },
      fx: "give",
      seats: [actorIdx, targetIdx],
    };
  }

  if (roll === 4) {
    const targetIdx =
      targets.target ?? pickRandom(otherSeats(players, actorIdx, hasUnlocked));
    const target = targetIdx !== undefined ? players[targetIdx] : undefined;
    if (!target || targetIdx === undefined || !moveOne(target, actor)) {
      return calm(players, pile, actorIdx);
    }
    const params = { actor: name, target: target.name };
    return {
      players,
      pile,
      log: [{ key: "log.warmup.4", params }],
      narrative: { key: "narr.warmup.4", params },
      fx: "steal",
      seats: [actorIdx, targetIdx],
    };
  }

  // 5: smallest to the right, 6: largest to the left.
  const direction: Direction = roll === 5 ? "right" : "left";
  const next = passOneGift(players, direction, (unlocked) =>
    roll === 5 ? unlocked[0] : unlocked[unlocked.length - 1]
  );
  return {
    players: next,
    pile,
    log: [{ key: `log.warmup.${roll}` }],
    narrative: { key: `narr.warmup.${roll}` },
    fx: "rotate",
    seats: [actorIdx],
    direction,
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

    let ok = true;
    if (roll === 2) {
      const mine = unlockedOf(actor);
      const theirs = unlockedOf(target);
      actor.packages = [...lockedOf(actor), ...theirs];
      target.packages = [...lockedOf(target), ...mine];
      ok = mine.length + theirs.length > 0;
    } else if (roll === 3) {
      ok = swapOne(actor, target);
    } else {
      ok = moveOne(actor, target);
    }
    if (!ok) return calm(players, pile, actorIdx);

    const params = { actor: name, target: target.name };
    return {
      players,
      pile,
      log: [{ key: `log.endgame.${roll}`, params }],
      narrative: { key: `narr.endgame.${roll}`, params },
      fx: roll === 5 ? "give" : "swap",
      seats: [actorIdx, targetIdx],
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
    };
  }

  const direction: Direction =
    targets.direction ?? (Math.random() > 0.5 ? "left" : "right");
  return {
    players: rotateUnlocked(players, direction),
    pile,
    log: [{ key: "log.endgame.6", params: { dir: direction } }],
    narrative: { key: "narr.endgame.6", params: { dir: direction } },
    fx: "rotate",
    seats: [actorIdx],
    direction,
  };
};

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
    : phase === "warmup"
      ? applyWarmupRoll(roll, roster, pile, actorIdx, targets)
      : applyEndgameRoll(roll, roster, pile, actorIdx, targets);
