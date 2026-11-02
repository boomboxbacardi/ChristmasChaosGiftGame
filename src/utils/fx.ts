import type { FxKind } from "../types/game";

/** Tiny event bus so the game hook can fire visual effects anywhere. */
export type FxEvent = {
  kind: FxKind | "start" | "endgame" | "victory" | "gain" | "loss";
  x?: number;
  y?: number;
  /** Override the particle count. */
  count?: number;
};

const FX_EVENT = "chaos-fx";

export const emitFx = (event: FxEvent) => {
  window.dispatchEvent(new CustomEvent<FxEvent>(FX_EVENT, { detail: event }));
};

export const onFx = (handler: (event: FxEvent) => void) => {
  const listener = (e: Event) => handler((e as CustomEvent<FxEvent>).detail);
  window.addEventListener(FX_EVENT, listener);
  return () => window.removeEventListener(FX_EVENT, listener);
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
