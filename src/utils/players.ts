import type { Player } from "../types/game";

export const clonePlayers = (players: Player[]) =>
  players.map((p) => ({
    ...p,
    packages: p.packages.map((pkg) => ({ ...pkg })),
  }));

export const giftCounts = (players: Player[]) =>
  Object.fromEntries(players.map((p) => [p.id, p.packages.length]));

/** Pick an index from `weights` proportionally to its weight. */
export const pickWeighted = (weights: number[]) => {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) return Math.floor(Math.random() * weights.length);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= Math.max(0, weights[i]);
    if (roll < 0) return i;
  }
  return weights.length - 1;
};

/** A stable hue per name so every player gets their own colour. */
export const nameHue = (name: string) => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => [...part][0]?.toUpperCase() ?? "")
    .join("");
