import { useEffect, useRef, useState } from "react";
import { type FxEvent, onFx, prefersReducedMotion } from "../../utils/fx";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  life: number;
  shape: "rect" | "circle" | "emoji";
  glyph?: string;
};

type Flake = { x: number; y: number; r: number; speed: number; drift: number; phase: number };

const PALETTES: Record<string, string[]> = {
  default: ["#ff2e63", "#ffd23f", "#2ee6a6", "#7fdcff", "#ffffff", "#ff8a00"],
  freeze: ["#7fdcff", "#c9f3ff", "#ffffff", "#4fb6ff"],
  steal: ["#ff2e63", "#ff004c", "#2b0a1a", "#ffd23f"],
  endgame: ["#ff4d00", "#ff2e63", "#ffd23f", "#ff8a00"],
};

const GLYPHS: Record<string, string[]> = {
  grab: ["🎁", "✨"],
  start: ["🎁", "🎄", "⭐"],
  victory: ["🎉", "🎁", "🥳", "⭐"],
  steal: ["🥷", "💸"],
  freeze: ["❄️", "🧊"],
  endgame: ["🔥", "💥"],
  give: ["🎁"],
  swap: ["🔄", "🎁"],
};

/** Snow, confetti, screen flashes and shakes. Purely decorative. */
export const FxLayer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const [flash, setFlash] = useState<{ kind: string; key: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;
    const reduced = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const flakes: Flake[] = reduced
      ? []
      : Array.from({ length: Math.min(110, Math.round(width / 12)) }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.8 + Math.random() * 2.6,
          speed: 0.3 + Math.random() * 1.1,
          drift: 0.2 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
        }));

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.7);
      last = now;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      for (const f of flakes) {
        f.y += f.speed * dt;
        f.phase += 0.01 * dt;
        f.x += Math.sin(f.phase) * f.drift * 0.5 * dt;
        if (f.y > height + 5) {
          f.y = -5;
          f.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const alive: Particle[] = [];
      for (const p of particles.current) {
        p.vy += 0.18 * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= dt;
        if (p.life <= 0 || p.y > height + 40) continue;
        alive.push(p);
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.shape === "emoji" && p.glyph) {
          ctx.font = `${p.size * 2.4}px serif`;
          ctx.fillText(p.glyph, -p.size, p.size);
        } else if (p.shape === "circle") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }
      particles.current = alive;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const burst = (event: FxEvent) => {
      if (reduced) return;
      const kind = event.kind;
      const palette = PALETTES[kind] ?? PALETTES.default;
      const glyphs = GLYPHS[kind] ?? [];
      const big = kind === "victory" || kind === "start" || kind === "endgame";
      const count = big ? 220 : kind === "calm" || kind === "rotate" ? 0 : 90;
      const origins = big
        ? [
            { x: width * 0.15, y: height * 0.9 },
            { x: width * 0.85, y: height * 0.9 },
            { x: width * 0.5, y: height * 0.7 },
          ]
        : [{ x: event.x ?? width * 0.5, y: event.y ?? height * 0.45 }];
      for (let i = 0; i < count; i += 1) {
        const o = origins[i % origins.length];
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * (big ? 1.6 : 2.6);
        const speed = (big ? 9 : 6) + Math.random() * (big ? 12 : 8);
        const useGlyph = glyphs.length && Math.random() < 0.12;
        particles.current.push({
          x: o.x,
          y: o.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          color: palette[Math.floor(Math.random() * palette.length)],
          life: 90 + Math.random() * 90,
          shape: useGlyph ? "emoji" : Math.random() < 0.3 ? "circle" : "rect",
          glyph: useGlyph ? glyphs[Math.floor(Math.random() * glyphs.length)] : undefined,
        });
      }
    };

    const off = onFx((event) => {
      burst(event);
      if (["steal", "freeze", "endgame", "swap", "victory"].includes(event.kind)) {
        setFlash({ kind: event.kind, key: Date.now() });
      }
      if (!reduced && ["steal", "endgame", "swap"].includes(event.kind)) {
        document.body.classList.remove("shake");
        void document.body.offsetWidth;
        document.body.classList.add("shake");
        window.setTimeout(() => document.body.classList.remove("shake"), 650);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      off();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
      {flash && (
        <div
          key={flash.key}
          className={`fx-flash fx-flash--${flash.kind}`}
          aria-hidden="true"
          onAnimationEnd={() => setFlash(null)}
        />
      )}
    </>
  );
};
