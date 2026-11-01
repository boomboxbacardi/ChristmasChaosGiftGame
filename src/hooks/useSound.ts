import { useCallback, useEffect, useRef } from "react";

type Cue = "tick" | "land" | "whoosh" | "boom" | "freeze" | "fanfare" | "steal";

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number };

const melodies: Record<Cue, Note[]> = {
  tick: [{ freq: 880, at: 0, dur: 0.03, type: "square", gain: 0.04 }],
  land: [
    { freq: 523, at: 0, dur: 0.12, type: "triangle" },
    { freq: 784, at: 0.08, dur: 0.22, type: "triangle" },
  ],
  whoosh: [
    { freq: 200, at: 0, dur: 0.25, type: "sawtooth", gain: 0.05 },
    { freq: 400, at: 0.1, dur: 0.25, type: "sawtooth", gain: 0.04 },
  ],
  boom: [
    { freq: 90, at: 0, dur: 0.4, type: "sine", gain: 0.3 },
    { freq: 60, at: 0.05, dur: 0.5, type: "sine", gain: 0.25 },
  ],
  steal: [
    { freq: 660, at: 0, dur: 0.08, type: "square", gain: 0.06 },
    { freq: 440, at: 0.09, dur: 0.08, type: "square", gain: 0.06 },
    { freq: 220, at: 0.18, dur: 0.2, type: "square", gain: 0.06 },
  ],
  freeze: [
    { freq: 1568, at: 0, dur: 0.15, type: "sine", gain: 0.08 },
    { freq: 2093, at: 0.07, dur: 0.3, type: "sine", gain: 0.06 },
    { freq: 2637, at: 0.15, dur: 0.4, type: "sine", gain: 0.04 },
  ],
  // "Jingle bells" opening, because of course.
  fanfare: [
    { freq: 659, at: 0, dur: 0.15, type: "triangle" },
    { freq: 659, at: 0.18, dur: 0.15, type: "triangle" },
    { freq: 659, at: 0.36, dur: 0.3, type: "triangle" },
    { freq: 659, at: 0.72, dur: 0.15, type: "triangle" },
    { freq: 659, at: 0.9, dur: 0.15, type: "triangle" },
    { freq: 659, at: 1.08, dur: 0.3, type: "triangle" },
    { freq: 659, at: 1.44, dur: 0.15, type: "triangle" },
    { freq: 784, at: 1.62, dur: 0.15, type: "triangle" },
    { freq: 523, at: 1.8, dur: 0.2, type: "triangle" },
    { freq: 587, at: 2.02, dur: 0.15, type: "triangle" },
    { freq: 659, at: 2.2, dur: 0.5, type: "triangle" },
  ],
};

/** Synthesised sound effects, no audio files needed. */
export const useSound = (enabled: boolean) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  return useCallback((cue: Cue) => {
    if (!enabledRef.current || typeof window === "undefined") return;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctxRef.current ??= new Ctor();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;
      for (const note of melodies[cue]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.type ?? "sine";
        osc.frequency.setValueAtTime(note.freq, now + note.at);
        const peak = note.gain ?? 0.12;
        gain.gain.setValueAtTime(0.0001, now + note.at);
        gain.gain.exponentialRampToValueAtTime(peak, now + note.at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + note.at);
        osc.stop(now + note.at + note.dur + 0.05);
      }
    } catch {
      // Audio is a bonus; never break the game over it.
    }
  }, []);
};

export type PlaySound = ReturnType<typeof useSound>;
