import { useCallback, useEffect, useRef, useState } from "react";
import { type ActionTargets, WILD_ROLL, christmasMiracle } from "../game/actions";
import { type WildId, possibleWildcards } from "../game/wildcards";
import {
  type GameState,
  availableRolls,
  pickRoll,
  pickWild,
  pickTargets,
  resolveTurn,
  targetOptions,
} from "../game/rules";
import { defaultPlayerNames, uid } from "../game/engine";
import { shuffle, shuffleSeats } from "../game/seating";
import { type Lang, detectBrowserLang, possessive, tr } from "../constants/messages";
import {
  ENDGAME_ROLLS,
  PACKAGES_PER_PLAYER,
  WARMUP_ROLLS,
} from "../constants/tables";
import type { ActionResult, GamePhase, LogEntry, Message, Player } from "../types/game";
import { emitFx } from "../utils/fx";
import { giftCounts } from "../utils/players";
import { brakingDurations, buildSpinPath, runPath, wait } from "../utils/sequence";
import { readJson, removeKey, writeJson } from "../utils/storage";
import { useSound } from "./useSound";

const STORAGE_KEY = "christmas-chaos-v2";
const SETTINGS_KEY = "christmas-chaos-settings";
const MAX_NAME = 24;
const MAX_PLAYERS = 24;

export type SetupStep = "players" | "seating";
export type Stage = "idle" | "spinning" | "wild" | "targeting" | "result";

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
  const [wildShown, setWildShown] = useState<WildId | null>(null);
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
    isCancelled: () => boolean,
    wild?: WildId
  ): Promise<ActionTargets | null> => {
    const spec = targetOptions(rollPhase, roll, players, actor, wild);
    const { targets, index } = pickTargets(spec);
    if (!spec || index < 0) return targets;
    setTargetKind(spec.kind);
    setStage("targeting");
    if (spec.options.length > 1) {
      const indices = spec.options.map((_, i) => i);
      const path = buildSpinPath(indices, index, Math.max(16, Math.min(40, indices.length * 4)));
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
    setTargetSeats(spec.options[index]);
    play("land");
    await wait(650 * speed);
    if (isCancelled()) return null;
    return targets;
  };

  const toEntries = (messages: Message[], entryPhase: GamePhase): LogEntry[] =>
    messages.map((m) => ({ ...m, id: uid(), phase: entryPhase }));

  /** Nobody goes home empty-handed: the richest hand out to the empty ones. */
  const runMiracle = async (roster: Player[], isCancelled: () => boolean) => {
    const { players: blessed, transfers } = christmasMiracle(roster);
    if (!transfers.length) return true;
    await wait(2600 * speed);
    if (isCancelled()) return false;
    const before = giftCounts(roster);
    const after = giftCounts(blessed);
    const deltas: Record<string, number> = {};
    for (const id of Object.keys(after)) {
      if (after[id] !== before[id]) deltas[id] = after[id] - (before[id] ?? 0);
    }
    const list = transfers.map((tr) => `${roster[tr.from].name} → ${roster[tr.to].name}`).join(", ");
    setPlayers(blessed);
    setLog((prev) => [...toEntries([{ key: "log.miracle", params: { list } }], "ended"), ...prev]);
    setResult({
      roll: 0,
      special: "miracle",
      phase: "ended",
      narrative: { key: "narr.miracle", params: { list } },
      fx: "give",
      seats: [...new Set(transfers.flatMap((tr) => [tr.from, tr.to]))],
      links: transfers.map((tr) => ({ from: tr.from, to: tr.to, kind: "give" as const })),
      deltas,
      key: Date.now(),
    });
    emitFx({ kind: "start" });
    play("freeze");
    await wait(4200 * speed);
    return !isCancelled();
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
    const state: GameState = { phase, players, pile, current, rolls, warmupTaken };

    setResult(null);
    setTargetSeats([]);
    setIsFinal(false);
    setWildShown(null);

    const available = availableRolls(state);
    let chosen = 0;
    if (isForced) {
      chosen = forced;
      setHighlightedRoll(chosen);
      setIsFinal(true);
    } else if (available.length) {
      chosen = pickRoll(state, available);
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

    // The wildcard spins a second wheel of nonsense.
    let wild: WildId | undefined;
    if (chosen === WILD_ROLL) {
      wild = pickWild(rollPhase, players, current);
      const pool = possibleWildcards(rollPhase, players, current).map((w) => w.id);
      if (wild && pool.length > 1) {
        setStage("wild");
        const indices = pool.map((_, i) => i);
        const path = buildSpinPath(indices, pool.indexOf(wild), Math.max(14, pool.length * 3));
        const ok = await runPath(
          path,
          brakingDurations(path.length, 2400 * speed),
          (i) => {
            setWildShown(pool[i]);
            play("tick");
          },
          isCancelled
        );
        if (!ok) return;
      }
      setWildShown(wild ?? null);
      play("boom");
      await wait(800 * speed);
      if (isCancelled()) return;
    }

    const targets = chosen ? await rollTargets(rollPhase, chosen, current, isCancelled, wild) : {};
    if (targets === null) return;

    const turn = resolveTurn(state, chosen, { ...targets, wild }, { free: isForced });
    const { outcome } = turn;
    const nextPhase = turn.state.phase;

    setPlayers(turn.state.players);
    setPile(turn.state.pile);
    setRolls(turn.state.rolls);
    setWarmupTaken(turn.state.warmupTaken);
    setLog((prev) => [...toEntries(turn.log, rollPhase), ...prev].slice(0, 150));
    setCurrent(turn.state.current);
    setTargetSeats([]);
    setResult({
      roll: chosen,
      phase: rollPhase,
      narrative: outcome.narrative,
      fx: outcome.fx,
      seats: outcome.seats,
      links: outcome.links,
      direction: outcome.direction,
      steps: outcome.steps,
      wild,
      deltas: turn.deltas,
      key: Date.now(),
    });
    setStage("result");
    emitFx({ kind: outcome.fx });
    play(fxSound[outcome.fx]);

    if (turn.phaseChanged) {
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
        if (!(await runMiracle(turn.state.players, isCancelled))) return;
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
  const isBusy = stage === "spinning" || stage === "wild" || stage === "targeting";
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
    wildShown,
    canRoll,
    isBusy,
    roll,
    newGame,
    playAgain,
    debugSkipPhase,
  };
};

export type ChaosGame = ReturnType<typeof useChaosGame>;
