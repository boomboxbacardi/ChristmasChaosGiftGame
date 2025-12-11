import { useEffect, useMemo, useState } from "react";
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
  pickFinalRoll,
} from "../utils/randomizer";
import { applyEndgameRoll, applyWarmupRoll } from "../game/actions";
import { playersSeed, uid } from "../game/engine";
import { useHighlightSequence } from "./useHighlightSequence";

const STORAGE_KEY = "chaos-christmas-game-v1";
const LANG_KEY = "chaos-lang";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

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
    setIsFinalResult
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
    const stepDurations = buildStepDurations(spinPath.length, 70, 220);

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

  const runTargetRandomization = async (
    availableTargets: TargetOption[],
    isSteal = false
  ) => {
    if (!availableTargets.length) return null;

    setIsRandomizingTarget(true);

    const availableIndices = availableTargets.map((_, idx) => idx);
    const weightedIndices = availableTargets.flatMap((opt, idx) =>
      Array(Math.max(1, opt.player.packages.length + 1)).fill(idx)
    );
    const finalIndex =
      (weightedIndices.length
        ? weightedIndices[Math.floor(Math.random() * weightedIndices.length)]
        : 0) ?? 0;
    const baseLoops = Math.max(2, Math.ceil(availableIndices.length / 2));
    const spinPath = buildRandomSpinPath(
      availableIndices,
      finalIndex,
      baseLoops
    );
    const stepDurations = buildStepDurations(spinPath.length, 70, 320);
    const tailPortion = Math.max(1, Math.floor(stepDurations.length * 0.3));
    const tailBoost = 2.5;
    for (
      let i = stepDurations.length - tailPortion;
      i < stepDurations.length;
      i += 1
    ) {
      stepDurations[i] *= tailBoost;
    }

    return new Promise<TargetOption>((resolve) => {
      let step = 0;
      let lastChange = 0;

      const setName = (name: string) => {
        if (isSteal) {
          setStealTarget(name);
        } else {
          setGiveAwayTarget(name);
        }
      };

      const tick = (timestamp: number) => {
        if (step >= spinPath.length) {
          const finalTarget = availableTargets[finalIndex];
          setName(finalTarget.player.name);
          setIsRandomizingTarget(false);
          resolve(finalTarget);
          return;
        }

        if (timestamp - lastChange >= stepDurations[step]) {
          const idx = spinPath[step];
          setName(availableTargets[idx].player.name);
          lastChange = timestamp;
          step += 1;
        }

        window.requestAnimationFrame(tick);
      };

      window.requestAnimationFrame(tick);
    });
  };

  const runSelectionRandomization = async (
    availableTargets: TargetOption[],
    config: {
      title: string;
      verb: string;
      actorName: string;
      leadEmoji: string;
      trailEmoji: string;
      updateActorWithSelection?: boolean;
      staticTargetName?: string;
    }
  ) => {
    if (!availableTargets.length) return null;
    setSelectionTitle(config.title);
    setSelectionVerb(config.verb);
    setSelectionActorName(
      config.updateActorWithSelection ? "…" : config.actorName
    );
    setSelectionLeadEmoji(config.leadEmoji);
    setSelectionTrailEmoji(config.trailEmoji);
    setSelectionTarget(config.staticTargetName ?? "…");
    setShowSelectionModal(true);
    setIsRandomizingSelection(true);

    const availableIndices = availableTargets.map((_, idx) => idx);
    const weightedIndices = availableTargets.flatMap((opt, idx) =>
      Array(Math.max(1, opt.player.packages.length + 1)).fill(idx)
    );
    const finalIndex =
      (weightedIndices.length
        ? weightedIndices[Math.floor(Math.random() * weightedIndices.length)]
        : 0) ?? 0;
    const baseLoops = Math.max(2, Math.ceil(availableIndices.length / 2));
    const spinPath = buildRandomSpinPath(
      availableIndices,
      finalIndex,
      baseLoops
    );
    const stepDurations = buildStepDurations(spinPath.length, 70, 320);
    const tailPortion = Math.max(1, Math.floor(stepDurations.length * 0.3));
    const tailBoost = 2.5;
    for (
      let i = stepDurations.length - tailPortion;
      i < stepDurations.length;
      i += 1
    ) {
      stepDurations[i] *= tailBoost;
    }

    return new Promise<TargetOption>((resolve) => {
      let step = 0;
      let lastChange = 0;
      const tick = (timestamp: number) => {
        if (step >= spinPath.length) {
          const finalTarget = availableTargets[finalIndex];
          if (config.updateActorWithSelection) {
            setSelectionActorName(finalTarget.player.name);
            setSelectionTarget(config.staticTargetName ?? "…");
          } else {
            setSelectionTarget(finalTarget.player.name);
          }
          setIsRandomizingSelection(false);
          resolve(finalTarget);
          return;
        }
        if (timestamp - lastChange >= stepDurations[step]) {
          const idx = spinPath[step];
          if (config.updateActorWithSelection) {
            setSelectionActorName(availableTargets[idx].player.name);
            setSelectionTarget(config.staticTargetName ?? "…");
          } else {
            setSelectionTarget(availableTargets[idx].player.name);
          }
          lastChange = timestamp;
          step += 1;
        }
        window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    });
  };

  const runDirectionRandomization = async () => {
    const options: { label: string; value: "left" | "right" }[] = [
      { label: t("dir.left"), value: "left" },
      { label: t("dir.right"), value: "right" },
    ];
    setSelectionTitle(t("actions.endgame.6.title"));
    setSelectionVerb(t("ui.modal.twistVerb"));
    setSelectionActorName(currentPlayer.name);
    setSelectionLeadEmoji("");
    setSelectionTrailEmoji("🎁🔄");
    setSelectionTarget("…");
    setShowSelectionModal(true);
    setIsRandomizingSelection(true);

    const finalIndex = Math.random() > 0.5 ? 1 : 0;
    const spinPath = buildRandomSpinPath([0, 1], finalIndex, 3);
    const stepDurations = buildStepDurations(spinPath.length, 80, 260);

    return new Promise<"left" | "right">((resolve) => {
      let step = 0;
      let lastChange = 0;
      const tick = (timestamp: number) => {
        if (step >= spinPath.length) {
          const finalIdx = spinPath[spinPath.length - 1];
          const final = options[finalIdx] ?? options[0];
          setSelectionTarget(final.label);
          setIsRandomizingSelection(false);
          resolve(final.value);
          return;
        }
        if (timestamp - lastChange >= stepDurations[step]) {
          const idx = spinPath[step];
          setSelectionTarget(options[idx]?.label ?? options[0].label);
          lastChange = timestamp;
          step += 1;
        }
        window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    });
  };

  const runPairSelectionRandomization = async (
    availableTargets: TargetOption[],
    config: {
      title: string;
      verb: string;
      actorName: string;
      leadEmoji: string;
      trailEmoji: string;
    }
  ) => {
    if (availableTargets.length < 2) return null;

    const pairs: {
      label: string;
      first: TargetOption;
      second: TargetOption;
    }[] = [];
    for (let i = 0; i < availableTargets.length; i += 1) {
      for (let j = i + 1; j < availableTargets.length; j += 1) {
        const a = availableTargets[i];
        const b = availableTargets[j];
        pairs.push({
          label: `${a.player.name} ↔ ${b.player.name}`,
          first: a,
          second: b,
        });
      }
    }

    const weightedIndices = pairs.flatMap((pair, idx) => {
      const weight =
        (pair.first.player.packages.length + 1) *
        (pair.second.player.packages.length + 1);
      return Array(Math.max(1, weight)).fill(idx);
    });
    const finalIndex =
      (weightedIndices.length
        ? weightedIndices[Math.floor(Math.random() * weightedIndices.length)]
        : 0) ?? 0;
    const spinPath = buildRandomSpinPath(
      pairs.map((_, idx) => idx),
      finalIndex,
      Math.max(2, Math.ceil(pairs.length / 2))
    );
    const stepDurations = buildStepDurations(spinPath.length, 70, 320);
    const tailPortion = Math.max(1, Math.floor(stepDurations.length * 0.3));
    const tailBoost = 2.5;
    for (
      let i = stepDurations.length - tailPortion;
      i < stepDurations.length;
      i += 1
    ) {
      stepDurations[i] *= tailBoost;
    }

    setSelectionTitle(config.title);
    setSelectionVerb(config.verb);
    setSelectionActorName(config.actorName);
    setSelectionLeadEmoji(config.leadEmoji);
    setSelectionTrailEmoji(config.trailEmoji);
    setSelectionTarget("…");
    setShowSelectionModal(true);
    setIsRandomizingSelection(true);

    return new Promise<{ first: TargetOption; second: TargetOption }>(
      (resolve) => {
        let step = 0;
        let lastChange = 0;
        const tick = (timestamp: number) => {
          if (step >= spinPath.length) {
            const final = pairs[finalIndex];
            setSelectionTarget(final.label);
            setIsRandomizingSelection(false);
            resolve({ first: final.first, second: final.second });
            return;
          }
          if (timestamp - lastChange >= stepDurations[step]) {
            const idx = spinPath[step];
            setSelectionTarget(pairs[idx]?.label ?? "…");
            lastChange = timestamp;
            step += 1;
          }
          window.requestAnimationFrame(tick);
        };
        window.requestAnimationFrame(tick);
      }
    );
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

    const availableActions = getAvailableActions(
      currentPlayerIndex,
      players,
      phase
    );
    const availableIndices = availableActions.map((roll) => roll - 1);
    const weightedIndices = availableActions.flatMap((roll) => {
      if (phase === "warmup" && roll === 1) {
        const hasGifts = currentPlayer.packages.length > 0;
        return Array(hasGifts ? 1 : 3).fill(roll - 1);
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
        setNarrativeBody("");
        setNarrativeTitle("");
        setShowNarrativeModal(false);
        const otherPlayers: TargetOption[] = players
          .map((p, idx) => ({ player: p, idx }))
          .filter((_, idx) => idx !== currentPlayerIndex);
        setGiveAwayTarget(null);
        setGiveAwayActorName(currentPlayer.name);
        setShowGiveAwayModal(true);
        modalQueued = true;
        giveAwayTargetPlayer = await runTargetRandomization(
          otherPlayers,
          false
        );
      }

      let stealTargetPlayer: TargetOption | null = null;
      if (phase === "warmup" && roll === 4) {
        setNarrativeBody("");
        setNarrativeTitle("");
        setShowNarrativeModal(false);
        const stealablePlayers: TargetOption[] = players
          .map((p, idx) => ({ player: p, idx }))
          .filter(
            ({ player, idx }) =>
              idx !== currentPlayerIndex &&
              player.packages.some((pkg) => !pkg.locked)
          );
        if (stealablePlayers.length === 1) {
          const [onlyTarget] = stealablePlayers;
          setStealTarget(onlyTarget.player.name);
          setStealActorName(currentPlayer.name);
          setShowStealModal(true);
          setIsRandomizingTarget(false);
          modalQueued = true;
          stealTargetPlayer = onlyTarget;
        } else if (stealablePlayers.length) {
          setStealTarget(null);
          setStealActorName(currentPlayer.name);
          setShowStealModal(true);
          modalQueued = true;
          stealTargetPlayer = await runTargetRandomization(
            stealablePlayers,
            true
          );
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
            const [onlyTarget] = targets;
            setSelectionTitle(outcomeTable[roll].title);
            setSelectionVerb(t("ui.modal.flipVerb"));
            setSelectionActorName(currentPlayer.name);
            setSelectionLeadEmoji("");
            setSelectionTrailEmoji("🎁🔄");
            setSelectionTarget(onlyTarget.player.name);
            setShowSelectionModal(true);
            setIsRandomizingSelection(false);
            modalQueued = true;
            flipTargetIndex = onlyTarget.idx;
          } else if (targets.length) {
            modalQueued = true;
            const choice = await runSelectionRandomization(targets, {
              title: outcomeTable[roll].title,
              verb: t("ui.modal.flipVerb"),
              actorName: currentPlayer.name,
              leadEmoji: "",
              trailEmoji: "🎁🔄",
            });
            flipTargetIndex = choice?.idx;
          }
        }

        if (roll === 3) {
          const targets = updatedPlayers
            .map((p, idx) => ({ player: p, idx }))
            .filter((_, idx) => idx !== currentPlayerIndex)
            .filter(({ player }) => player.packages.length > 0);
          if (targets.length) {
            modalQueued = true;
            const choice = await runSelectionRandomization(targets, {
              title: outcomeTable[roll].title,
              verb: t("ui.modal.trashVerb"),
              actorName: currentPlayer.name,
              leadEmoji: "",
              trailEmoji: "🎁♻️",
            });
            trashTargetIndex = choice?.idx;
          }
        }

        if (roll === 4) {
          const available = updatedPlayers
            .map((p, idx) => ({ player: p, idx }))
            .filter(({ player }) => player.packages.some((pkg) => !pkg.locked));
          if (available.length >= 2) {
            modalQueued = true;
            const pair = await runPairSelectionRandomization(available, {
              title: outcomeTable[roll].title,
              verb: t("ui.modal.jokerPairVerb"),
              actorName: currentPlayer.name,
              leadEmoji: "",
              trailEmoji: "🎁🎭",
            });
            if (pair) {
              jokerTargetIndices = [pair.first.idx, pair.second.idx];
            }
          }
        }

        if (roll === 5) {
          const targets = updatedPlayers
            .map((p, idx) => ({ player: p, idx }))
            .filter((_, idx) => idx !== currentPlayerIndex);
          if (targets.length === 1) {
            const [onlyTarget] = targets;
            setSelectionTitle(outcomeTable[roll].title);
            setSelectionVerb(t("ui.modal.santaVerb"));
            setSelectionActorName(onlyTarget.player.name);
            setSelectionLeadEmoji("");
            setSelectionTrailEmoji("🎁🎅🫳");
            setSelectionTarget(currentPlayer.name);
            setShowSelectionModal(true);
            setIsRandomizingSelection(false);
            modalQueued = true;
            santaTargetIndex = onlyTarget.idx;
          } else if (targets.length) {
            modalQueued = true;
            const choice = await runSelectionRandomization(targets, {
              title: outcomeTable[roll].title,
              verb: t("ui.modal.santaVerb"),
              actorName: currentPlayer.name,
              leadEmoji: "",
              trailEmoji: "🎁🎅🫳",
              updateActorWithSelection: true,
              staticTargetName: currentPlayer.name,
            });
            santaTargetIndex = choice?.idx;
          }
        }

        if (roll === 6) {
          modalQueued = true;
          const dir = await runDirectionRandomization();
          forcedDirection = dir ?? undefined;
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
    if (remaining === 0 && phase === "endgame") {
      nextPhase = "ended";
    } else if (remaining === 0 && phase === "warmup") {
      const everyoneHitBase = updatedPlayers.every(
        (p) => (updatedWarmupRollsTaken[p.id] ?? 0) >= WARMUP_ROLLS
      );
      if (updatedPile <= 0 && everyoneHitBase) {
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
      } else if (updatedPile > 0) {
        updatedRolls = Object.fromEntries(updatedPlayers.map((p) => [p.id, 1]));
      } else {
        updatedRolls = Object.fromEntries(
          updatedPlayers.map((p) => [
            p.id,
            Math.max(0, WARMUP_ROLLS - (updatedWarmupRollsTaken[p.id] ?? 0)),
          ])
        );
      }
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

    if (transitionToEndgame || modalQueued) {
      setPendingPhaseTransition(transitionData);
      if (!modalQueued) {
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
