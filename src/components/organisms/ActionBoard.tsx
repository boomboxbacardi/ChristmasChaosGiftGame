import type { ActionTable } from "../../constants/tables";
import type { GamePhase, Player } from "../../types/game";
import { ActionCard } from "../molecules";

type Props = {
  phase: GamePhase;
  table: ActionTable;
  title: string;
  players: Player[];
  current: number;
  pile: number;
  highlightedRoll: number | null;
  isFinal: boolean;
  isSpinning: boolean;
  t: (key: string) => string;
  onForce?: (roll: number) => void;
};

export const ActionBoard = ({
  phase,
  table,
  title,
  players,
  current,
  pile,
  highlightedRoll,
  isFinal,
  isSpinning,
  t,
  onForce,
}: Props) => {
  const prefix = phase === "endgame" ? "endgame" : "warmup";
  return (
    <section className={`board board--${prefix}`} aria-label={title}>
      <header className="board__head">
        <h2>{title}</h2>
        {onForce && <span className="board__debug">{t("board.debugHint")}</span>}
      </header>
      <div className="board__grid">
        {Object.entries(table).map(([key, info]) => {
          const roll = Number(key);
          const isAvailable =
            players.length > 0 && (!info.requires || info.requires(current, players, pile));
          const isLit = highlightedRoll === roll;
          const state = isLit
            ? isFinal
              ? "final"
              : "lit"
            : isFinal || isSpinning
              ? "faded"
              : "idle";
          return (
            <ActionCard
              key={roll}
              roll={roll}
              emoji={info.emoji}
              title={t(`actions.${prefix}.${roll}.title`)}
              description={t(`actions.${prefix}.${roll}.desc`)}
              state={state}
              isAvailable={isAvailable}
              unavailableLabel={t("board.unavailable")}
              onClick={onForce ? () => onForce(roll) : undefined}
            />
          );
        })}
      </div>
    </section>
  );
};
