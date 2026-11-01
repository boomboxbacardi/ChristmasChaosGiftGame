export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Build a "slot machine" path that hops between candidates and lands on
 * `final`, never showing the same candidate twice in a row.
 */
export const buildSpinPath = (candidates: number[], final: number, hops: number) => {
  if (candidates.length <= 1) return [final];
  const path: number[] = [];
  let prev: number | undefined;
  for (let i = 0; i < hops; i += 1) {
    let pick = candidates[Math.floor(Math.random() * candidates.length)];
    while (pick === prev) pick = candidates[Math.floor(Math.random() * candidates.length)];
    path.push(pick);
    prev = pick;
  }
  if (path[path.length - 1] === final) path.pop();
  path.push(final);
  return path;
};

/** Step durations that start fast and brake hard at the end, scaled to `totalMs`. */
export const brakingDurations = (length: number, totalMs: number) => {
  const raw = Array.from({ length }, (_, idx) => {
    const t = length === 1 ? 1 : idx / (length - 1);
    return 40 + 420 * easeOutCubic(t) ** 3;
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((value) => (value / sum) * totalMs);
};

/** Walk a path, calling `onStep` for each entry, using the given durations. */
export const runPath = async <T>(
  path: T[],
  durations: number[],
  onStep: (value: T, idx: number) => void,
  isCancelled: () => boolean = () => false
) => {
  for (let idx = 0; idx < path.length; idx += 1) {
    if (isCancelled()) return false;
    onStep(path[idx], idx);
    await wait(durations[idx] ?? 0);
  }
  return !isCancelled();
};
