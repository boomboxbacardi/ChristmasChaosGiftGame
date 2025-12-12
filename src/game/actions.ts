import { LogEntry, Player } from "../types/game";
import { clonePlayers, findPlayersWithGifts } from "../utils/players";
import { uid } from "./engine";

type Translate = (
  key: string,
  params?: Record<string, string | number>
) => string;

const pickWeightedIndex = <T>(options: T[], weight: (item: T) => number) => {
  const weighted = options.flatMap((item) =>
    Array(Math.max(1, weight(item))).fill(item)
  );
  if (!weighted.length) return null;
  const choice = weighted[Math.floor(Math.random() * weighted.length)];
  return choice;
};

const pickSmallestUnlockedIndex = (packages: Player["packages"]) =>
  packages.findIndex((pkg) => !pkg.locked);

const pickLargestUnlockedIndex = (packages: Player["packages"]) => {
  for (let i = packages.length - 1; i >= 0; i -= 1) {
    if (!packages[i].locked) return i;
  }
  return -1;
};

const splitLocked = (player: Player) => {
  const locked = player.packages.filter((pkg) => pkg.locked);
  const unlocked = player.packages.filter((pkg) => !pkg.locked);
  return { locked, unlocked };
};

type WarmupResult = {
  players: Player[];
  pile: number;
  logEntries: LogEntry[];
  narrative?: string | null;
};

export const applyWarmupRoll = (
  roll: number,
  roster: Player[],
  pile: number,
  actorIndex: number,
  t: Translate,
  giveAwayTargetIndex?: number,
  stealTargetIndex?: number
): WarmupResult => {
  const updatedPlayers = clonePlayers(roster);
  const actor = updatedPlayers[actorIndex];
  const entries: LogEntry[] = [];
  let narrative: string | null = null;

  const addGiftToActor = (count: number) => {
    const take = Math.min(count, pile);
    const newGifts = Array.from({ length: take }).map(() => ({
      id: uid(),
      locked: false,
    }));
    actor.packages = [...actor.packages, ...newGifts];
    return take;
  };

  if (roll === 1) {
    const taken = addGiftToActor(2);
    entries.push({
      id: uid(),
      message: t("log.warmup.1", { actor: actor.name, count: taken }),
    });
    narrative = t("narr.warmup.1", { actor: actor.name, count: taken });
    return {
      players: updatedPlayers,
      pile: pile - taken,
      logEntries: entries,
      narrative,
    };
  }

  if (roll === 2) {
    const taken = addGiftToActor(1);
    entries.push({
      id: uid(),
      message: t("log.warmup.2", { actor: actor.name, count: taken }),
    });
    narrative = t("narr.warmup.2", { actor: actor.name, count: taken });
    return {
      players: updatedPlayers,
      pile: pile - taken,
      logEntries: entries,
      narrative,
    };
  }

  if (roll === 3) {
    const targets = findPlayersWithGifts(updatedPlayers, actorIndex, true);
    if (!targets.length) {
      entries.push({
        id: uid(),
        message: t("log.warmup.nothingToGive", { actor: actor.name }),
      });
      return { players: updatedPlayers, pile, logEntries: entries };
    }

    const weightedTarget =
      giveAwayTargetIndex !== undefined
        ? updatedPlayers[giveAwayTargetIndex]
        : pickWeightedIndex(targets, ({ player }) => player.packages.length + 1)
            ?.player;

    const giveIdx = actor.packages.findIndex((pkg) => !pkg.locked);
    if (giveIdx === -1) {
      entries.push({
        id: uid(),
        message: t("log.warmup.nothingToGive", { actor: actor.name }),
      });
      return { players: updatedPlayers, pile, logEntries: entries };
    }
    const [gift] = actor.packages.splice(giveIdx, 1);
    if (!gift || !weightedTarget) {
      entries.push({
        id: uid(),
        message: t("log.warmup.nothingToGive", { actor: actor.name }),
      });
      return { players: updatedPlayers, pile, logEntries: entries };
    }
    weightedTarget.packages.push(gift);
    entries.push({
      id: uid(),
      message: t("log.warmup.gave", {
        actor: actor.name,
        target: weightedTarget.name,
      }),
    });
    narrative = t("narr.warmup.3", {
      actor: actor.name,
      target: weightedTarget.name,
    });
    return { players: updatedPlayers, pile, logEntries: entries, narrative };
  }

  if (roll === 4) {
    const targets = findPlayersWithGifts(updatedPlayers, actorIndex, true);
    if (!targets.length) {
      entries.push({ id: uid(), message: t("log.warmup.noUnlockedSteal") });
      return { players: updatedPlayers, pile, logEntries: entries };
    }

    const targetPlayer =
      stealTargetIndex !== undefined
        ? updatedPlayers[stealTargetIndex]
        : pickWeightedIndex(targets, ({ player }) => player.packages.length + 1)
            ?.player;

    if (!targetPlayer) {
      entries.push({ id: uid(), message: t("log.warmup.noUnlockedSteal") });
      return { players: updatedPlayers, pile, logEntries: entries };
    }

    const giftIndex = targetPlayer.packages.findIndex(
      (pkg: Player["packages"][number]) => !pkg.locked
    );
    if (giftIndex === -1) {
      entries.push({ id: uid(), message: t("log.warmup.noUnlockedSteal") });
      return { players: updatedPlayers, pile, logEntries: entries };
    }

    const [gift] = targetPlayer.packages.splice(giftIndex, 1);
    actor.packages.push(gift);
    entries.push({
      id: uid(),
      message: t("log.warmup.steal", {
        actor: actor.name,
        target: targetPlayer.name,
      }),
    });
    narrative = t("narr.warmup.4", {
      actor: actor.name,
      target: targetPlayer.name,
    });
    return { players: updatedPlayers, pile, logEntries: entries, narrative };
  }

  if (roll === 5) {
    const nextPlayers = clonePlayers(updatedPlayers);
    const giftsToSend = nextPlayers.map((p) => {
      const pkgIdx = pickSmallestUnlockedIndex(p.packages);
      return pkgIdx === -1 ? null : p.packages[pkgIdx];
    });

    giftsToSend.forEach((gift, idx) => {
      if (!gift) return;
      const rightIdx = (idx + 1) % nextPlayers.length;
      const giftIdx = nextPlayers[idx].packages.findIndex(
        (pkg) => pkg.id === gift.id
      );
      if (giftIdx !== -1) {
        nextPlayers[idx].packages.splice(giftIdx, 1);
        nextPlayers[rightIdx].packages.push(gift);
      }
    });
    entries.push({ id: uid(), message: t("log.warmup.tiny") });
    narrative = t("narr.warmup.5");
    return { players: nextPlayers, pile, logEntries: entries, narrative };
  }

  const nextPlayers = clonePlayers(updatedPlayers);
  const giftsToSend = nextPlayers.map((p) => {
    const pkgIdx = pickLargestUnlockedIndex(p.packages);
    return pkgIdx === -1 ? null : p.packages[pkgIdx];
  });

  giftsToSend.forEach((gift, idx) => {
    if (!gift) return;
    const leftIdx = (idx - 1 + nextPlayers.length) % nextPlayers.length;
    const giftIdx = nextPlayers[idx].packages.findIndex(
      (pkg) => pkg.id === gift.id
    );
    if (giftIdx !== -1) {
      nextPlayers[idx].packages.splice(giftIdx, 1);
      nextPlayers[leftIdx].packages.push(gift);
    }
  });
  entries.push({ id: uid(), message: t("log.warmup.mega") });
  narrative = t("narr.warmup.6");
  return { players: nextPlayers, pile, logEntries: entries, narrative };
};

type EndgameResult = {
  players: Player[];
  pile: number;
  logEntries: LogEntry[];
  narrative?: string | null;
};

export const applyEndgameRoll = (
  roll: number,
  roster: Player[],
  pile: number,
  actorIndex: number,
  t: Translate,
  options?: {
    flipTargetIndex?: number;
    trashTargetIndex?: number;
    jokerTargetIndices?: [number, number];
    santaTargetIndex?: number;
    forcedDirection?: "left" | "right";
  }
): EndgameResult => {
  const updatedPlayers = clonePlayers(roster);
  const actor = updatedPlayers[actorIndex];
  const entries: LogEntry[] = [];
  let narrative: string | null = null;

  if (roll === 1) {
    const unlocked = actor.packages.filter((pkg) => !pkg.locked);
    if (!unlocked.length) {
      entries.push({
        id: uid(),
        message: t("log.endgame.noFreeze", { actor: actor.name }),
      });
      return { players: updatedPlayers, pile, logEntries: entries, narrative };
    }
    const pick = unlocked[Math.floor(Math.random() * unlocked.length)];
    actor.packages = actor.packages.map((pkg) =>
      pkg.id === pick.id ? { ...pkg, locked: true } : pkg
    );
    entries.push({
      id: uid(),
      message: t("log.endgame.freeze", { actor: actor.name }),
    });
    narrative = t("narr.endgame.1", { actor: actor.name });
    return { players: updatedPlayers, pile, logEntries: entries, narrative };
  }

  if (roll === 2) {
    const targets = updatedPlayers
      .map((p, idx) => ({ player: p, idx }))
      .filter((_, idx) => idx !== actorIndex)
      .filter(({ player }) => player.packages.some((pkg) => !pkg.locked));
    const target =
      options?.flipTargetIndex !== undefined
        ? targets.find((tgt) => tgt.idx === options.flipTargetIndex)
        : pickWeightedIndex(
            targets,
            ({ player }) =>
              player.packages.filter((pkg) => !pkg.locked).length + 1
          );
    if (!target) {
      entries.push({
        id: uid(),
        message: t("log.endgame.noSwap", { actor: actor.name }),
      });
      return { players: updatedPlayers, pile, logEntries: entries, narrative };
    }
    const actorSplit = splitLocked(actor);
    const targetSplit = splitLocked(target.player);
    actor.packages = [...actorSplit.locked, ...targetSplit.unlocked];
    target.player.packages = [...targetSplit.locked, ...actorSplit.unlocked];
    entries.push({
      id: uid(),
      message: t("log.endgame.flip", {
        actor: actor.name,
        target: target.player.name,
      }),
    });
    narrative = t("narr.endgame.2", {
      actor: actor.name,
      target: target.player.name,
    });
    return { players: updatedPlayers, pile, logEntries: entries, narrative };
  }

  if (roll === 3) {
    const actorUnlocked = actor.packages.filter((pkg) => !pkg.locked);
    if (!actorUnlocked.length) {
      entries.push({ id: uid(), message: t("log.endgame.trash.missing") });
      return { players: updatedPlayers, pile, logEntries: entries, narrative };
    }

    const available = updatedPlayers
      .map((p, idx) => ({ player: p, idx }))
      .filter((_, idx) => idx !== actorIndex);
    if (!available.length) {
      entries.push({ id: uid(), message: t("log.endgame.trash.notEnough") });
      return { players: updatedPlayers, pile, logEntries: entries, narrative };
    }
    const target =
      options?.trashTargetIndex !== undefined
        ? available.find((opt) => opt.idx === options.trashTargetIndex)
        : pickWeightedIndex(
            available,
            ({ player }) =>
              player.packages.filter((pkg) => !pkg.locked).length + 1
          );
    if (!target) {
      entries.push({ id: uid(), message: t("log.endgame.trash.failed") });
      return { players: updatedPlayers, pile, logEntries: entries, narrative };
    }
    const targetUnlocked = target.player.packages.filter(
      (pkg: Player["packages"][number]) => !pkg.locked
    );
    if (!targetUnlocked.length) {
      // Target has nothing to give; actor hands over one unlocked gift
      const gift =
        actorUnlocked[Math.floor(Math.random() * actorUnlocked.length)];
      actor.packages = actor.packages.filter((pkg) => pkg.id !== gift.id);
      target.player.packages.push(gift);
      entries.push({
        id: uid(),
        message: t("log.endgame.trash.swap", {
          actor: actor.name,
          target: target.player.name,
        }),
      });
    } else {
      const actorSplit = splitLocked(actor);
      const targetSplit = splitLocked(target.player);
      actor.packages = [...actorSplit.locked, ...targetSplit.unlocked];
      target.player.packages = [...targetSplit.locked, ...actorSplit.unlocked];
      entries.push({
        id: uid(),
        message: t("log.endgame.trash.swap", {
          actor: actor.name,
          target: target.player.name,
        }),
      });
    }
    narrative = t("narr.endgame.3", {
      actor: actor.name,
      target: target.player.name,
    });
    return { players: updatedPlayers, pile, logEntries: entries, narrative };
  }

  if (roll === 4) {
    const available = updatedPlayers.map((p, idx) => ({ player: p, idx }));
    if (available.length < 2) {
      entries.push({ id: uid(), message: t("log.endgame.joker.notEnough") });
      return { players: updatedPlayers, pile, logEntries: entries, narrative };
    }
    const first =
      options?.jokerTargetIndices?.[0] !== undefined
        ? available.find((opt) => opt.idx === options.jokerTargetIndices?.[0])
        : pickWeightedIndex(
            available,
            ({ player }) => player.packages.length + 1
          );
    const remaining = available.filter((opt) => opt.idx !== first?.idx);
    const second =
      options?.jokerTargetIndices?.[1] !== undefined
        ? remaining.find((opt) => opt.idx === options.jokerTargetIndices?.[1])
        : pickWeightedIndex(
            remaining,
            ({ player }) => player.packages.length + 1
          );
    if (!first || !second) {
      entries.push({ id: uid(), message: t("log.endgame.joker.failed") });
      return { players: updatedPlayers, pile, logEntries: entries, narrative };
    }
    const firstUnlocked = first.player.packages.filter(
      (pkg: Player["packages"][number]) => !pkg.locked
    );
    const secondUnlocked = second.player.packages.filter(
      (pkg: Player["packages"][number]) => !pkg.locked
    );
    if (!firstUnlocked.length && !secondUnlocked.length) {
      entries.push({ id: uid(), message: t("log.endgame.joker.missing") });
      return { players: updatedPlayers, pile, logEntries: entries, narrative };
    }
    if (firstUnlocked.length && !secondUnlocked.length) {
      const firstPick =
        firstUnlocked[Math.floor(Math.random() * firstUnlocked.length)];
      first.player.packages = first.player.packages.filter(
        (pkg: Player["packages"][number]) => pkg.id !== firstPick.id
      );
      second.player.packages.push(firstPick);
    } else if (!firstUnlocked.length && secondUnlocked.length) {
      const secondPick =
        secondUnlocked[Math.floor(Math.random() * secondUnlocked.length)];
      second.player.packages = second.player.packages.filter(
        (pkg: Player["packages"][number]) => pkg.id !== secondPick.id
      );
      first.player.packages.push(secondPick);
    } else {
      const firstPick =
        firstUnlocked[Math.floor(Math.random() * firstUnlocked.length)];
      const secondPick =
        secondUnlocked[Math.floor(Math.random() * secondUnlocked.length)];
      first.player.packages = first.player.packages.filter(
        (pkg: Player["packages"][number]) => pkg.id !== firstPick.id
      );
      second.player.packages = second.player.packages.filter(
        (pkg: Player["packages"][number]) => pkg.id !== secondPick.id
      );
      first.player.packages.push(secondPick);
      second.player.packages.push(firstPick);
    }
    entries.push({
      id: uid(),
      message: t("log.endgame.joker.swap", {
        a: first.player.name,
        b: second.player.name,
      }),
    });
    narrative = t("narr.endgame.4", {
      a: first.player.name,
      b: second.player.name,
    });
    return { players: updatedPlayers, pile, logEntries: entries, narrative };
  }

  if (roll === 5) {
    const others = updatedPlayers
      .map((p, idx) => ({ player: p, idx }))
      .filter((_, idx) => idx !== actorIndex);
    const target =
      options?.santaTargetIndex !== undefined
        ? others.find((opt) => opt.idx === options.santaTargetIndex)
        : pickWeightedIndex(others, ({ player }) => player.packages.length + 1);
    const giveIdx = actor.packages.findIndex((pkg) => !pkg.locked);
    if (!target || giveIdx === -1) {
      entries.push({
        id: uid(),
        message: t("log.endgame.santa.none", { actor: actor.name }),
      });
      return { players: updatedPlayers, pile, logEntries: entries, narrative };
    }
    const [gift] = actor.packages.splice(giveIdx, 1);
    target.player.packages.push(gift);
    entries.push({
      id: uid(),
      message: t("log.endgame.santa.gave", {
        target: target.player.name,
        actor: actor.name,
      }),
    });
    narrative = t("narr.endgame.5", {
      actor: actor.name,
      target: target.player.name,
    });
    return { players: updatedPlayers, pile, logEntries: entries, narrative };
  }

  const direction =
    options?.forcedDirection ?? (Math.random() > 0.5 ? "left" : "right");
  const directionLabel = t(direction === "left" ? "dir.left" : "dir.right");
  const cloned = clonePlayers(updatedPlayers);
  const lockedPools = cloned.map((p) => p.packages.filter((pkg) => pkg.locked));
  const unlockedPools = cloned.map((p) =>
    p.packages.filter((pkg) => !pkg.locked)
  );

  const rotatedUnlocked = unlockedPools.map((_, idx) => {
    if (direction === "left") {
      const fromIdx = (idx + 1) % unlockedPools.length;
      return unlockedPools[fromIdx];
    }
    const fromIdx = (idx - 1 + unlockedPools.length) % unlockedPools.length;
    return unlockedPools[fromIdx];
  });

  cloned.forEach((p, idx) => {
    p.packages = [...lockedPools[idx], ...rotatedUnlocked[idx]];
  });
  entries.push({
    id: uid(),
    message: t("log.endgame.twist", { dir: directionLabel }),
  });
  narrative = t("narr.endgame.6", { dir: directionLabel });
  return { players: cloned, pile, logEntries: entries, narrative };
};
