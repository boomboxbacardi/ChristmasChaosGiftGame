import { ENDGAME_ROLLS, WARMUP_ROLLS, getPhaseTable } from "../constants/tables";
import type { GamePhase, Message, Player } from "../types/game";
import { giftCounts, pickWeighted } from "../utils/players";
import {
  type ActionOutcome,
  type ActionTargets,
  WILD_ROLL,
  applyRoll,
  christmasMiracle,
  rollExtras,
} from "./actions";
import { type WildId, possibleWildcards } from "./wildcards";
import { uid } from "./engine";

/** Everything needed to resolve the next turn. */
export type GameState = {
  phase: GamePhase;
  players: Player[];
  pile: number;
  current: number;
  rolls: Record<string, number>;
  warmupTaken: Record<string, number>;
};

const hasUnlocked = (p: Player) => p.packages.some((pkg) => !pkg.locked);
const unlockedCount = (p: Player) => p.packages.filter((pkg) => !pkg.locked).length;

/**
 * How likely each action is. Tuned with `pnpm simulate` so a table of 15 with
 * 30 gifts ends with everyone holding something and nobody hoarding.
 */
export const rollWeight = (phase: GamePhase, roll: number, actor: Player, pile: number) => {
  const held = actor.packages.length;
  if (roll === WILD_ROLL) return 1.1;
  if (phase === "warmup") {
    // Greedy grabs keep it spicy, but hoarders grab less and empty hands grab more.
    if (roll === 1) return pile >= 2 ? (held >= 4 ? 0.6 : 1.6) : 0;
    if (roll === 2) return held === 0 ? 3 : held >= 4 ? 1 : 2;
    if (roll === 3) return held >= 4 ? 2 : 1;
    if (roll === 5 || roll === 6) return 0.85;
    return 1;
  }
  if (roll === 2) return 1.3;
  if (roll === 5) return held >= 4 ? 1.5 : 1;
  if (roll === 6) return held ? 1 : 2.5;
  if (roll === 7) return 1;
  return 1;
};

export type TargetSpec = { kind: "single" | "pair"; options: number[][]; weights: number[] };

/** Who can be hit by a roll, as seat sets with weights. */
export const targetOptions = (
  phase: GamePhase,
  roll: number,
  players: Player[],
  actor: number,
  wild?: WildId
): TargetSpec | null => {
  const others = players.map((p, idx) => ({ p, idx })).filter(({ idx }) => idx !== actor);
  const most = Math.max(...players.map((p) => p.packages.length));
  const single = (list: { p: Player; idx: number }[], weight: (p: Player) => number): TargetSpec => ({
    kind: "single",
    options: list.map(({ idx }) => [idx]),
    weights: list.map(({ p }) => weight(p)),
  });
  // Gifts tend to land with the poor and get stolen from the rich.
  const towardsPoor = (p: Player) => most - p.packages.length + 1;
  const fromRich = (p: Player) => p.packages.length ** 1.5;

  if (roll === WILD_ROLL) {
    if (wild === "blindfold") return single(others.filter(({ p }) => hasUnlocked(p)), fromRich);
    if (wild === "jackpot") return single(players.map((p, idx) => ({ p, idx })), () => 1);
    if (wild === "seatSwap") {
      const options: number[][] = [];
      for (let a = 0; a < players.length; a += 1) {
        for (let b = a + 1; b < players.length; b += 1) options.push([a, b]);
      }
      return { kind: "pair", options, weights: options.map(() => 1) };
    }
    return null;
  }

  if (phase === "warmup") {
    if (roll === 3) return single(others, towardsPoor);
    if (roll === 4) return single(others.filter(({ p }) => hasUnlocked(p)), fromRich);
    return null;
  }
  if (roll === 2) return single(others.filter(({ p }) => hasUnlocked(p)), () => 1);
  if (roll === 3) return single(others, (p) => unlockedCount(p) + 1);
  if (roll === 5) return single(others, towardsPoor);
  if (roll === 4) {
    const options: number[][] = [];
    const weights: number[] = [];
    for (let a = 0; a < players.length; a += 1) {
      for (let b = a + 1; b < players.length; b += 1) {
        if (!hasUnlocked(players[a]) && !hasUnlocked(players[b])) continue;
        options.push([a, b]);
        weights.push((players[a].packages.length + 1) * (players[b].packages.length + 1));
      }
    }
    return { kind: "pair", options, weights };
  }
  return null;
};

/** Actions that may be rolled right now. */
export const availableRolls = (state: GameState) => {
  const actor = state.players[state.current];
  const table = getPhaseTable(state.phase);
  return Object.keys(table)
    .map(Number)
    .filter((r) => {
      const req = table[r].requires;
      return (
        (!req || req(state.current, state.players, state.pile)) &&
        rollWeight(state.phase, r, actor, state.pile) > 0
      );
    });
};

export const pickRoll = (state: GameState, available = availableRolls(state)) => {
  if (!available.length) return 0;
  const actor = state.players[state.current];
  return available[
    pickWeighted(available.map((r) => rollWeight(state.phase, r, actor, state.pile)))
  ];
};

/** Spin the wildcard wheel. */
export const pickWild = (phase: GamePhase, players: Player[], actor: number): WildId | undefined => {
  const pool = possibleWildcards(phase, players, actor);
  if (!pool.length) return undefined;
  return pool[pickWeighted(pool.map((w) => w.weight))].id;
};

export const pickTargets = (spec: TargetSpec | null): { targets: ActionTargets; index: number } => {
  if (!spec || !spec.options.length) return { targets: {}, index: -1 };
  const index = pickWeighted(spec.weights);
  const picked = spec.options[index];
  return {
    index,
    targets: spec.kind === "pair" ? { pair: [picked[0], picked[1]] } : { target: picked[0] },
  };
};

export type TurnResult = {
  state: GameState;
  outcome: ActionOutcome;
  deltas: Record<string, number>;
  log: Message[];
  phaseChanged: boolean;
};

/** Apply a roll and move the game forward: rolls, phase changes and whose turn it is. */
export const resolveTurn = (
  state: GameState,
  roll: number,
  targets: ActionTargets,
  { free = false } = {}
): TurnResult => {
  const { phase, players, pile, current } = state;
  const actor = players[current];
  const extras = roll ? rollExtras(phase, roll, players, current, targets.wild) : {};
  const outcome = applyRoll(phase, roll, players, pile, current, { ...extras, ...targets });

  const before = giftCounts(players);
  const after = giftCounts(outcome.players);
  const deltas: Record<string, number> = {};
  for (const id of Object.keys(after)) {
    const diff = after[id] - (before[id] ?? 0);
    if (diff) deltas[id] = diff;
  }

  const rolls = { ...state.rolls };
  const warmupTaken = { ...state.warmupTaken };
  if (!free) {
    rolls[actor.id] = Math.max(0, (rolls[actor.id] ?? 0) - 1);
    if (phase === "warmup") warmupTaken[actor.id] = (warmupTaken[actor.id] ?? 0) + 1;
  }

  let nextPhase: GamePhase = phase;
  let finalRolls = rolls;
  const log: Message[] = [...outcome.log];
  const remaining = Object.values(rolls).reduce((sum, v) => sum + v, 0);

  if (phase === "warmup") {
    const everyoneDone = outcome.players.every((p) => (warmupTaken[p.id] ?? 0) >= WARMUP_ROLLS);
    if (outcome.pile <= 0 && everyoneDone) {
      nextPhase = "endgame";
      finalRolls = Object.fromEntries(outcome.players.map((p) => [p.id, ENDGAME_ROLLS]));
      log.push({ key: "log.endgameBegins", params: { rolls: ENDGAME_ROLLS } });
    } else if (remaining === 0) {
      if (outcome.pile > 0) {
        finalRolls = Object.fromEntries(outcome.players.map((p) => [p.id, 1]));
        log.push({ key: "log.extraRound" });
      } else {
        finalRolls = Object.fromEntries(
          outcome.players.map((p) => [p.id, Math.max(0, WARMUP_ROLLS - (warmupTaken[p.id] ?? 0))])
        );
      }
    }
  } else if (remaining === 0) {
    nextPhase = "ended";
  }

  // Seats may have moved (wildcards), so find the actor again.
  const actorPos = Math.max(0, outcome.players.findIndex((p) => p.id === actor.id));
  const again = Boolean(outcome.extraRoll) && nextPhase === phase;
  if (again) finalRolls = { ...finalRolls, [actor.id]: (finalRolls[actor.id] ?? 0) + 1 };
  let nextIdx = actorPos;
  if (!again && nextPhase !== "ended") {
    for (let i = 1; i <= outcome.players.length; i += 1) {
      const idx = (actorPos + i) % outcome.players.length;
      if ((finalRolls[outcome.players[idx].id] ?? 0) > 0) {
        nextIdx = idx;
        break;
      }
    }
  }

  return {
    state: {
      phase: nextPhase,
      players: outcome.players,
      pile: outcome.pile,
      current: nextIdx,
      rolls: finalRolls,
      warmupTaken,
    },
    outcome,
    deltas,
    log,
    phaseChanged: nextPhase !== phase,
  };
};

export const newGameState = (names: string[], pile: number, starter = 0): GameState => {
  const players = names.map((name) => ({ id: uid(), name, packages: [] }));
  return {
    phase: "warmup",
    players,
    pile,
    current: starter,
    rolls: Object.fromEntries(players.map((p) => [p.id, WARMUP_ROLLS])),
    warmupTaken: Object.fromEntries(players.map((p) => [p.id, 0])),
  };
};

/** Play a whole game instantly. Used by `pnpm simulate` to tune the balance. */
export const simulateGame = (playerCount: number, pile: number) => {
  const names = Array.from({ length: playerCount }, (_, i) => `P${i + 1}`);
  let state = newGameState(names, pile, Math.floor(Math.random() * playerCount));
  let turns = 0;
  const rollCounts: Record<string, number> = {};
  while (state.phase !== "ended" && turns < 2000) {
    const roll = pickRoll(state);
    const wild = roll === WILD_ROLL ? pickWild(state.phase, state.players, state.current) : undefined;
    const { targets } = pickTargets(
      targetOptions(state.phase, roll, state.players, state.current, wild)
    );
    if (wild) rollCounts[`wild.${wild}`] = (rollCounts[`wild.${wild}`] ?? 0) + 1;
    rollCounts[`${state.phase}.${roll}`] = (rollCounts[`${state.phase}.${roll}`] ?? 0) + 1;
    state = resolveTurn(state, roll, { ...targets, wild }).state;
    turns += 1;
  }
  const beforeMiracle = state.players.map((p) => p.packages.length);
  const miracle = christmasMiracle(state.players);
  return {
    turns,
    beforeMiracle,
    final: miracle.players.map((p) => p.packages.length),
    miracles: miracle.transfers.length,
    rollCounts,
  };
};
