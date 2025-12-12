import { useEffect, useMemo, useRef, useState } from "react";
import {
  ENDGAME_ROLLS,
  PACKAGES_PER_PLAYER,
  WARMUP_ROLLS,
  endgameTable,
  getPhaseTable,
  warmupTable,
} from "../constants/tables";
import { Lang, detectBrowserLang, tr } from "../constants/messages";
import { GamePhase, LogEntry, Player, RollOutcome } from "../types/game";
import {
  buildRandomSpinPath,
  buildStepDurations,
  normalizeDurationsToTotal,
  pickFinalRoll,
} from "../utils/randomizer";
import { applyEndgameRoll, applyWarmupRoll } from "../game/actions";
import { playersSeed, uid } from "../game/engine";
import { useHighlightSequence } from "./useHighlightSequence";

const STORAGE_KEY = "chaos-christmas-game-v1";
const LANG_KEY = "chaos-lang";
const RANDOMIZER_TOTAL_MS = 5000;
const DEBUG_RANDOMIZER_TOTAL_MS = 500;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const getRandomizerTotal = (isDebug: boolean) =>
  isDebug ? DEBUG_RANDOMIZER_TOTAL_MS : RANDOMIZER_TOTAL_MS;

const buildLinearStepDurations = (
  length: number,
  minStep: number,
  maxStep: number
) =>
  Array.from({ length }).map((_, idx) => {
    const t = length === 1 ? 1 : idx / (length - 1);
    return minStep + (maxStep - minStep) * t;
  });

type TargetOption = { player: Player; idx: number };

const computeDefaultPile = (playerCount: number) =>
  Math.max(0, playerCount * PACKAGES_PER_PLAYER);

export const useChaosGame = () => {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [players, setPlayers] = useState<Player[]>([]);
  const [pileCount, setPileCount] = useState<number>(
    computeDefaultPile(playersSeed.length)
  );
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [rollsRemaining, setRollsRemaining] = useState<Record<string, number>>(
    {}
  );
  const [warmupRollsTaken, setWarmupRollsTaken] = useState<
    Record<string, number>
  >({});
  const [setupPlayers, setSetupPlayers] = useState<string[]>(
    playersSeed.map((p) => p.name)
  );
  const [setupPile, setSetupPile] = useState<number>(() =>
    computeDefaultPile(playersSeed.length)
  );
  const [isSetupRandomizing, setIsSetupRandomizing] = useState(false);
  const [setupHighlightedIndex, setSetupHighlightedIndex] = useState<
    number | null
  >(null);
  const [pendingOrder, setPendingOrder] = useState<string[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);
  const [pendingPile, setPendingPile] = useState<number>(() =>
    computeDefaultPile(playersSeed.length)
  );
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [phaseBanner, setPhaseBanner] = useState<string | null>(null);
  const [pendingPhaseTransition, setPendingPhaseTransition] = useState<{
    nextPhase: GamePhase;
    rolls: Record<string, number>;
    nextPlayerIndex: number;
  } | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastOutcome, setLastOutcome] = useState<RollOutcome | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [isFinalResult, setIsFinalResult] = useState(false);
  const [showGiveAwayModal, setShowGiveAwayModal] = useState(false);
  const [giveAwayTarget, setGiveAwayTarget] = useState<string | null>(null);
  const [isRandomizingTarget, setIsRandomizingTarget] = useState(false);
  const [showStealModal, setShowStealModal] = useState(false);
  const [stealTarget, setStealTarget] = useState<string | null>(null);
  const [giveAwayActorName, setGiveAwayActorName] = useState<string | null>(
    null
  );
  const [stealActorName, setStealActorName] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [narrativeTitle, setNarrativeTitle] = useState<string>("");
  const [narrativeBody, setNarrativeBody] = useState<string>("");
  const [showNarrativeModal, setShowNarrativeModal] = useState(false);
  const [narrativeRoll, setNarrativeRoll] = useState<{
    label: string;
    trail: string[];
    isRunning: boolean;
  }>({ label: "", trail: [], isRunning: false });
  const narrativeRollToken = useRef(0);
  const [isHydrating, setIsHydrating] = useState(true);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectionTitle, setSelectionTitle] = useState<string>("");
  const [selectionVerb, setSelectionVerb] = useState<string>("");
  const [selectionActorName, setSelectionActorName] = useState<string | null>(
    null
  );
  const [selectionTarget, setSelectionTarget] = useState<string | null>(null);
  const [selectionLeadEmoji, setSelectionLeadEmoji] = useState<string>("🎲");
  const [selectionTrailEmoji, setSelectionTrailEmoji] = useState<string>("🎁");
  const [isRandomizingSelection, setIsRandomizingSelection] = useState(false);
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LANG_KEY) as Lang | null;
      if (stored === "en" || stored === "sv") return stored;
    }
    return detectBrowserLang();
  });

  const t = (key: string, params?: Record<string, string | number>) =>
    tr(lang, key, params);

  const runHighlightSequence = useHighlightSequence(
    (idx) => setHighlightedIndex(idx),
    setIsFinalResult,
    { totalDurationMs: getRandomizerTotal(debugMode) }
  );

  const currentPlayer = players[currentPlayerIndex] ?? {
    id: "",
    name: "—",
    packages: [],
  };
  const totalRollsLeft = useMemo(
    () => Object.values(rollsRemaining).reduce((sum, v) => sum + v, 0),
    [rollsRemaining]
  );

  const localizedWarmupTable = useMemo(() => {
    const table = { ...warmupTable };
    Object.keys(table).forEach((k) => {
      const idx = Number(k);
      table[idx] = {
        ...table[idx],
        title: tr(lang, `actions.warmup.${idx}.title`),
        description: tr(lang, `actions.warmup.${idx}.desc`),
      };
    });
    return table;
  }, [lang]);

  const localizedEndgameTable = useMemo(() => {
    const table = { ...endgameTable };
    Object.keys(table).forEach((k) => {
      const idx = Number(k);
      table[idx] = {
        ...table[idx],
        title: tr(lang, `actions.endgame.${idx}.title`),
        description: tr(lang, `actions.endgame.${idx}.desc`),
      };
    });
    return table;
  }, [lang]);

  const phaseTable =
    phase === "setup"
      ? localizedWarmupTable
      : phase === "warmup"
      ? localizedWarmupTable
      : localizedEndgameTable;

  const getAvailableActions = (
    playerIndex: number,
    roster: Player[],
    currentPhase: GamePhase
  ) => {
    const table = getPhaseTable(currentPhase);
    return Object.keys(table)
      .map(Number)
      .filter((roll) => {
        const action = table[roll];
        return (
          !action.requires || action.requires(playerIndex, roster, pileCount)
        );
      });
  };

  const resetGame = () => {
    setPhase("setup");
    setPlayers([]);
    setPileCount(computeDefaultPile(playersSeed.length));
    setCurrentPlayerIndex(0);
    setRollsRemaining({});
    setWarmupRollsTaken({});
    setSetupPlayers(playersSeed.map((p) => p.name));
    setSetupPile(computeDefaultPile(playersSeed.length));
    setLog([]);
    setLastOutcome(null);
    setIsFinalResult(false);
    setHighlightedIndex(null);
    setShowGiveAwayModal(false);
    setGiveAwayTarget(null);
    setGiveAwayActorName(null);
    setIsRandomizingTarget(false);
    setShowStealModal(false);
    setStealTarget(null);
    setStealActorName(null);
    setNarrativeBody("");
    setNarrativeTitle("");
    setShowNarrativeModal(false);
    setNarrativeRoll({ label: "", trail: [], isRunning: false });
    setShowSelectionModal(false);
    setSelectionTarget(null);
    setSelectionActorName(null);
    setSelectionTitle("");
    setSelectionVerb("");
    setSelectionLeadEmoji("🎲");
    setSelectionTrailEmoji("🎁");
    setIsRandomizingSelection(false);
    setPendingOrder([]);
    setPendingPlayers([]);
    setPendingPile(computeDefaultPile(playersSeed.length));
    setShowOrderModal(false);
    setIsStartingGame(false);
    setPhaseBanner(null);
    setSetupHighlightedIndex(null);
    setPendingPhaseTransition(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const computeNextPlayerIndex = (
    updatedRolls: Record<string, number>,
    roster: Player[],
    nextPhase: GamePhase
  ) => {
    if (nextPhase === "ended") return 0;
    const len = roster.length;
    for (let i = 1; i <= len; i += 1) {
      const idx = (currentPlayerIndex + i) % len;
      const pid = roster[idx].id;
      if (updatedRolls[pid] > 0) return idx;
    }
    return currentPlayerIndex;
  };

  const advanceTurn = (
    updatedRolls: Record<string, number>,
    nextPhase: GamePhase,
    roster: Player[] = players
  ) => {
    if (nextPhase === "ended") {
      setPhase("ended");
      setCurrentPlayerIndex(0);
      setRollsRemaining(updatedRolls);
      return;
    }

    const nextIndex = computeNextPlayerIndex(updatedRolls, roster, nextPhase);

    setCurrentPlayerIndex(nextIndex);
    setRollsRemaining(updatedRolls);
    setPhase(nextPhase);
  };

  const persistState = (state: {
    phase: GamePhase;
    players: Player[];
    pileCount: number;
    currentPlayerIndex: number;
    rollsRemaining: Record<string, number>;
    warmupRollsTaken: Record<string, number>;
    log: LogEntry[];
    lastOutcome: RollOutcome | null;
    setupPlayers: string[];
    setupPile: number;
  }) => {
    const snapshot = {
      ...state,
      players: state.players,
      log: state.log.slice(0, 60),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  };

  const beginGameFromPending = () => {
    if (!pendingPlayers.length) return;
    setIsStartingGame(true);
    const delay = 3000 + Math.floor(Math.random() * 2000);
    setTimeout(() => {
      const playerObjs = pendingPlayers.map((p) => ({
        ...p,
        packages: [...p.packages],
      }));
      const rolls = Object.fromEntries(
        playerObjs.map((p) => [p.id, WARMUP_ROLLS])
      );
      const warmupTaken = Object.fromEntries(playerObjs.map((p) => [p.id, 0]));

      setPlayers(playerObjs);
      setPileCount(pendingPile);
      setCurrentPlayerIndex(0);
      setRollsRemaining(rolls);
      setWarmupRollsTaken(warmupTaken);
      setLog([]);
      setLastOutcome(null);
      setIsFinalResult(false);
      setHighlightedIndex(null);
      setShowGiveAwayModal(false);
      setShowStealModal(false);
      setIsRandomizingTarget(false);
      setNarrativeBody("");
      setNarrativeTitle("");
      setShowNarrativeModal(false);
      setPhase("warmup");
      setShowOrderModal(false);
      setIsStartingGame(false);
      setPhaseBanner(null);

      persistState({
        phase: "warmup",
        players: playerObjs,
        pileCount: pendingPile,
        currentPlayerIndex: 0,
        rollsRemaining: rolls,
        warmupRollsTaken: warmupTaken,
        log: [],
        lastOutcome: null,
        setupPlayers,
        setupPile,
      });
    }, delay);
  };

  const startGameWithSetup = async () => {
    if (isSetupRandomizing) return;
    const cleanedNames = setupPlayers.map((n) => n.trim()).filter(Boolean);
    if (cleanedNames.length < 2) {
      alert("Add at least two players");
      return;
    }
    if (setupPile <= 0) {
      alert("Total packages must be greater than 0");
      return;
    }

    setIsSetupRandomizing(true);
    const indices = cleanedNames.map((_, idx) => idx);
    const finalIndex = Math.floor(Math.random() * indices.length);
    const spinPath = buildRandomSpinPath(
      indices,
      finalIndex,
      Math.max(2, Math.ceil(indices.length / 2))
    );
    const stepDurations = normalizeDurationsToTotal(
      buildStepDurations(spinPath.length, 70, 220),
      getRandomizerTotal(debugMode)
    );

    await new Promise<void>((resolve) => {
      let step = 0;
      let last = 0;
      const tick = (ts: number) => {
        if (step >= spinPath.length) {
          setSetupHighlightedIndex(finalIndex);
          resolve();
          return;
        }
        if (ts - last >= stepDurations[step]) {
          setSetupHighlightedIndex(spinPath[step]);
          last = ts;
          step += 1;
        }
        window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    });

    const shuffled = [...cleanedNames];
    const [first] = shuffled.splice(finalIndex, 1);
    const rest = shuffled.sort(() => Math.random() - 0.5);
    const ordered = [first, ...rest];

    const playerObjs = ordered.map((name) => ({
      id: uid(),
      name,
      packages: [],
    }));

    setPendingOrder(ordered);
    setPendingPlayers(playerObjs);
    setPendingPile(setupPile);
    setIsSetupRandomizing(false);

    // Pause briefly so the selected player stays visible before showing the modal
    setTimeout(() => {
      setShowOrderModal(true);
      setSetupHighlightedIndex(null);
    }, 1000);
  };

  const runPendingPhaseTransition = (data?: {
    nextPhase: GamePhase;
    nextPlayerIndex: number;
    rolls: Record<string, number>;
  }) => {
    const transition = data ?? pendingPhaseTransition;
    if (!transition) return;
    const { nextPhase, nextPlayerIndex, rolls } = transition;
    setCurrentPlayerIndex(nextPlayerIndex);
    setRollsRemaining(rolls);
    setPhase(nextPhase);
    if (nextPhase === "endgame" && phase !== "endgame") {
      setPhaseBanner(t("ui.banner.endgame"));
    }
    setPendingPhaseTransition(null);
  };

  const updateSetupName = (idx: number, value: string) =>
    setSetupPlayers((prev) =>
      prev.map((name, i) => (i === idx ? value : name))
    );

  const addSetupPlayer = () =>
    setSetupPlayers((prev) => {
      const next = [...prev, `Spelare ${prev.length + 1}`];
      setSetupPile(computeDefaultPile(next.length));
      return next;
    });

  const removeSetupPlayer = (idx: number) =>
    setSetupPlayers((prev) => {
      if (prev.length <= 2) return prev;
      const next = prev.filter((_, i) => i !== idx);
      setSetupPile(computeDefaultPile(next.length));
      return next;
    });

  const runNarrativeRoll = async (config: {
    label: string;
    items: string[];
    finalIndex: number;
    totalMs?: number;
  }) => {
    const { label } = config;
    const totalMs = config.totalMs ?? (debugMode ? 800 : 4000);
    if (!config.items.length) return;
    const token = (narrativeRollToken.current += 1);

    const safeFinalIndex = Math.min(
      Math.max(0, config.finalIndex),
      config.items.length - 1
    );
    const items =
      config.items.length === 1 ? ["…", config.items[0]] : config.items;
    const finalIndex = config.items.length === 1 ? 1 : safeFinalIndex;

    const indices = items.map((_, idx) => idx);
    const baseLoops = Math.max(8, Math.ceil(40 / Math.max(1, indices.length)));
    const spinPath = buildRandomSpinPath(indices, finalIndex, baseLoops);
    const stepDurations = normalizeDurationsToTotal(
      buildLinearStepDurations(spinPath.length, 60, 420),
      totalMs
    );

    setNarrativeRoll({ label, trail: [], isRunning: true });

    for (let step = 0; step < spinPath.length; step += 1) {
      if (narrativeRollToken.current !== token) return;
      const idx = spinPath[step] ?? finalIndex;
      const name = items[idx] ?? items[finalIndex] ?? "…";
      setNarrativeRoll((prev) => ({
        label,
        isRunning: true,
        trail: [...prev.trail, name].slice(-3),
      }));
      await wait(stepDurations[step] ?? 0);
    }

    if (narrativeRollToken.current !== token) return;
    setNarrativeRoll((prev) => ({
      ...prev,
      label,
      isRunning: false,
      trail: prev.trail.slice(-3),
    }));
  };

  const handleRoll = async (forcedRoll?: number, isDebug = false) => {
    if (phase === "setup" || phase === "ended") return;
    const actorId = currentPlayer.id;
    if (isSpinning) return;
    const actorRolls = rollsRemaining[actorId] ?? WARMUP_ROLLS;
    if (!isDebug && actorRolls <= 0) return;

    let updatedPlayers = players;
    let updatedPile = pileCount;
    let updatedRolls = { ...rollsRemaining };
    let updatedWarmupRollsTaken = { ...warmupRollsTaken };
    let nextPhase: GamePhase = phase;
    let localLog: LogEntry[] = [];
    let queue = 1;
    let lastOutcomeLocal: RollOutcome | null = null;
    let modalQueued = false;
    let blockingModalQueued = false;
    const pickRandom = <T>(items: T[]): T | null =>
      items.length ? items[Math.floor(Math.random() * items.length)] : null;

    const availableActions = getAvailableActions(
      currentPlayerIndex,
      players,
      phase
    );
    const availableIndices = availableActions.map((roll) => roll - 1);
    const pileHasGifts = pileCount > 0;
    const weightedIndices = availableActions.flatMap((roll) => {
      if (phase === "warmup" && (roll === 1 || roll === 2)) {
        const hasGifts = currentPlayer.packages.length > 0;
        let weight = roll === 1 && !hasGifts ? 3 : 1;
        if (pileHasGifts) {
          weight += 1;
        }
        return Array(Math.max(1, weight)).fill(roll - 1);
      }
      if (phase === "endgame" && roll === 6) {
        const hasGifts = currentPlayer.packages.length > 0;
        const weight = hasGifts ? 1 : 3;
        return Array(Math.max(1, weight)).fill(roll - 1);
      }
      return [roll - 1];
    });
    const spinPool = weightedIndices.length
      ? weightedIndices
      : availableIndices;

    if (!availableIndices.length) {
      setIsSpinning(false);
      return;
    }

    const chosenRoll = typeof forcedRoll === "number" ? forcedRoll : null;
    if (
      !isDebug &&
      chosenRoll !== null &&
      !availableActions.includes(chosenRoll)
    ) {
      setIsSpinning(false);
      return;
    }

    setIsSpinning(true);

    const finalRollIndex =
      chosenRoll !== null ? chosenRoll - 1 : pickFinalRoll(spinPool);

    if (!isDebug) {
      await runHighlightSequence(spinPool, finalRollIndex);
      await wait(1000);
    } else if (chosenRoll !== null) {
      setHighlightedIndex(chosenRoll - 1);
      setIsFinalResult(true);
    }

    let pendingRoll: number | null = chosenRoll ?? finalRollIndex + 1;
    while (queue > 0) {
      const roll = pendingRoll ?? Math.floor(Math.random() * 6) + 1;
      pendingRoll = null;
      const outcomeTable =
        phase === "warmup" ? localizedWarmupTable : localizedEndgameTable;
      lastOutcomeLocal = {
        roll,
        title: outcomeTable[roll].title,
        description: outcomeTable[roll].description,
        phase,
      };

      let giveAwayTargetPlayer: TargetOption | null = null;
      if (phase === "warmup" && roll === 3) {
        const otherPlayers: TargetOption[] = players
          .map((p, idx) => ({ player: p, idx }))
          .filter((_, idx) => idx !== currentPlayerIndex);
        if (otherPlayers.length) {
          setShowGiveAwayModal(false);
          setIsRandomizingTarget(false);
          setGiveAwayTarget(null);
          setGiveAwayActorName(null);

          const weighted = otherPlayers.flatMap((opt, idx) =>
            Array(Math.max(1, opt.player.packages.length + 1)).fill(idx)
          );
          const finalIndex =
            (weighted.length
              ? weighted[Math.floor(Math.random() * weighted.length)]
              : 0) ?? 0;

          setNarrativeTitle(outcomeTable[roll].title);
          setNarrativeBody("");
          setShowNarrativeModal(true);
          modalQueued = true;

          await runNarrativeRoll({
            label: lang === "sv" ? "Slumpar spelare" : "Rolling player",
            items: otherPlayers.map((o) => o.player.name),
            finalIndex,
            totalMs: 4000,
          });
          giveAwayTargetPlayer = otherPlayers[finalIndex] ?? null;
        }
      }

      let stealTargetPlayer: TargetOption | null = null;
      if (phase === "warmup" && roll === 4) {
        const stealablePlayers: TargetOption[] = players
          .map((p, idx) => ({ player: p, idx }))
          .filter(
            ({ player, idx }) =>
              idx !== currentPlayerIndex &&
              player.packages.some((pkg) => !pkg.locked)
          );
        if (stealablePlayers.length) {
          setShowStealModal(false);
          setIsRandomizingTarget(false);
          setStealTarget(null);
          setStealActorName(null);

          const weighted = stealablePlayers.flatMap((opt, idx) =>
            Array(Math.max(1, opt.player.packages.length + 1)).fill(idx)
          );
          const finalIndex =
            (weighted.length
              ? weighted[Math.floor(Math.random() * weighted.length)]
              : 0) ?? 0;

          setNarrativeTitle(outcomeTable[roll].title);
          setNarrativeBody("");
          setShowNarrativeModal(true);
          modalQueued = true;

          await runNarrativeRoll({
            label: lang === "sv" ? "Slumpar spelare" : "Rolling player",
            items: stealablePlayers.map((o) => o.player.name),
            finalIndex,
            totalMs: 4000,
          });
          stealTargetPlayer = stealablePlayers[finalIndex] ?? null;
        }
      }

      if (phase === "warmup") {
        const {
          players: p,
          pile,
          logEntries,
          narrative,
        } = applyWarmupRoll(
          roll,
          updatedPlayers,
          updatedPile,
          currentPlayerIndex,
          t,
          giveAwayTargetPlayer ? giveAwayTargetPlayer.idx : undefined,
          stealTargetPlayer ? stealTargetPlayer.idx : undefined
        );
        updatedPlayers = p;
        updatedPile = pile;
        localLog = [...localLog, ...logEntries];
        if (narrative && roll !== 3 && roll !== 4) {
          setNarrativeTitle(outcomeTable[roll].title);
          setNarrativeBody(narrative);
          setShowNarrativeModal(true);
          modalQueued = true;
        }
        if (roll === 3 && narrative) {
          setNarrativeBody(narrative);
          setNarrativeTitle(outcomeTable[roll].title);
          setShowNarrativeModal(false);
        }
        if (roll === 4 && narrative) {
          setNarrativeBody(narrative);
          setNarrativeTitle(outcomeTable[roll].title);
          setShowNarrativeModal(false);
        }
        if (!isDebug) {
          updatedWarmupRollsTaken[actorId] =
            (updatedWarmupRollsTaken[actorId] ?? 0) + 1;
        }
      } else if (phase === "endgame") {
        let flipTargetIndex: number | undefined;
        let trashTargetIndex: number | undefined;
        let jokerTargetIndices: [number, number] | undefined;
        let santaTargetIndex: number | undefined;
        let forcedDirection: "left" | "right" | undefined;

        if (roll === 2) {
          const targets = updatedPlayers
            .map((p, idx) => ({ player: p, idx }))
            .filter((_, idx) => idx !== currentPlayerIndex)
            .filter(({ player }) => player.packages.length > 0);
          if (targets.length === 1) {
            flipTargetIndex = targets[0].idx;
          } else if (targets.length) {
            modalQueued = true;
            const finalIndex = Math.max(
              0,
              targets.findIndex((tgt) => tgt.idx === pickRandom(targets)?.idx)
            );
            setNarrativeTitle(outcomeTable[roll].title);
            setNarrativeBody("");
            setShowNarrativeModal(true);
            await runNarrativeRoll({
              label: lang === "sv" ? "Slumpar spelare" : "Rolling player",
              items: targets.map((tgt) => tgt.player.name),
              finalIndex,
              totalMs: 4000,
            });
            flipTargetIndex = targets[finalIndex]?.idx;
          }
        }

        if (roll === 3) {
          const targets = updatedPlayers
            .map((p, idx) => ({ player: p, idx }))
            .filter((_, idx) => idx !== currentPlayerIndex);
          if (targets.length) {
            modalQueued = true;
            const finalIndex = Math.max(
              0,
              targets.findIndex((tgt) => tgt.idx === pickRandom(targets)?.idx)
            );
            setNarrativeTitle(outcomeTable[roll].title);
            setNarrativeBody("");
            setShowNarrativeModal(true);
            await runNarrativeRoll({
              label: lang === "sv" ? "Slumpar spelare" : "Rolling player",
              items: targets.map((tgt) => tgt.player.name),
              finalIndex,
              totalMs: 4000,
            });
            trashTargetIndex = targets[finalIndex]?.idx;
          }
        }

        if (roll === 4) {
          const available = updatedPlayers.map((p, idx) => ({
            player: p,
            idx,
          }));
          const donors = available.filter(({ player }) =>
            player.packages.some((pkg) => !pkg.locked)
          );
          if (available.length >= 2 && donors.length > 0) {
            modalQueued = true;
            const pairs: {
              label: string;
              first: TargetOption;
              second: TargetOption;
            }[] = [];
            for (let i = 0; i < available.length; i += 1) {
              for (let j = i + 1; j < available.length; j += 1) {
                const a = available[i];
                const b = available[j];
                const aEligible = donors.some((d) => d.idx === a.idx);
                const bEligible = donors.some((d) => d.idx === b.idx);
                if (!aEligible && !bEligible) continue;
                pairs.push({
                  label: `${a.player.name}↔${b.player.name}`,
                  first: a,
                  second: b,
                });
              }
            }
            if (pairs.length) {
              const weighted = pairs.flatMap((pair, idx) => {
                const weight =
                  (pair.first.player.packages.length + 1) *
                  (pair.second.player.packages.length + 1);
                return Array(Math.max(1, weight)).fill(idx);
              });
              const finalIndex =
                (weighted.length
                  ? weighted[Math.floor(Math.random() * weighted.length)]
                  : 0) ?? 0;

              setNarrativeTitle(outcomeTable[roll].title);
              setNarrativeBody("");
              setShowNarrativeModal(true);
              await runNarrativeRoll({
                label: lang === "sv" ? "Slumpar spelare" : "Rolling players",
                items: pairs.map((p) => p.label),
                finalIndex,
                totalMs: 4000,
              });

              const final = pairs[finalIndex];
              jokerTargetIndices = final
                ? [final.first.idx, final.second.idx]
                : undefined;
            }
          }
        }

        if (roll === 5) {
          const targets = updatedPlayers
            .map((p, idx) => ({ player: p, idx }))
            .filter((_, idx) => idx !== currentPlayerIndex);
          if (targets.length === 1) {
            santaTargetIndex = targets[0].idx;
          } else if (targets.length) {
            modalQueued = true;
            const finalIndex = Math.max(
              0,
              targets.findIndex((tgt) => tgt.idx === pickRandom(targets)?.idx)
            );
            setNarrativeTitle(outcomeTable[roll].title);
            setNarrativeBody("");
            setShowNarrativeModal(true);
            await runNarrativeRoll({
              label: lang === "sv" ? "Slumpar spelare" : "Rolling player",
              items: targets.map((tgt) => tgt.player.name),
              finalIndex,
              totalMs: 4000,
            });
            santaTargetIndex = targets[finalIndex]?.idx;
          }
        }

        if (roll === 6) {
          modalQueued = true;
          forcedDirection = Math.random() > 0.5 ? "right" : "left";
        }

        const {
          players: p,
          pile,
          logEntries,
          narrative,
        } = applyEndgameRoll(
          roll,
          updatedPlayers,
          updatedPile,
          currentPlayerIndex,
          t,
          {
            flipTargetIndex,
            trashTargetIndex,
            jokerTargetIndices,
            santaTargetIndex,
            forcedDirection,
          }
        );
        updatedPlayers = p;
        updatedPile = pile;
        localLog = [...localLog, ...logEntries];
        if (narrative) {
          setNarrativeTitle(outcomeTable[roll].title);
          setNarrativeBody(narrative);
          setShowNarrativeModal(true);
          modalQueued = true;
        }
      }

      if (!isDebug) {
        updatedRolls[actorId] = Math.max(0, updatedRolls[actorId] - 1);
      }
      queue -= 1;
    }

    const remaining = Object.values(updatedRolls).reduce(
      (sum, v) => sum + v,
      0
    );
    if (phase === "warmup") {
      const everyoneHitBase = updatedPlayers.every(
        (p) => (updatedWarmupRollsTaken[p.id] ?? 0) >= WARMUP_ROLLS
      );
      const warmupComplete = updatedPile <= 0 && everyoneHitBase;

      if (warmupComplete) {
        nextPhase = "endgame";
        updatedRolls = Object.fromEntries(
          updatedPlayers.map((p) => [p.id, ENDGAME_ROLLS])
        );
        localLog = [
          {
            id: uid(),
            message: "Endgame begins. Three rolls each!",
          },
          ...localLog,
        ];
      } else if (remaining === 0) {
        if (updatedPile > 0) {
          updatedRolls = Object.fromEntries(
            updatedPlayers.map((p) => [p.id, 1])
          );
        } else {
          updatedRolls = Object.fromEntries(
            updatedPlayers.map((p) => [
              p.id,
              Math.max(0, WARMUP_ROLLS - (updatedWarmupRollsTaken[p.id] ?? 0)),
            ])
          );
        }
      }
    } else if (phase === "endgame" && remaining === 0) {
      nextPhase = "ended";
    }

    const transitionToEndgame = phase === "warmup" && nextPhase === "endgame";
    const nextPlayerIndex = computeNextPlayerIndex(
      updatedRolls,
      updatedPlayers,
      nextPhase
    );

    setPlayers(updatedPlayers);
    setPileCount(updatedPile);
    setRollsRemaining(updatedRolls);
    setWarmupRollsTaken(updatedWarmupRollsTaken);
    setLastOutcome(lastOutcomeLocal);
    setLog((prev) => [...localLog, ...prev].slice(0, 60));

    const transitionData = {
      nextPhase,
      nextPlayerIndex,
      rolls: updatedRolls,
    };

    const hasBlockingModal =
      blockingModalQueued ||
      showGiveAwayModal ||
      showStealModal ||
      showSelectionModal ||
      isRandomizingSelection ||
      isRandomizingTarget;

    if (transitionToEndgame || modalQueued) {
      setPendingPhaseTransition(transitionData);
      if (!hasBlockingModal) {
        runPendingPhaseTransition(transitionData);
      }
    } else {
      advanceTurn(updatedRolls, nextPhase, updatedPlayers);
    }
    setIsSpinning(false);
  };

  const debugCyclePhase = () => {
    if (!debugMode) return;
    if (phase === "warmup") {
      const rolls = Object.fromEntries(
        players.map((p) => [p.id, ENDGAME_ROLLS])
      );
      setPhase("endgame");
      setRollsRemaining(rolls);
      setPhaseBanner(t("ui.banner.endgame"));
      return;
    }
    if (phase === "endgame") {
      const rolls = Object.fromEntries(
        players.map((p) => [p.id, WARMUP_ROLLS])
      );
      setPhase("warmup");
      setWarmupRollsTaken(Object.fromEntries(players.map((p) => [p.id, 0])));
      setRollsRemaining(rolls);
      setPhaseBanner(t("ui.rules.warmup"));
      return;
    }
    const rolls = Object.fromEntries(players.map((p) => [p.id, WARMUP_ROLLS]));
    setPhase("warmup");
    setWarmupRollsTaken(Object.fromEntries(players.map((p) => [p.id, 0])));
    setRollsRemaining(rolls);
    setPhaseBanner(t("ui.rules.warmup"));
  };

  const handleCloseNarrativeModal = () => {
    setShowNarrativeModal(false);
    runPendingPhaseTransition();
  };

  const handleCloseSelectionModal = () => {
    setShowSelectionModal(false);
    setIsRandomizingSelection(false);
    runPendingPhaseTransition();
  };

  const handleCloseGiveAwayModal = () => {
    setShowGiveAwayModal(false);
    runPendingPhaseTransition();
  };

  const handleCloseStealModal = () => {
    setShowStealModal(false);
    runPendingPhaseTransition();
  };

  const currentPhaseLabel =
    phase === "setup"
      ? t("ui.setup.title")
      : phase === "warmup"
      ? t("ui.rules.warmup")
      : phase === "endgame"
      ? t("ui.rules.endgame")
      : t("ui.phase.ended");

  const playerRolls = currentPlayer.id
    ? rollsRemaining[currentPlayer.id] ?? WARMUP_ROLLS
    : 0;
  const canRoll =
    debugMode ||
    (phase !== "setup" &&
      phase !== "ended" &&
      !pendingPhaseTransition &&
      Boolean(currentPlayer.id) &&
      playerRolls > 0);

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY) as Lang | null;
    if (savedLang) setLang(savedLang);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setIsHydrating(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        phase: GamePhase;
        players: Player[];
        pileCount: number;
        currentPlayerIndex: number;
        rollsRemaining: Record<string, number>;
        warmupRollsTaken: Record<string, number>;
        log: LogEntry[];
        lastOutcome: RollOutcome | null;
        setupPlayers: string[];
        setupPile: number;
      };
      setPhase(parsed.phase);
      setPlayers(parsed.players);
      setPileCount(parsed.pileCount);
      setCurrentPlayerIndex(parsed.currentPlayerIndex);
      setRollsRemaining(parsed.rollsRemaining);
      setWarmupRollsTaken(parsed.warmupRollsTaken);
      setLog(parsed.log ?? []);
      setLastOutcome(parsed.lastOutcome);
      setSetupPlayers(parsed.setupPlayers ?? playersSeed.map((p) => p.name));
      setSetupPile(
        parsed.setupPile ??
          computeDefaultPile(parsed.setupPlayers?.length ?? playersSeed.length)
      );
    } catch (e) {
      console.error("Failed to hydrate state", e);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    if (isHydrating) return;
    persistState({
      phase,
      players,
      pileCount,
      currentPlayerIndex,
      rollsRemaining,
      warmupRollsTaken,
      log,
      lastOutcome,
      setupPlayers,
      setupPile,
    });
  }, [
    isHydrating,
    phase,
    players,
    pileCount,
    currentPlayerIndex,
    rollsRemaining,
    warmupRollsTaken,
    log,
    lastOutcome,
    setupPlayers,
    setupPile,
  ]);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  return {
    // i18n
    lang,
    setLang,
    t,
    // phase/state
    phase,
    currentPhaseLabel,
    phaseTable,
    localizedWarmupTable,
    localizedEndgameTable,
    currentPlayer,
    players,
    pileCount,
    currentPlayerIndex,
    rollsRemaining,
    totalRollsLeft,
    warmupRollsTaken,
    log,
    lastOutcome,
    // control
    debugMode,
    setDebugMode,
    debugCyclePhase,
    resetGame,
    handleRoll,
    canRoll,
    isSpinning,
    highlightedIndex,
    isFinalResult,
    // setup
    setupPlayers,
    setupPile,
    setupHighlightedIndex,
    isSetupRandomizing,
    updateSetupName,
    addSetupPlayer,
    removeSetupPlayer,
    setSetupPile,
    startGameWithSetup,
    pendingOrder,
    showOrderModal,
    setShowOrderModal,
    isStartingGame,
    beginGameFromPending,
    // modals + banners
    phaseBanner,
    setPhaseBanner,
    showGiveAwayModal,
    giveAwayTarget,
    giveAwayActorName,
    isRandomizingTarget,
    showStealModal,
    stealTarget,
    stealActorName,
    narrativeTitle,
    narrativeBody,
    showNarrativeModal,
    narrativeRoll,
    handleCloseNarrativeModal,
    handleCloseGiveAwayModal,
    handleCloseStealModal,
    showSelectionModal,
    selectionTitle,
    selectionVerb,
    selectionActorName,
    selectionTarget,
    selectionLeadEmoji,
    selectionTrailEmoji,
    isRandomizingSelection,
    handleCloseSelectionModal,
  };
};
