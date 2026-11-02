import { memo } from "react";
import type { Package } from "../../types/game";
import { Avatar, GiftPile } from "../atoms";

export type SeatState = {
  isActive?: boolean;
  isTargeted?: boolean;
  isInvolved?: boolean;
  isStarter?: boolean;
  isDimmed?: boolean;
};

type Props = SeatState & {
  name: string;
  packages?: Package[];
  delta?: number;
  deltaKey?: number;
  x: number;
  y: number;
  emptyLabel?: string;
  badge?: string;
  showGifts?: boolean;
};

/** Memoised: the table re-renders on every dice hop, but seats rarely change. */
export const Seat = memo(
  ({
    name,
    packages = [],
    delta,
    deltaKey,
    x,
    y,
    emptyLabel,
    badge,
    showGifts = true,
    isActive,
    isTargeted,
    isInvolved,
    isStarter,
    isDimmed,
  }: Props) => {
    const classes = [
      "seat",
      isActive && "seat--active",
      isTargeted && "seat--targeted",
      isInvolved && "seat--involved",
      isStarter && "seat--starter",
      isDimmed && "seat--dimmed",
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div className={classes} style={{ left: `${x}%`, top: `${y}%` }}>
        <div className="seat__avatar-wrap">
          {isActive && (
            <span className="seat__crown" aria-hidden="true">
              🎲
            </span>
          )}
          <Avatar name={name} />
          {delta ? (
            <span key={deltaKey} className={`seat__delta ${delta > 0 ? "is-up" : "is-down"}`}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          ) : null}
          {badge ? <span className="seat__badge">{badge}</span> : null}
        </div>
        <span className="seat__name">{name}</span>
        {showGifts && <GiftPile packages={packages} max={6} emptyLabel={emptyLabel} />}
      </div>
    );
  },
);
