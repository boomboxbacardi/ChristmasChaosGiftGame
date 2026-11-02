import type { Direction, Player } from "../types/game";

/**
 * Seats run clockwise around the table. Facing the middle of the table,
 * the clockwise neighbour sits on your left, so turns pass to the left.
 */
export const leftOf = (idx: number, count: number) => (idx + 1) % count;
export const rightOf = (idx: number, count: number) => (idx - 1 + count) % count;
export const neighbourOf = (idx: number, count: number, dir: Direction) =>
  dir === "left" ? leftOf(idx, count) : rightOf(idx, count);

/** Walk `steps` seats in a direction. */
export const seatAt = (idx: number, count: number, dir: Direction, steps = 1) =>
  dir === "left"
    ? (idx + steps) % count
    : (((idx - steps) % count) + count) % count;

/** The seat straight across the table. */
export const oppositeOf = (idx: number, count: number) =>
  (idx + Math.floor(count / 2)) % count;

export const shuffle = <T>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

/**
 * Shuffle names into seats, trying to avoid keeping anyone next to the same
 * neighbour they had before (so a re-roll actually feels like a re-roll).
 */
export const shuffleSeats = (names: string[], previous: string[] = []) => {
  if (names.length < 4 || previous.length !== names.length) return shuffle(names);
  const pairKey = (a: string, b: string) => [a, b].sort().join("\u0000");
  const oldPairs = new Set(
    previous.map((name, idx) => pairKey(name, previous[leftOf(idx, previous.length)]))
  );
  let best = shuffle(names);
  let bestScore = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = shuffle(names);
    const score = candidate.filter((name, idx) =>
      oldPairs.has(pairKey(name, candidate[leftOf(idx, candidate.length)]))
    ).length;
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
    if (score === 0) break;
  }
  return best;
};

/** Angle in degrees for a seat, starting at the top and going clockwise. */
export const seatAngle = (idx: number, count: number) => (360 / count) * idx - 90;

export const seatPosition = (idx: number, count: number, radius = 42) => {
  const rad = (seatAngle(idx, count) * Math.PI) / 180;
  return { x: 50 + Math.cos(rad) * radius, y: 50 + Math.sin(rad) * radius };
};

export const neighbourNames = (players: Pick<Player, "name">[], idx: number) => ({
  left: players[leftOf(idx, players.length)]?.name ?? "",
  right: players[rightOf(idx, players.length)]?.name ?? "",
});
