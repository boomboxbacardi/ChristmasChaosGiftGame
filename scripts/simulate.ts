/**
 * Plays thousands of instant games to check the gift balance.
 * Usage: pnpm simulate [players=15] [gifts=30] [games=5000]
 */
import { simulateGame } from "../src/game/rules";

const [players = 15, gifts = 30, games = 5000] = process.argv.slice(2).map(Number);

const pct = (n: number) => `${((n / games) * 100).toFixed(1)}%`;
const hist = new Map<number, number>();
let emptyGames = 0;
let emptyPlayers = 0;
let miracleGames = 0;
let maxSeen = 0;
let maxSum = 0;
let minSum = 0;
let turns = 0;
const maxHist = new Map<number, number>();
const rolls: Record<string, number> = {};
let extraRounds = 0;
let forcedTotal = 0;
let warmupMax = 0;

for (let g = 0; g < games; g += 1) {
  const r = simulateGame(players, gifts);
  turns += r.turns;
  if (r.extraRound) extraRounds += 1;
  forcedTotal += r.forced;
  warmupMax = Math.max(warmupMax, r.warmupTurns);
  const sum = r.final.reduce((a, b) => a + b, 0);
  if (sum !== gifts) throw new Error(`Gift count drifted: ${sum} != ${gifts}`);
  const empties = r.beforeMiracle.filter((c) => c === 0).length;
  if (empties) emptyGames += 1;
  emptyPlayers += empties;
  if (r.miracles) miracleGames += 1;
  const max = Math.max(...r.final);
  maxSeen = Math.max(maxSeen, max);
  maxSum += max;
  minSum += Math.min(...r.final);
  maxHist.set(max, (maxHist.get(max) ?? 0) + 1);
  for (const c of r.final) hist.set(c, (hist.get(c) ?? 0) + 1);
  for (const [k, v] of Object.entries(r.rollCounts)) rolls[k] = (rolls[k] ?? 0) + v;
}

console.log(`\n${games} games · ${players} players · ${gifts} gifts`);
console.log(`avg turns/game: ${(turns / games).toFixed(1)}`);
console.log(`phase 1: pile NOT empty after everyone's rolls (extra round): ${pct(extraRounds)} · longest phase 1: ${warmupMax} rolls (limit ${players * 3})`);
console.log(`phase 1: avg forced pile draws per game: ${(forcedTotal / games).toFixed(2)}`);
console.log(`games where someone ended empty before the miracle: ${pct(emptyGames)} (avg ${(emptyPlayers / games).toFixed(2)} players)`);
console.log(`games that needed the Christmas Miracle: ${pct(miracleGames)}`);
console.log(`avg min/max per game: ${(minSum / games).toFixed(2)} / ${(maxSum / games).toFixed(2)} · worst hoard: ${maxSeen}`);
console.log("\nfinal gifts per player:");
const total = games * players;
for (const k of [...hist.keys()].sort((a, b) => a - b)) {
  const share = (hist.get(k) ?? 0) / total;
  console.log(`${String(k).padStart(3)} │ ${"█".repeat(Math.round(share * 60)).padEnd(60)} ${(share * 100).toFixed(1)}%`);
}
console.log("\nbiggest hoard per game:");
for (const k of [...maxHist.keys()].sort((a, b) => a - b)) {
  console.log(`${String(k).padStart(3)} │ ${pct(maxHist.get(k) ?? 0)}`);
}
if (process.env.ROLLS) console.log(rolls);
