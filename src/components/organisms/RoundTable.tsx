import type { ReactNode } from "react";
import { seatPosition } from "../../game/seating";
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
  /** Draw an arrow between seats (actor first). */
  link?: { from: number; to: number; kind: FxKind; key: number };
  rotation?: { direction: Direction; label: string; key: number };
  isShuffling?: boolean;
  deltaKey?: number;
};

const RADIUS = 40;

const linkPath = (from: number, to: number, count: number) => {
  const a = seatPosition(from, count, RADIUS - 9);
  const b = seatPosition(to, count, RADIUS - 9);
  // Bend the arrow through the table centre for a dramatic swoosh.
  const cx = (a.x + b.x) / 2 + (50 - (a.x + b.x) / 2) * 0.6;
  const cy = (a.y + b.y) / 2 + (50 - (a.y + b.y) / 2) * 0.6;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
};

export const RoundTable = ({
  seats,
  center,
  emptyLabel,
  showGifts = true,
  link,
  rotation,
  isShuffling,
  deltaKey,
}: Props) => {
  const count = seats.length;
  const density = count > 12 ? "xs" : count > 8 ? "sm" : "md";
  return (
    <div
      className={`round-table round-table--${density} ${isShuffling ? "round-table--shuffling" : ""}`}
    >
      <div className="round-table__felt">
        <div className="round-table__rim" aria-hidden="true" />
        {rotation && (
          <div
            key={rotation.key}
            className={`round-table__spin round-table__spin--${rotation.direction}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 100 100">
              <defs>
                <marker id="spin-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
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
            </span>
          ) : (
            center
          )}
        </div>
      </div>
      {link && count > 1 && (
        <svg key={link.key} className={`round-table__link round-table__link--${link.kind}`} viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <marker id="link-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
          </defs>
          <path
            d={link.kind === "steal" ? linkPath(link.to, link.from, count) : linkPath(link.from, link.to, count)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            markerEnd="url(#link-head)"
            markerStart={link.kind === "swap" ? "url(#link-head)" : undefined}
          />
        </svg>
      )}
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
          />
        );
      })}
    </div>
  );
};
