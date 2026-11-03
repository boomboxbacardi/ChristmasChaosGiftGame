import { memo } from "react";

/**
 * A painted winter night behind the whole app: aurora, moon, snowy hills, pine forest,
 * a little village with lit windows and a decorated Christmas tree.
 *
 * Performance: the scene itself is one static SVG (painted once). Everything that
 * twinkles lives in its own full-screen layer whose opacity is animated as a whole,
 * so the compositor does the work and nothing repaints per frame.
 */

const VIEW = "0 0 1600 900";
const FIT = "xMidYMax slice";

/** Tiny deterministic PRNG so the scene looks the same on every render. */
const rng = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const rand = rng(1225);
const stars = Array.from({ length: 110 }, (_, i) => ({
  i,
  x: rand() * 1600,
  y: rand() * 430,
  r: 0.6 + rand() * 1.6,
}));

/** Height of the mid hill at x, matching the path below closely enough to plant trees on. */
const midHill = (x: number) => 618 - Math.sin((x / 1600) * Math.PI * 3.2) * 22;
const forest = Array.from({ length: 46 }, () => {
  const x = rand() * 1600;
  const h = 40 + rand() * 70;
  return { x, y: midHill(x) + 6, h };
}).sort((a, b) => a.h - b.h);

const pine = (x: number, y: number, h: number) => {
  const w = h * 0.42;
  const tiers: [number, number, number][] = [
    [1, 0.55, 0.5],
    [0.75, 0.28, 0.75],
    [0.5, 0, 1],
  ];
  return tiers
    .map(([top, bottom, half]) => {
      const t = y - h * top;
      const btm = y - h * bottom;
      return `M${x} ${t} L${x + w * half} ${btm} L${x - w * half} ${btm} Z`;
    })
    .join(" ");
};

type House = { x: number; y: number; w: number; h: number; roof: string };
const houses: House[] = [
  { x: 340, y: 790, w: 90, h: 60, roof: "#5a1a1a" },
  { x: 450, y: 802, w: 70, h: 48, roof: "#3b2a1a" },
  { x: 540, y: 786, w: 104, h: 66, roof: "#6b1d22" },
  { x: 1130, y: 790, w: 84, h: 56, roof: "#4a1a1a" },
  { x: 1240, y: 798, w: 72, h: 50, roof: "#3b2a1a" },
];

const windowsOf = (hs: House[]) =>
  hs.flatMap((h, k) =>
    [0.22, 0.6].map((fx) => ({
      key: `${k}-${fx}`,
      x: h.x + h.w * fx,
      y: h.y - h.h * 0.62,
      w: h.w * 0.18,
      hh: h.h * 0.3,
    })),
  );
const windows = windowsOf(houses);

/** Ornament lights on the big tree, split in two sets that blink in turn. */
const TREE = { x: 215, base: 880, h: 420 };
const ORNAMENT_COLORS = ["#ff3b4f", "#ffcf4a", "#6cc8ff", "#fff4dc", "#3fd98a"];
const ornaments = Array.from({ length: 34 }, (_, i) => {
  const t = 0.12 + rand() * 0.8;
  const half = TREE.h * 0.36 * t;
  return {
    i,
    x: TREE.x + (rand() * 2 - 1) * half * 0.85,
    y: TREE.base - TREE.h + TREE.h * t,
    color: ORNAMENT_COLORS[i % ORNAMENT_COLORS.length],
  };
});

/** Soft out-of-focus fairy lights floating in front of the scene. */
const BOKEH_COLORS = ["#ffbe5a", "#ff465a", "#78e6a0", "#ffe6aa"];
const bokeh = Array.from({ length: 18 }, (_, i) => ({
  i,
  x: rand() * 1600,
  y: rand() * 900,
  r: 40 + rand() * 75,
  color: i % BOKEH_COLORS.length,
}));

const Layer = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <svg
    className={`winter__layer ${className}`}
    viewBox={VIEW}
    preserveAspectRatio={FIT}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Twinkles = ({ odd }: { odd: boolean }) => (
  <Layer className={`winter__twinkle winter__twinkle--${odd ? "b" : "a"}`}>
    <defs>
      {BOKEH_COLORS.map((c, k) => (
        <radialGradient key={c} id={`w-bokeh-${odd ? "b" : "a"}-${k}`}>
          <stop offset="0" stopColor={c} stopOpacity="0.45" />
          <stop offset="0.55" stopColor={c} stopOpacity="0.16" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
      ))}
    </defs>
    {bokeh
      .filter((b) => b.i % 2 === Number(odd))
      .map((b) => (
        <circle
          key={b.i}
          cx={b.x}
          cy={b.y}
          r={b.r}
          fill={`url(#w-bokeh-${odd ? "b" : "a"}-${b.color})`}
        />
      ))}
    {stars
      .filter((s) => s.i % 2 === Number(odd))
      .map((s) => (
        <circle key={s.i} cx={s.x} cy={s.y} r={s.r} fill="#fff" />
      ))}
    {ornaments
      .filter((o) => o.i % 2 === Number(odd))
      .map((o) => (
        <g key={o.i}>
          <circle cx={o.x} cy={o.y} r="11" fill={o.color} opacity="0.3" />
          <circle cx={o.x} cy={o.y} r="4.5" fill={o.color} />
        </g>
      ))}
  </Layer>
);

export const WinterScene = memo(() => (
  <div className="winter" aria-hidden="true">
    <Layer className="winter__scene">
      <defs>
        <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050d1f" />
          <stop offset="0.45" stopColor="#0b2240" />
          <stop offset="0.75" stopColor="#173a52" />
        </linearGradient>
        <radialGradient id="w-moon-glow">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="w-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b5a78" />
          <stop offset="0.35" stopColor="#1a3450" />
        </linearGradient>
        <linearGradient id="w-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d97b2" />
          <stop offset="0.5" stopColor="#3d5874" />
        </linearGradient>
        <linearGradient id="w-snow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c3d3e3" />
          <stop offset="1" stopColor="#7590ab" />
        </linearGradient>
        <radialGradient id="w-window-glow">
          <stop offset="0" stopColor="#ffb347" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="w-ground-glow" cx="0.5" cy="1" r="0.7">
          <stop offset="0" stopColor="#ff9a3c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#w-sky)" />
      <circle cx="1240" cy="150" r="230" fill="url(#w-moon-glow)" />
      <circle cx="1240" cy="150" r="54" fill="#fff6dc" />
      <circle cx="1222" cy="138" r="10" fill="#efe3c2" />
      <circle cx="1258" cy="168" r="7" fill="#efe3c2" />
      {/* Far mountains with snowy tops */}
      <path
        d="M0 560 L110 470 L210 530 L350 400 L470 510 L600 440 L730 535 L860 420 L990 520 L1110 455 L1250 540 L1390 430 L1510 515 L1600 470 L1600 900 L0 900 Z"
        fill="url(#w-far)"
      />
      {/* Mid hill + forest */}
      <path
        d="M0 618 C 200 560, 330 600, 500 640 S 820 600, 1000 590 S 1350 650, 1600 600 L1600 900 L0 900 Z"
        fill="url(#w-mid)"
      />
      <g fill="#0b2219">
        {forest.map((t) => (
          <path key={`${t.x}`} d={pine(t.x, t.y, t.h)} />
        ))}
      </g>
      <g fill="#dce8f2" opacity="0.55">
        {forest.map((t) => (
          <path
            key={`${t.x}`}
            d={`M${t.x} ${t.y - t.h} L${t.x + t.h * 0.07} ${t.y - t.h * 0.86} L${t.x - t.h * 0.07} ${t.y - t.h * 0.86} Z`}
          />
        ))}
      </g>
      {/* Snowy foreground */}
      <path
        d="M0 770 C 260 700, 520 760, 800 750 S 1300 720, 1600 735 L1600 900 L0 900 Z"
        fill="url(#w-snow)"
      />
      <rect x="0" y="600" width="1600" height="300" fill="url(#w-ground-glow)" />
      {/* Village */}
      {houses.map((h) => (
        <g key={h.x}>
          <rect x={h.x} y={h.y - h.h} width={h.w} height={h.h} fill="#2a1712" />
          <path
            d={`M${h.x - 10} ${h.y - h.h} L${h.x + h.w / 2} ${h.y - h.h - h.w * 0.45} L${h.x + h.w + 10} ${h.y - h.h} Z`}
            fill={h.roof}
          />
          <path
            d={`M${h.x - 12} ${h.y - h.h + 2} L${h.x + h.w / 2} ${h.y - h.h - h.w * 0.45 - 4} L${h.x + h.w + 12} ${h.y - h.h + 2}`}
            fill="none"
            stroke="#eef4fa"
            strokeWidth="7"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      ))}
      {windows.map((w) => (
        <g key={w.key}>
          <circle cx={w.x + w.w / 2} cy={w.y + w.hh / 2} r={w.w * 2.2} fill="url(#w-window-glow)" />
          <rect x={w.x} y={w.y} width={w.w} height={w.hh} rx="2" fill="#ffd27a" />
        </g>
      ))}
      {/* Snowman */}
      <g transform="translate(740 768)">
        <ellipse cx="0" cy="0" rx="34" ry="30" fill="#e6eef6" />
        <circle cx="0" cy="-44" r="23" fill="#eef4fa" />
        <circle cx="0" cy="-80" r="16" fill="#f4f8fc" />
        <rect x="-15" y="-104" width="30" height="16" fill="#1a1a1a" />
        <rect x="-21" y="-90" width="42" height="5" fill="#1a1a1a" />
        <path d="M0 -79 L20 -75 L0 -73 Z" fill="#ff8a1f" />
        <path d="M-17 -64 Q0 -56 17 -64 L20 -54 Q0 -48 -20 -54 Z" fill="#c8243b" />
      </g>
      {/* Big Christmas tree */}
      <rect x={TREE.x - 14} y={TREE.base - 40} width="28" height="40" fill="#3b2412" />
      <path d={pine(TREE.x, TREE.base - 30, TREE.h)} fill="#0f4a28" />
      <path
        d={`M${TREE.x} ${TREE.base - TREE.h - 58} l12 26 28 3 -21 19 6 28 -25 -14 -25 14 6 -28 -21 -19 28 -3 Z`}
        fill="#ffcf4a"
      />
    </Layer>
    <Layer className="winter__aurora">
      <defs>
        <linearGradient id="w-aurora" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3fd98a" stopOpacity="0" />
          <stop offset="0.6" stopColor="#3fd98a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#6cc8ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M-50 260 C 200 120, 420 300, 700 170 S 1150 80, 1650 220 L1650 330 C 1200 200, 1000 330, 700 280 S 200 260, -50 380 Z"
        fill="url(#w-aurora)"
      />
    </Layer>
    <Twinkles odd={false} />
    <Twinkles odd />
    <div className="winter__fire" />
    <div className="winter__shade" />
  </div>
));
