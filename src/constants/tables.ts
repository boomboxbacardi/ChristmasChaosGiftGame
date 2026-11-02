import { oppositeOf } from "../game/seating";
import { possibleWildcards } from "../game/wildcards";
import type { GamePhase, Player } from "../types/game";

export type ActionInfo = {
  emoji: string;
  /** Whether the action can do anything right now. */
  requires?: (playerIndex: number, players: Player[], pileCount?: number) => boolean;
};

export type ActionTable = Record<number, ActionInfo>;

export const WARMUP_ROLLS = 3;
export const ENDGAME_ROLLS = 3;
export const PACKAGES_PER_PLAYER = 2;

const hasGifts = (p?: Player) => Boolean(p?.packages.length);
const hasUnlocked = (p?: Player) => Boolean(p?.packages.some((pkg) => !pkg.locked));
const anyUnlocked = (players: Player[]) => players.some(hasUnlocked);
const othersUnlocked = (idx: number, players: Player[]) =>
  players.some((p, i) => i !== idx && hasUnlocked(p));
const opposite = (idx: number, players: Player[]) =>
  players[oppositeOf(idx, players.length)];

export const warmupTable: ActionTable = {
  1: { emoji: "🎁🎁", requires: (_i, _p, pile) => (pile ?? 0) >= 2 },
  2: { emoji: "🎁", requires: (_i, _p, pile) => (pile ?? 0) >= 1 },
  3: { emoji: "🫴", requires: (i, players) => hasUnlocked(players[i]) },
  4: { emoji: "🥷", requires: othersUnlocked },
  5: { emoji: "🤏", requires: (_i, players) => anyUnlocked(players) },
  6: { emoji: "💪", requires: (_i, players) => anyUnlocked(players) },
  7: {
    emoji: "↔️",
    requires: (i, players) =>
      players.length >= 3 && (hasUnlocked(players[i]) || hasUnlocked(opposite(i, players))),
  },
  8: {
    emoji: "🏃",
    requires: (i, players) => players.length >= 3 && hasUnlocked(players[i]),
  },
  9: { emoji: "⭐", requires: (i, players) => possibleWildcards("warmup", players, i).length > 0 },
};

export const endgameTable: ActionTable = {
  1: { emoji: "🧊", requires: (i, players) => hasUnlocked(players[i]) },
  2: { emoji: "🔄", requires: othersUnlocked },
  3: {
    emoji: "🗑️",
    requires: (i, players) => hasUnlocked(players[i]) && othersUnlocked(i, players),
  },
  4: {
    emoji: "🃏",
    requires: (_i, players) => players.filter(hasUnlocked).length >= 2,
  },
  5: { emoji: "🎅", requires: (i, players) => hasUnlocked(players[i]) },
  6: { emoji: "🌪️", requires: (_i, players) => anyUnlocked(players) },
  7: {
    emoji: "🏹",
    requires: (_i, players) => {
      const richest = Math.max(
        ...players.map((p) => p.packages.filter((pkg) => !pkg.locked).length)
      );
      const poorest = Math.min(...players.map((p) => p.packages.length));
      return richest - poorest >= 2;
    },
  },
  8: {
    emoji: "↔️",
    requires: (i, players) =>
      players.length >= 3 && (hasUnlocked(players[i]) || hasUnlocked(opposite(i, players))),
  },
  9: { emoji: "⭐", requires: (i, players) => possibleWildcards("endgame", players, i).length > 0 },
};

export const getPhaseTable = (phase: GamePhase) =>
  phase === "warmup" ? warmupTable : endgameTable;

export { hasGifts };
