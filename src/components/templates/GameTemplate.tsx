import { getPhaseTable } from "../../constants/tables";
import type { ChaosGame } from "../../hooks/useChaosGame";
import { ActionBoard, RoundTable, StagePanel } from "../organisms";

type Props = { game: ChaosGame };

export const GameTemplate = ({ game }: Props) => {
  const { t, result, phase, players } = game;
  const boardPhase = phase === "ended" ? "endgame" : phase;
  const showResult = game.stage === "result" && result;

  const seats = players.map((p, idx) => ({
    key: p.id,
    name: p.name,
    packages: p.packages,
    isActive: idx === game.current && phase !== "ended",
    isTargeted: game.stage === "targeting" && game.targetSeats.includes(idx),
    isInvolved: Boolean(showResult && result.fx !== "rotate" && result.seats.includes(idx)),
    delta: showResult ? result.deltas[p.id] : undefined,
  }));

  const link =
    showResult && result.seats.length === 2 && ["give", "steal", "swap"].includes(result.fx)
      ? { from: result.seats[0], to: result.seats[1], kind: result.fx, key: result.key }
      : undefined;

  const rotation =
    showResult && result.fx === "rotate" && result.direction
      ? {
          direction: result.direction,
          label: `${result.direction === "left" ? "↻" : "↺"} ${t(
            result.direction === "left" ? "table.left" : "table.right"
          )}`,
          key: result.key,
        }
      : undefined;

  return (
    <main className="game">
      <div className="game__table">
        <RoundTable
          seats={seats}
          emptyLabel={t("table.empty")}
          link={link}
          rotation={rotation}
          deltaKey={result?.key}
          center={
            <div className="table-center">
              {phase === "warmup" ? (
                <>
                  <span className="table-center__big table-center__pile">🎁</span>
                  <span className="table-center__count">{game.pile}</span>
                  <span className="table-center__label">{t("table.pile")}</span>
                </>
              ) : phase === "endgame" ? (
                <>
                  <span className="table-center__big">🔥</span>
                  <span className="table-center__label">{t("phase.endgame.short")}</span>
                </>
              ) : (
                <>
                  <span className="table-center__big">🎉</span>
                  <span className="table-center__label">{t("phase.ended")}</span>
                </>
              )}
            </div>
          }
        />
      </div>
      <div className="game__side">
        <StagePanel game={game} />
        <ActionBoard
          phase={boardPhase}
          table={getPhaseTable(boardPhase)}
          title={t(boardPhase === "endgame" ? "board.endgame" : "board.warmup")}
          players={players}
          current={game.current}
          pile={game.pile}
          highlightedRoll={game.highlightedRoll}
          isFinal={game.isFinal}
          isSpinning={game.stage === "spinning"}
          t={t}
          onForce={game.debug && phase !== "ended" ? (roll) => void game.roll(roll) : undefined}
        />
      </div>
    </main>
  );
};
