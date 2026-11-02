import { type ReactNode, useEffect, useRef } from "react";
import { seatAngle, seatPosition } from "../../game/seating";
import { emitFx, prefersReducedMotion } from "../../utils/fx";
import type { Direction, FxKind, Package } from "../../types/game";
import { Seat, type SeatState } from "../molecules";

export type TableSeat = SeatState & {
  key: string;
  name: string;
  packages?: Package[];
  delta?: number;
  badge?: string;
};

type Props = {
  seats: TableSeat[];
  center?: ReactNode;
  emptyLabel?: string;
  showGifts?: boolean;
  /** Arrows between seats. */
  links?: { from: number; to: number; kind: FxKind }[];
  linkKey?: number;
  rotation?: { direction: Direction; label: string; sub?: string; key: number };
  isShuffling?: boolean;
  deltaKey?: number;
};

const RADIUS = 40;
const BULBS = 28;
const BULB_COLORS = ["#ff2e4d", "#ffd23f", "#2ee6a6", "#7fdcff"];

/** Fairy lights strung around the table edge, split in two sets that twinkle in turn. */
const bulbs = Array.from({ length: BULBS }, (_, i) => {
  const rad = ((360 / BULBS) * i * Math.PI) / 180;
  return {
    i,
    x: 50 + Math.cos(rad) * 31.6,
    y: 50 + Math.sin(rad) * 31.6,
    color: BULB_COLORS[i % 4],
  };
});

const BulbSet = ({ odd }: { odd: boolean }) => (
  <svg
    className={`round-table__bulbs round-table__bulbs--${odd ? "b" : "a"}`}
    viewBox="0 0 100 100"
    aria-hidden="true"
  >
    {bulbs
      .filter((b) => b.i % 2 === Number(odd))
      .map((b) => (
        <g key={b.i}>
          <circle cx={b.x} cy={b.y} r="1.6" fill={b.color} opacity="0.35" />
          <circle cx={b.x} cy={b.y} r="0.75" fill={b.color} />
          <circle cx={b.x - 0.25} cy={b.y - 0.25} r="0.25" fill="#fff" opacity="0.8" />
        </g>
      ))}
  </svg>
);

/** Keeps the turn pointer turning the short way round instead of unwinding a full lap. */
const useUnwrappedAngle = (target: number | null) => {
  const angle = useRef<number | null>(null);
  if (target === null) return angle.current;
  if (angle.current === null) {
    angle.current = target;
  } else {
    const diff = ((((target - angle.current) % 360) + 540) % 360) - 180;
    angle.current += diff;
  }
  return angle.current;
};

const linkCurve = (from: number, to: number, count: number) => {
  const a = seatPosition(from, count, RADIUS - 9);
  const b = seatPosition(to, count, RADIUS - 9);
  // Bend the arrow through the table centre for a dramatic swoosh.
  const c = {
    x: (a.x + b.x) / 2 + (50 - (a.x + b.x) / 2) * 0.6,
    y: (a.y + b.y) / 2 + (50 - (a.y + b.y) / 2) * 0.6,
  };
  return { a, b, c };
};

const linkPath = (from: number, to: number, count: number) => {
  const { a, b, c } = linkCurve(from, to, count);
  return `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
};

/**
 * A gift flying along an arrow. Driven by the Web Animations API on transform
 * and opacity only, so it runs on the compositor (SVG/SMIL emoji repainted every frame).
 */
const Flyer = ({
  from,
  to,
  count,
  glyph,
  delay,
}: { from: number; to: number; count: number; glyph: string; delay: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el?.animate || prefersReducedMotion()) return undefined;
    const { a, b, c } = linkCurve(from, to, count);
    const steps = 12;
    const frames = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      const u = 1 - t;
      const x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
      const y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
      const scale = 0.6 + Math.sin(t * Math.PI) * 1.1;
      return {
        transform: `translate(${x}cqw, ${y}cqw) translate(-50%, -50%) scale(${scale})`,
        opacity: t < 0.08 || t > 0.94 ? 0 : 1,
      };
    });
    const anim = el.animate(frames, {
      duration: 900,
      delay,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "both",
    });
    return () => anim.cancel();
  }, [from, to, count, delay]);
  return (
    <span ref={ref} className="round-table__flyer" aria-hidden="true">
      {glyph}
    </span>
  );
};

export const RoundTable = ({
  seats,
  center,
  emptyLabel,
  showGifts = true,
  links = [],
  linkKey,
  rotation,
  isShuffling,
  deltaKey,
}: Props) => {
  const count = seats.length;
  const density = count > 12 ? "xs" : count > 8 ? "sm" : "md";
  const rootRef = useRef<HTMLDivElement>(null);
  const activeIdx = seats.findIndex((s) => s.isActive);
  const pointerAngle = useUnwrappedAngle(
    activeIdx >= 0 && count > 1 ? seatAngle(activeIdx, count) + 90 : null,
  );
  const top = Math.max(0, ...seats.map((s) => s.packages?.length ?? 0));
  const leaders =
    top >= 2 && seats.filter((s) => (s.packages?.length ?? 0) === top).length <= 3 ? top : null;

  // Confetti fountains out of every seat that won or lost gifts.
  useEffect(() => {
    if (deltaKey === undefined || prefersReducedMotion()) return undefined;
    const timer = window.setTimeout(() => {
      const nodes =
        rootRef.current?.querySelectorAll<HTMLElement>(".seat--gain, .seat--loss") ?? [];
      const each = Math.max(14, Math.round(90 / Math.max(1, nodes.length)));
      for (const node of nodes) {
        const box = node.querySelector(".avatar")?.getBoundingClientRect();
        if (!box) continue;
        emitFx({
          kind: node.classList.contains("seat--gain") ? "gain" : "loss",
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
          count: each,
        });
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [deltaKey]);

  return (
    <div
      ref={rootRef}
      className={`round-table round-table--${density} ${isShuffling ? "round-table--shuffling" : ""}`}
    >
      {pointerAngle !== null && activeIdx >= 0 && (
        <div
          className="round-table__pointer"
          style={{ transform: `rotate(${pointerAngle}deg)` }}
          aria-hidden="true"
        >
          <span className="round-table__beam" />
        </div>
      )}
      <div className="round-table__felt">
        <div className="round-table__rim" aria-hidden="true" />
        {pointerAngle !== null && activeIdx >= 0 && (
          <div
            className="round-table__needle"
            style={{ transform: `rotate(${pointerAngle}deg)` }}
            aria-hidden="true"
          >
            <span />
          </div>
        )}
        {rotation && (
          <div
            key={rotation.key}
            className={`round-table__spin round-table__spin--${rotation.direction}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 100 100">
              <defs>
                <marker
                  id="spin-head"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
                </marker>
              </defs>
              {[0, 120, 240].map((start) => (
                <path
                  key={start}
                  d="M 50 8 A 42 42 0 0 1 86.4 29"
                  transform={`rotate(${start} 50 50)`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  markerEnd={rotation.direction === "left" ? "url(#spin-head)" : undefined}
                  markerStart={rotation.direction === "right" ? "url(#spin-head)" : undefined}
                />
              ))}
            </svg>
          </div>
        )}
        <div className="round-table__center">
          {rotation ? (
            <span key={rotation.key} className="round-table__dir">
              {rotation.label}
              {rotation.sub && <small>{rotation.sub}</small>}
            </span>
          ) : (
            center
          )}
        </div>
      </div>
      <BulbSet odd={false} />
      <BulbSet odd />
      {links.length > 0 && count > 1 && (
        <svg key={linkKey} className="round-table__links" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            {(["give", "steal", "swap"] as const).map((kind) => (
              <marker
                key={kind}
                id={`link-head-${kind}`}
                className={`round-table__head--${kind}`}
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
              </marker>
            ))}
          </defs>
          {links.map((link, i) => {
            const d =
              link.kind === "steal"
                ? linkPath(link.to, link.from, count)
                : linkPath(link.from, link.to, count);
            return (
              <g key={`${link.from}-${link.to}-${i}`}>
                <path
                  className={`round-table__link round-table__link--${link.kind}`}
                  style={{ animationDelay: `${i * 0.35}s` }}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  markerEnd={`url(#link-head-${link.kind})`}
                  markerStart={link.kind === "swap" ? `url(#link-head-${link.kind})` : undefined}
                />
                {/* A gift physically flies along the arrow (both ways for a swap). */}
              </g>
            );
          })}
        </svg>
      )}
      {links.length > 0 &&
        count > 1 &&
        links.flatMap((link, i) => {
          const glyph = link.kind === "steal" ? "💰" : "🎁";
          const delay = 250 + i * 350;
          // Steals fly from the victim to the thief; swaps fly both ways.
          const legs =
            link.kind === "steal"
              ? [[link.to, link.from]]
              : link.kind === "swap"
                ? [
                    [link.from, link.to],
                    [link.to, link.from],
                  ]
                : [[link.from, link.to]];
          return legs.map(([f, t]) => (
            <Flyer
              key={`${linkKey}-${i}-${f}-${t}`}
              from={f}
              to={t}
              count={count}
              glyph={glyph}
              delay={delay}
            />
          ));
        })}
      {seats.map(({ key, ...seat }, idx) => {
        const pos = seatPosition(idx, count, RADIUS);
        return (
          <Seat
            key={key}
            {...seat}
            x={pos.x}
            y={pos.y}
            emptyLabel={emptyLabel}
            showGifts={showGifts}
            deltaKey={deltaKey}
            isLeader={leaders !== null && (seat.packages?.length ?? 0) === leaders}
          />
        );
      })}
    </div>
  );
};
