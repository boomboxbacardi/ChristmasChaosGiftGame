import type { ActionTable } from "../../constants/tables";
import type { GamePhase, Player } from "../../types/game";
import { WILD_ROLL } from "../../game/actions";
import { wildcardById } from "../../game/wildcards";
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
  wildShown?: string | null;
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
  wildShown,
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
          const wild = roll === WILD_ROLL && isLit && wildShown ? wildcardById(wildShown) : undefined;
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
              emoji={wild?.emoji ?? info.emoji}
              title={wild ? `⭐ ${t(`wild.${wild.id}.title`)}` : t(`actions.${prefix}.${roll}.title`)}
              isWild={roll === WILD_ROLL}
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
