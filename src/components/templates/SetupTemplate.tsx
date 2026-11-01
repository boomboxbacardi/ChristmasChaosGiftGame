import type { ChaosGame } from "../../hooks/useChaosGame";
import { neighbourNames } from "../../game/seating";
import { Logo } from "../atoms";
import { PlayerEditor, RoundTable } from "../organisms";

type Props = { game: ChaosGame };

const Steps = ({ game }: Props) => {
  const steps = ["players", "seats", "play"] as const;
  const active = game.setupStep === "players" ? 0 : 1;
  return (
    <ol className="steps" aria-label="Progress">
      {steps.map((step, idx) => (
        <li key={step} className={`steps__item ${idx === active ? "is-active" : idx < active ? "is-done" : ""}`}>
          <span className="steps__num">{idx + 1}</span>
          {game.t(`setup.step.${step}`)}
        </li>
      ))}
    </ol>
  );
};

export const SetupTemplate = ({ game }: Props) => {
  const { t } = game;

  if (game.setupStep === "players") {
    return (
      <main className="setup">
        <section className="hero">
          <Logo size="xl" />
          <p className="hero__tagline">{t("brand.tagline")}</p>
          <p className="hero__pitch">{t("brand.pitch")}</p>
          <div className="hero__gifts" aria-hidden="true">
            {["🎁", "🎄", "🥷", "🧊", "🎅", "🔥", "🎁"].map((g, i) => (
              <span key={i} style={{ "--i": i } as React.CSSProperties}>
                {g}
              </span>
            ))}
          </div>
        </section>
        <Steps game={game} />
        <PlayerEditor game={game} />
      </main>
    );
  }

  const isPickingStarter = game.starterSeat !== null;
  const starterName = game.starterSeat !== null ? game.seatOrder[game.starterSeat] : "";
  const seats = game.seatOrder.map((name, idx) => ({
    key: game.isShufflingSeats ? `${idx}` : name,
    name,
    isActive: game.starterSeat === idx,
    isStarter: game.starterLocked && game.starterSeat === idx,
    isDimmed: game.starterLocked && game.starterSeat !== idx,
  }));

  return (
    <main className="seating">
      <Steps game={game} />
      <header className="seating__head">
        <h1 className="display">{game.isShufflingSeats ? t("seating.shuffling") : t("seating.title")}</h1>
        <p>{t("seating.subtitle")}</p>
      </header>
      <div className="seating__layout">
        <RoundTable
          seats={seats}
          showGifts={false}
          isShuffling={game.isShufflingSeats}
          center={
            <div className="table-center">
              {isPickingStarter ? (
                <>
                  <span className="table-center__big">{game.starterLocked ? "🎉" : "🔦"}</span>
                  <span className="table-center__label">
                    {game.starterLocked ? t("seating.starter", { name: starterName }) : t("seating.pickingStarter")}
                  </span>
                </>
              ) : (
                <>
                  <span className="table-center__big">🎄</span>
                  <span className="table-center__label">↻ {t("table.clockwise")}</span>
                </>
              )}
            </div>
          }
        />
        <aside className="panel seating__list">
          <h2>{t("seating.listTitle")}</h2>
          <ol>
            {game.seatOrder.map((name, idx) => {
              const n = neighbourNames(
                game.seatOrder.map((s) => ({ name: s })),
                idx
              );
              return (
                <li key={`${name}-${idx}`} className={game.starterSeat === idx ? "is-lit" : ""}>
                  <span className="seating__seat">{idx + 1}</span>
                  <span>
                    <strong>{name}</strong>
                    <small>{t("seating.neighbours", { left: n.left, right: n.right })}</small>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="seating__actions">
            <button
              type="button"
              className="mega-btn"
              onClick={() => void game.startGame()}
              disabled={game.isShufflingSeats || isPickingStarter}
            >
              <span className="mega-btn__die" aria-hidden="true">
                🔥
              </span>
              <span>{t("seating.start")}</span>
            </button>
            <div className="seating__secondary">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void game.shuffleSeating()}
                disabled={game.isShufflingSeats || isPickingStarter}
              >
                🔀 {t("seating.reshuffle")}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={game.editPlayers}
                disabled={game.isShufflingSeats || isPickingStarter}
              >
                ✏️ {t("seating.edit")}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};
