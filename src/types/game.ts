export type GamePhase = "setup" | "warmup" | "endgame" | "ended";

export type Package = {
  id: string;
  locked?: boolean;
};

/**
 * Players are stored in seat order, clockwise around the table.
 * Seat `i + 1` is the player on your LEFT, seat `i - 1` the one on your RIGHT.
 */
export type Player = {
  id: string;
  name: string;
  packages: Package[];
};

export type Direction = "left" | "right";

/** A translatable message: a copy key plus its parameters. */
export type Message = {
  key: string;
  params?: Record<string, string | number>;
};

export type LogEntry = Message & {
  id: string;
  phase?: GamePhase;
};

export type RollOutcome = {
  roll: number;
  phase: GamePhase;
};

/** Visual side effect triggered by an action. */
export type FxKind = "grab" | "steal" | "give" | "freeze" | "swap" | "rotate" | "calm";

export type ActionResult = {
  roll: number;
  phase: GamePhase;
  narrative: Message;
  fx: FxKind;
  /** Seats involved in the action (actor first). */
  seats: number[];
  links?: { from: number; to: number; kind: "give" | "steal" | "swap" }[];
  direction?: Direction;
  steps?: number;
  special?: "miracle";
  wild?: string;
  /** Package count change per player id. */
  deltas: Record<string, number>;
  key: number;
};
