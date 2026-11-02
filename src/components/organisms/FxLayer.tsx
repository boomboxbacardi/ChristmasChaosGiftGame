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
  gain: ["#ffd23f", "#2ee6a6", "#ffffff", "#fff3b0", "#7fdcff"],
  loss: ["#ff2e4d", "#ff004c", "#ff8a9a", "#6a0418"],
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
  gain: ["🎁", "✨", "⭐"],
  loss: ["💸", "💔"],
};

const MAX_PARTICLES = 420;
const SPRITE_PX = 64;

/** Emoji are pre-rendered once; fillText on emoji every frame is very slow. */
const spriteCache = new Map<string, HTMLCanvasElement>();
const getSprite = (glyph: string) => {
  let sprite = spriteCache.get(glyph);
  if (!sprite) {
    sprite = document.createElement("canvas");
    sprite.width = SPRITE_PX;
    sprite.height = SPRITE_PX;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      sctx.font = `${SPRITE_PX * 0.8}px serif`;
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      sctx.fillText(glyph, SPRITE_PX / 2, SPRITE_PX / 2 + SPRITE_PX * 0.05);
    }
    spriteCache.set(glyph, sprite);
  }
  return sprite;
};

/** Snow, confetti and screen flashes. Purely decorative (no screen shake: it made people dizzy). */
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
    // Snow and confetti move too fast to need retina pixels; 1x keeps fill cost 4x lower.
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    let flakes: Flake[] = reduced
      ? []
      : Array.from({ length: Math.min(70, Math.round(width / 20)) }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.8 + Math.random() * 2.6,
          speed: 0.3 + Math.random() * 1.1,
          drift: 0.2 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
        }));

    // Adaptive quality: if the device can't keep up, thin out the effects.
    let lowPower = false;
    let slowFrames = 0;
    let sampled = 0;

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = now - last;
      const dt = Math.min(3, elapsed / 16.7);
      last = now;
      if (!lowPower && document.visibilityState === "visible") {
        sampled += 1;
        if (elapsed > 26) slowFrames += 1;
        if (sampled >= 120) {
          if (slowFrames > 40) {
            lowPower = true;
            flakes = flakes.filter((_, i) => i % 2 === 0);
          }
          sampled = 0;
          slowFrames = 0;
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, width, height);

      // All flakes in a single path = a single fill call.
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      for (const f of flakes) {
        f.y += f.speed * dt;
        f.phase += 0.01 * dt;
        f.x += Math.sin(f.phase) * f.drift * 0.5 * dt;
        if (f.y > height + 5) {
          f.y = -5;
          f.x = Math.random() * width;
        }
        ctx.moveTo(f.x + f.r, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      }
      ctx.fill();

      const list = particles.current;
      let alive = 0;
      for (let i = 0; i < list.length; i += 1) {
        const p = list[i];
        p.vy += 0.18 * dt;
        p.vx *= 0.99;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.life -= dt;
        if (p.life <= 0 || p.y > height + 40) continue;
        list[alive] = p;
        alive += 1;
        const cos = Math.cos(p.rot);
        const sin = Math.sin(p.rot);
        ctx.setTransform(cos, sin, -sin, cos, p.x, p.y);
        ctx.globalAlpha = Math.min(1, p.life / 30);
        if (p.shape === "emoji" && p.glyph) {
          const s = p.size * 2.6;
          ctx.drawImage(getSprite(p.glyph), -s / 2, -s / 2, s, s);
        } else if (p.shape === "circle") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
      }
      list.length = alive;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const burst = (event: FxEvent) => {
      if (reduced) return;
      const kind = event.kind;
      const palette = PALETTES[kind] ?? PALETTES.default;
      const glyphs = GLYPHS[kind] ?? [];
      const big = kind === "victory" || kind === "start" || kind === "endgame";
      const local = kind === "gain" || kind === "loss";
      const base = event.count ?? (big ? 170 : kind === "calm" || kind === "rotate" ? 0 : 70);
      const wanted = lowPower ? Math.round(base / 2) : base;
      const count = Math.max(0, Math.min(wanted, MAX_PARTICLES - particles.current.length));
      const origins = big
        ? [
            { x: width * 0.15, y: height * 0.9 },
            { x: width * 0.85, y: height * 0.9 },
            { x: width * 0.5, y: height * 0.7 },
          ]
        : [{ x: event.x ?? width * 0.5, y: event.y ?? height * 0.45 }];
      for (let i = 0; i < count; i += 1) {
        const o = origins[i % origins.length];
        // Gains fountain upwards; losses burst out in every direction like a popped balloon.
        const angle =
          kind === "loss"
            ? Math.random() * Math.PI * 2
            : -Math.PI / 2 + (Math.random() - 0.5) * (big ? 1.6 : local ? 1.4 : 2.6);
        const speed = local
          ? 4 + Math.random() * (kind === "gain" ? 9 : 6)
          : (big ? 9 : 6) + Math.random() * (big ? 12 : 8);
        const useGlyph = glyphs.length && Math.random() < (local ? 0.3 : 0.14);
        particles.current.push({
          x: o.x,
          y: o.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 6 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          color: palette[Math.floor(Math.random() * palette.length)],
          life: local ? 50 + Math.random() * 50 : 90 + Math.random() * 90,
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
