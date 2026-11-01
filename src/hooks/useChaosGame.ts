import { useCallback, useEffect, useRef, useState } from "react";
import { type ActionTargets, applyRoll } from "../game/actions";
import { defaultPlayerNames, uid } from "../game/engine";
import { shuffle, shuffleSeats } from "../game/seating";
import { type Lang, detectBrowserLang, possessive, tr } from "../constants/messages";
import {
  ENDGAME_ROLLS,
  PACKAGES_PER_PLAYER,
  WARMUP_ROLLS,
  getPhaseTable,
} from "../constants/tables";
import type { ActionResult, GamePhase, LogEntry, Message, Player } from "../types/game";
import { emitFx } from "../utils/fx";
import { giftCounts, pickWeighted } from "../utils/players";
import { brakingDurations, buildSpinPath, runPath, wait } from "../utils/sequence";
import { readJson, removeKey, writeJson } from "../utils/storage";
import { useSound } from "./useSound";

const STORAGE_KEY = "christmas-chaos-v2";
const SETTINGS_KEY = "christmas-chaos-settings";
const MAX_NAME = 24;
const MAX_PLAYERS = 24;

export type SetupStep = "players" | "seating";
export type Stage = "idle" | "spinning" | "targeting" | "result";

type SavedGame = {
  phase: GamePhase;
  players: Player[];
  pile: number;
  current: number;
  rolls: Record<string, number>;
  warmupTaken: Record<string, number>;
  log: LogEntry[];
  result: ActionResult | null;
  setupNames: string[];
  setupPile: number;
  pileTouched: boolean;
  setupStep: SetupStep;
  seatOrder: string[];
};

type Settings = { lang: Lang; sound: boolean; turbo: boolean };

const suggestedPile = (count: number) => Math.max(1, count * PACKAGES_PER_PLAYER);

const cleanNames = (names: string[]) =>
  names.map((n) => n.trim().slice(0, MAX_NAME)).filter(Boolean);

/** Roll weights: keep "Double Grab" rarer, and favour Twist of Fate for empty hands. */
const rollWeight = (phase: GamePhase, roll: number, actor: Player, pile: number) => {
  if (phase === "warmup" && roll === 1) return pile >= 2 ? 1 : 0;
  if (phase === "warmup" && roll === 2) return 2;
  if (phase === "endgame" && roll === 6) return actor.packages.length ? 1 : 3;
  return 1;
};

const hasUnlocked = (p: Player) => p.packages.some((pkg) => !pkg.locked);
const unlockedCount = (p: Player) => p.packages.filter((pkg) => !pkg.locked).length;

/** Who can be hit by a roll, as seat sets with weights. */
const targetOptions = (phase: GamePhase, roll: number, players: Player[], actor: number) => {
  const others = players.map((p, idx) => ({ p, idx })).filter(({ idx }) => idx !== actor);
  const single = (list: { p: Player; idx: number }[], weight: (p: Player) => number) => ({
    kind: "single" as const,
    options: list.map(({ idx }) => [idx]),
    weights: list.map(({ p }) => weight(p)),
  });
  if (phase === "warmup") {
    if (roll === 3) return single(others, (p) => p.packages.length + 1);
    if (roll === 4) return single(others.filter(({ p }) => hasUnlocked(p)), (p) => p.packages.length + 1);
    return null;
  }
  if (roll === 2) return single(others.filter(({ p }) => hasUnlocked(p)), () => 1);
  if (roll === 3) return single(others, (p) => unlockedCount(p) + 1);
  if (roll === 5) return single(others, () => 1);
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
    return { kind: "pair" as const, options, weights };
  }
  return null;
};

const fxSound = {
  grab: "land",
  steal: "steal",
  give: "whoosh",
  freeze: "freeze",
  swap: "whoosh",
  rotate: "whoosh",
  calm: "tick",
} as const;

export const useChaosGame = () => {
  const [saved] = useState(() => readJson<SavedGame>(STORAGE_KEY));
  const [settings] = useState(() => readJson<Settings>(SETTINGS_KEY));

  // Settings
  const [lang, setLang] = useState<Lang>(settings?.lang ?? detectBrowserLang());
  const [sound, setSound] = useState(settings?.sound ?? true);
  const [turbo, setTurbo] = useState(settings?.turbo ?? false);
  const [debug, setDebug] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug")
  );
  const play = useSound(sound);

  // Setup
  const [names, setNames] = useState<string[]>(saved?.setupNames ?? defaultPlayerNames);
  const [setupPile, setSetupPileRaw] = useState(
    saved?.setupPile ?? suggestedPile(defaultPlayerNames.length)
  );
  const [pileTouched, setPileTouched] = useState(saved?.pileTouched ?? false);
  const [setupStep, setSetupStep] = useState<SetupStep>(saved?.setupStep ?? "players");
  const [seatOrder, setSeatOrder] = useState<string[]>(saved?.seatOrder ?? []);
  const [isShufflingSeats, setIsShufflingSeats] = useState(false);
  const [starterSeat, setStarterSeat] = useState<number | null>(null);
  const [starterLocked, setStarterLocked] = useState(false);
  const [setupError, setSetupError] = useState<Message | null>(null);

  // Game
  const [phase, setPhase] = useState<GamePhase>(saved?.phase ?? "setup");
  const [players, setPlayers] = useState<Player[]>(saved?.players ?? []);
  const [pile, setPile] = useState(saved?.pile ?? 0);
  const [current, setCurrent] = useState(saved?.current ?? 0);
  const [rolls, setRolls] = useState<Record<string, number>>(saved?.rolls ?? {});
  const [warmupTaken, setWarmupTaken] = useState<Record<string, number>>(
    saved?.warmupTaken ?? {}
  );
  const [log, setLog] = useState<LogEntry[]>(saved?.log ?? []);
  const [result, setResult] = useState<ActionResult | null>(saved?.result ?? null);
  const [banner, setBanner] = useState<"endgame" | null>(null);
  const [showEnd, setShowEnd] = useState(saved?.phase === "ended");

  // Animation
  const [stage, setStage] = useState<Stage>(saved?.result ? "result" : "idle");
  const [highlightedRoll, setHighlightedRoll] = useState<number | null>(
    saved?.result?.roll || null
  );
  const [isFinal, setIsFinal] = useState(Boolean(saved?.result));
  const [targetSeats, setTargetSeats] = useState<number[]>([]);
  const [targetKind, setTargetKind] = useState<"single" | "pair">("single");
  const busyRef = useRef(false);
  const tokenRef = useRef(0);

  const speed = debug ? 0.15 : turbo ? 0.35 : 1;

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => tr(lang, key, params),
    [lang]
  );
  const tm = useCallback((msg: Message) => tr(lang, msg.key, msg.params), [lang]);

  // ---------- Persistence ----------
  useEffect(() => {
    writeJson(STORAGE_KEY, {
      phase,
      players,
      pile,
      current,
      rolls,
      warmupTaken,
      log: log.slice(0, 120),
      result,
      setupNames: names,
      setupPile,
      pileTouched,
      setupStep,
      seatOrder,
    } satisfies SavedGame);
  }, [
    phase,
    players,
    pile,
    current,
    rolls,
    warmupTaken,
    log,
    result,
    names,
    setupPile,
    pileTouched,
    setupStep,
    seatOrder,
  ]);

  useEffect(() => {
    writeJson(SETTINGS_KEY, { lang, sound, turbo } satisfies Settings);
    document.documentElement.lang = lang;
  }, [lang, sound, turbo]);

  // ---------- Setup ----------
  const applyNames = (next: string[]) => {
    setNames(next);
    setSetupError(null);
    if (!pileTouched) setSetupPileRaw(suggestedPile(cleanNames(next).length));
  };

  const addNames = (raw: string) => {
    const incoming = raw
      .split(/[,;\n\t]+/)
      .map((n) => n.trim().slice(0, MAX_NAME))
      .filter(Boolean);
    if (!incoming.length) return;
    applyNames([...names, ...incoming].slice(0, MAX_PLAYERS));
  };

  const renamePlayer = (idx: number, value: string) =>
    applyNames(names.map((n, i) => (i === idx ? value.slice(0, MAX_NAME) : n)));

  const removePlayer = (idx: number) => applyNames(names.filter((_, i) => i !== idx));

  const setSetupPile = (value: number) => {
    setPileTouched(true);
    setSetupError(null);
    setSetupPileRaw(Math.max(0, Math.min(999, Math.round(value) || 0)));
  };

  const applySuggestedPile = () => {
    setPileTouched(false);
    setSetupPileRaw(suggestedPile(cleanNames(names).length));
  };

  const validate = (): string[] | null => {
    const cleaned = cleanNames(names);
    if (cleaned.length < 2) {
      setSetupError({ key: "setup.error.few" });
      return null;
    }
    const seen = new Set<string>();
    for (const name of cleaned) {
      const key = name.toLowerCase();
      if (seen.has(key)) {
        setSetupError({ key: "setup.error.dupes", params: { name } });
        return null;
      }
      seen.add(key);
    }
    if (setupPile < 1) {
      setSetupError({ key: "setup.error.pile" });
      return null;
    }
    setSetupError(null);
    return cleaned;
  };

  const shuffleSeating = async () => {
    if (busyRef.current) return;
    const cleaned = validate();
    if (!cleaned) return;
    busyRef.current = true;
    const token = ++tokenRef.current;
    setNames(cleaned);
    setSetupStep("seating");
    setIsShufflingSeats(true);
    setStarterSeat(null);
    setStarterLocked(false);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
    const frames = 14;
    const durations = brakingDurations(frames, 1800 * speed);
    for (let i = 0; i < frames; i += 1) {
      if (tokenRef.current !== token) return;
      setSeatOrder(shuffle(cleaned));
      play("tick");
      await wait(durations[i]);
    }
    if (tokenRef.current !== token) return;
    setSeatOrder((prev) => shuffleSeats(cleaned, seatOrder.length ? seatOrder : prev));
    setIsShufflingSeats(false);
    play("land");
    emitFx({ kind: "grab" });
    busyRef.current = false;
  };

  const editPlayers = () => {
    if (busyRef.current) return;
    setSetupStep("players");
  };

  const startGame = async () => {
    if (busyRef.current || !seatOrder.length) return;
    busyRef.current = true;
    const token = ++tokenRef.current;
    const count = seatOrder.length;
    const starter = Math.floor(Math.random() * count);
    const hops = count * 2 + ((starter - 0 + count) % count);
    const path = Array.from({ length: hops + 1 }, (_, i) => i % count);
    const ok = await runPath(
      path,
      brakingDurations(path.length, 2600 * speed),
      (seat) => {
        setStarterSeat(seat);
        play("tick");
      },
      () => tokenRef.current !== token
    );
    if (!ok) return;
    setStarterLocked(true);
    play("land");
    await wait(1400 * speed);
    if (tokenRef.current !== token) return;

    const roster: Player[] = seatOrder.map((name) => ({ id: uid(), name, packages: [] }));
    setPlayers(roster);
    setPile(setupPile);
    setCurrent(starter);
    setRolls(Object.fromEntries(roster.map((p) => [p.id, WARMUP_ROLLS])));
    setWarmupTaken(Object.fromEntries(roster.map((p) => [p.id, 0])));
    setLog([{ id: uid(), key: "log.start", params: { name: roster[starter].name }, phase: "warmup" }]);
    setResult(null);
    setStage("idle");
    setHighlightedRoll(null);
    setIsFinal(false);
    setTargetSeats([]);
    setBanner(null);
    setShowEnd(false);
    setPhase("warmup");
    setStarterSeat(null);
    setStarterLocked(false);
    emitFx({ kind: "start" });
    play("fanfare");
    busyRef.current = false;
  };

  // ---------- Game ----------
  const rollTargets = async (
    rollPhase: GamePhase,
    roll: number,
    actor: number,
    isCancelled: () => boolean
  ): Promise<ActionTargets | null> => {
    const spec = targetOptions(rollPhase, roll, players, actor);
    if (!spec || !spec.options.length) return {};
    const finalIdx = pickWeighted(spec.weights);
    setTargetKind(spec.kind);
    setStage("targeting");
    if (spec.options.length > 1) {
      const indices = spec.options.map((_, i) => i);
      const path = buildSpinPath(indices, finalIdx, Math.max(16, Math.min(40, indices.length * 4)));
      const ok = await runPath(
        path,
        brakingDurations(path.length, 2600 * speed),
        (i) => {
          setTargetSeats(spec.options[i]);
          play("tick");
        },
        isCancelled
      );
      if (!ok) return null;
    }
    setTargetSeats(spec.options[finalIdx]);
    play("land");
    await wait(650 * speed);
    if (isCancelled()) return null;
    const picked = spec.options[finalIdx];
    return spec.kind === "pair" ? { pair: [picked[0], picked[1]] } : { target: picked[0] };
  };

  const roll = async (forced?: number) => {
    if (busyRef.current || banner) return;
    if (phase !== "warmup" && phase !== "endgame") return;
    const actor = players[current];
    if (!actor) return;
    const isForced = forced !== undefined && debug;
    if (!isForced && (rolls[actor.id] ?? 0) <= 0) return;

    busyRef.current = true;
    const token = ++tokenRef.current;
    const isCancelled = () => tokenRef.current !== token;
    const rollPhase = phase;

    setResult(null);
    setTargetSeats([]);
    setIsFinal(false);

    const table = getPhaseTable(rollPhase);
    const available = Object.keys(table)
      .map(Number)
      .filter((r) => {
        const req = table[r].requires;
        return (!req || req(current, players, pile)) && rollWeight(rollPhase, r, actor, pile) > 0;
      });

    let chosen = 0;
    if (isForced) {
      chosen = forced;
      setHighlightedRoll(chosen);
      setIsFinal(true);
    } else if (available.length) {
      chosen = available[pickWeighted(available.map((r) => rollWeight(rollPhase, r, actor, pile)))];
      setStage("spinning");
      const path = buildSpinPath(available, chosen, Math.max(14, available.length * 4));
      const ok = await runPath(
        path,
        brakingDurations(path.length, 3000 * speed),
        (r) => {
          setHighlightedRoll(r);
          play("tick");
        },
        isCancelled
      );
      if (!ok) return;
      setIsFinal(true);
      play("land");
      await wait(700 * speed);
      if (isCancelled()) return;
    } else {
      setHighlightedRoll(null);
    }

    const targets = chosen ? await rollTargets(rollPhase, chosen, current, isCancelled) : {};
    if (targets === null) return;

    const outcome = applyRoll(rollPhase, chosen, players, pile, current, targets);

    const before = giftCounts(players);
    const after = giftCounts(outcome.players);
    const deltas: Record<string, number> = {};
    for (const id of Object.keys(after)) {
      const diff = after[id] - (before[id] ?? 0);
      if (diff) deltas[id] = diff;
    }

    const nextRolls = { ...rolls };
    const nextTaken = { ...warmupTaken };
    if (!isForced) {
      nextRolls[actor.id] = Math.max(0, (nextRolls[actor.id] ?? 0) - 1);
      if (rollPhase === "warmup") nextTaken[actor.id] = (nextTaken[actor.id] ?? 0) + 1;
    }

    let nextPhase: GamePhase = rollPhase;
    let finalRolls = nextRolls;
    const extraLog: Message[] = [];
    const remaining = Object.values(nextRolls).reduce((sum, v) => sum + v, 0);

    if (rollPhase === "warmup") {
      const everyoneDone = outcome.players.every((p) => (nextTaken[p.id] ?? 0) >= WARMUP_ROLLS);
      if (outcome.pile <= 0 && everyoneDone) {
        nextPhase = "endgame";
        finalRolls = Object.fromEntries(outcome.players.map((p) => [p.id, ENDGAME_ROLLS]));
        extraLog.push({ key: "log.endgameBegins", params: { rolls: ENDGAME_ROLLS } });
      } else if (remaining === 0) {
        if (outcome.pile > 0) {
          finalRolls = Object.fromEntries(outcome.players.map((p) => [p.id, 1]));
          extraLog.push({ key: "log.extraRound" });
        } else {
          finalRolls = Object.fromEntries(
            outcome.players.map((p) => [p.id, Math.max(0, WARMUP_ROLLS - (nextTaken[p.id] ?? 0))])
          );
        }
      }
    } else if (remaining === 0) {
      nextPhase = "ended";
    }

    let nextIdx = current;
    if (nextPhase !== "ended") {
      for (let i = 1; i <= outcome.players.length; i += 1) {
        const idx = (current + i) % outcome.players.length;
        if ((finalRolls[outcome.players[idx].id] ?? 0) > 0) {
          nextIdx = idx;
          break;
        }
      }
    }

    const newEntries: LogEntry[] = [
      ...extraLog.map((m) => ({ ...m, id: uid(), phase: nextPhase })),
      ...outcome.log.map((m) => ({ ...m, id: uid(), phase: rollPhase })),
    ];

    setPlayers(outcome.players);
    setPile(outcome.pile);
    setRolls(finalRolls);
    setWarmupTaken(nextTaken);
    setLog((prev) => [...newEntries, ...prev].slice(0, 120));
    setCurrent(nextIdx);
    setTargetSeats([]);
    setResult({
      roll: chosen,
      phase: rollPhase,
      narrative: outcome.narrative,
      fx: outcome.fx,
      seats: outcome.seats,
      direction: outcome.direction,
      deltas,
      key: Date.now(),
    });
    setStage("result");
    emitFx({ kind: outcome.fx });
    play(fxSound[outcome.fx]);

    if (nextPhase !== rollPhase) {
      setPhase(nextPhase);
      if (nextPhase === "endgame") {
        setHighlightedRoll(null);
        setIsFinal(false);
        await wait(900 * speed);
        if (isCancelled()) return;
        setBanner("endgame");
        emitFx({ kind: "endgame" });
        play("boom");
      } else if (nextPhase === "ended") {
        await wait(1800 * speed);
        if (isCancelled()) return;
        setShowEnd(true);
        emitFx({ kind: "victory" });
        play("fanfare");
      }
    }
    busyRef.current = false;
  };

  const dismissBanner = () => setBanner(null);

  const newGame = (toStep: SetupStep = "players") => {
    tokenRef.current += 1;
    busyRef.current = false;
    if (players.length) setNames(players.map((p) => p.name));
    setPhase("setup");
    setPlayers([]);
    setPile(0);
    setCurrent(0);
    setRolls({});
    setWarmupTaken({});
    setLog([]);
    setResult(null);
    setBanner(null);
    setShowEnd(false);
    setStage("idle");
    setHighlightedRoll(null);
    setIsFinal(false);
    setTargetSeats([]);
    setIsShufflingSeats(false);
    setStarterSeat(null);
    setStarterLocked(false);
    setSetupStep(toStep);
    if (toStep === "players") removeKey(STORAGE_KEY);
  };

  const playAgain = () => {
    newGame("seating");
    // Re-shuffle so the same crew gets new neighbours.
    setTimeout(() => void shuffleSeating(), 50);
  };

  const debugSkipPhase = () => {
    if (!debug || busyRef.current) return;
    if (phase === "warmup") {
      setPile(0);
      setPhase("endgame");
      setRolls(Object.fromEntries(players.map((p) => [p.id, ENDGAME_ROLLS])));
      setHighlightedRoll(null);
      setBanner("endgame");
    } else if (phase === "endgame") {
      setRolls(Object.fromEntries(players.map((p) => [p.id, 0])));
      setPhase("ended");
      setShowEnd(true);
    }
  };

  const currentPlayer = players[current] ?? null;
  const currentRolls = currentPlayer ? (rolls[currentPlayer.id] ?? 0) : 0;
  const isBusy = stage === "spinning" || stage === "targeting";
  const canRoll =
    (phase === "warmup" || phase === "endgame") &&
    !isBusy &&
    !banner &&
    Boolean(currentPlayer) &&
    currentRolls > 0;
  const totalRolls = Object.values(rolls).reduce((sum, v) => sum + v, 0);

  return {
    // i18n
    lang,
    setLang,
    t,
    tm,
    possessive: (name: string) => possessive(lang, name),
    // settings
    sound,
    setSound,
    turbo,
    setTurbo,
    debug,
    setDebug,
    // setup
    names,
    addNames,
    renamePlayer,
    removePlayer,
    setupPile,
    setSetupPile,
    pileTouched,
    applySuggestedPile,
    suggestedPile: suggestedPile(cleanNames(names).length),
    setupStep,
    setupError,
    seatOrder,
    isShufflingSeats,
    shuffleSeating,
    editPlayers,
    startGame,
    starterSeat,
    starterLocked,
    maxPlayers: MAX_PLAYERS,
    // game
    phase,
    players,
    pile,
    current,
    currentPlayer,
    currentRolls,
    rolls,
    totalRolls,
    log,
    result,
    banner,
    dismissBanner,
    showEnd,
    setShowEnd,
    stage,
    highlightedRoll,
    isFinal,
    targetSeats,
    targetKind,
    canRoll,
    isBusy,
    roll,
    newGame,
    playAgain,
    debugSkipPhase,
  };
};

export type ChaosGame = ReturnType<typeof useChaosGame>;
