import { GamePhase, Player } from "../types/game";

type ActionTable = Record<
  number,
  {
    title: string;
    description: string;
    requires?: (
      playerIndex: number,
      players: Player[],
      pileCount?: number
    ) => boolean;
  }
>;

export const WARMUP_ROLLS = 3;
export const ENDGAME_ROLLS = 3;
export const PACKAGES_PER_PLAYER = 2;
export const warmupTable: ActionTable = {
  1: {
    title: "Double Grab",
    description: "Take two gifts from the pile.",
    requires: (_playerIndex, _players, pile) => (pile ?? 0) >= 2,
  },
  2: {
    title: "Single Grab",
    description: "Take one gift from the pile.",
    requires: (_playerIndex, _players, pile) => (pile ?? 0) >= 1,
  },
  3: {
    title: "Forced Tribute",
    description: "Give one of your gifts to a random player.",
    requires: (playerIndex, players) =>
      players[playerIndex].packages.length > 0,
  },
  4: {
    title: "The Grinch Tax",
    description: "Steal one unlocked gift from a random player.",
    requires: (playerIndex, players) => {
      const otherPlayers = players.filter((_, idx) => idx !== playerIndex);
      return otherPlayers.some((player) =>
        player.packages.some((pkg) => !pkg.locked)
      );
    },
  },
  5: {
    title: "Tiny Toss Right",
    description: "Send your smallest gift to the right.",
    requires: (_playerIndex, players) =>
      players.some((player) => player.packages.length > 0),
  },
  6: {
    title: "Mega Move Left",
    description: "Send your largest gift to the left.",
    requires: (_playerIndex, players) =>
      players.some((player) => player.packages.length > 0),
  },
};

export const endgameTable: ActionTable = {
  1: {
    title: "Ice Lock",
    description:
      "Freeze one of your gifts. Frozen gifts can’t be traded, stolen, given away, or rotated.",
    requires: (playerIndex, players) =>
      players[playerIndex].packages.some((pkg) => !pkg.locked),
  },
  2: {
    title: "Full Flip",
    description:
      "Swap all unlocked gifts with a random player. Frozen gifts stay put.",
    requires: (playerIndex, players) =>
      players.some(
        (p, idx) => idx !== playerIndex && p.packages.some((pkg) => !pkg.locked)
      ),
  },
  3: {
    title: "Trash Trade",
    description:
      "Trade unlocked gifts with a random player. Frozen gifts never move.",
    requires: (playerIndex, players) =>
      players[playerIndex].packages.some((pkg) => !pkg.locked) &&
      players.some(
        (p, idx) => idx !== playerIndex && p.packages.some((pkg) => !pkg.locked)
      ),
  },
  4: {
    title: "Joker Swap",
    description:
      "Two random players each choose an unlocked gift from the other to swap.",
    requires: (_playerIndex, players) =>
      players.filter((p) => p.packages.some((pkg) => !pkg.locked)).length >= 2,
  },
  5: {
    title: "Santa's Hand",
    description: "Give away an unlocked gift picked by another random player.",
    requires: (playerIndex, players) =>
      players[playerIndex].packages.some((pkg) => !pkg.locked),
  },
  6: {
    title: "Twist of Fate",
    description:
      "Everyone rotates unlocked gifts one step left or right at random.",
    requires: (_playerIndex, players) =>
      players.some((player) => player.packages.some((pkg) => !pkg.locked)),
  },
};

export const getPhaseTable = (phase: GamePhase) =>
  phase === "warmup" ? warmupTable : endgameTable;
