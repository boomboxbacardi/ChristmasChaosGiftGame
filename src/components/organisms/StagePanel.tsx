import { useLayoutEffect, useRef } from "react";
import { getPhaseTable } from "../../constants/tables";
import { wildcardById } from "../../game/wildcards";
import type { ChaosGame } from "../../hooks/useChaosGame";
import { Avatar } from "../atoms";

type Props = { game: ChaosGame };

/** The "what's happening now" panel: whose turn, the roll button and the instruction. */
export const StagePanel = ({ game }: Props) => {
  const { t, tm, result, currentPlayer, stage, phase } = game;
  const resultInfo = result && result.roll ? getPhaseTable(result.phase)[result.roll] : null;
  const resultPrefix = result?.phase === "endgame" ? "endgame" : "warmup";
  const name = currentPlayer?.name ?? "";

  const buttonLabel =
    stage === "spinning"
      ? t("stage.spinning")
      : stage === "wild"
        ? `⭐ ${t("stage.wild")}`
        : stage === "targeting"
          ? t(game.targetKind === "pair" ? "stage.targetingPair" : "stage.targeting")
          : phase === "ended"
            ? t("stage.ended")
            : t("stage.roll", { name });

  const bodyRef = useRef<HTMLDivElement>(null);
  const narrativeRef = useRef<HTMLParagraphElement>(null);
  const narrative = result && stage === "result" ? tm(result.narrative) : "";

  // Long stories (wildcards with four names) shrink until they fit: never clipped, never scrolled.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const text = narrativeRef.current;
    if (!body || !text) return undefined;
    const fit = () => {
      text.style.fontSize = "";
      let size = Number.parseFloat(getComputedStyle(text).fontSize);
      while (body.scrollHeight > body.clientHeight + 1 && size > 12) {
        size -= 1;
        text.style.fontSize = `${size}px`;
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [narrative]);

  const showNext = Boolean(result && stage === "result" && currentPlayer && phase !== "ended");

  return (
    <section className={`stage stage--${stage}`} aria-live="polite">
      <div ref={bodyRef} className="stage__body">
        {result && stage === "result" ? (
          <div key={result.key} className={`stage__result stage__result--${result.fx}`}>
            <span className="stage__kicker">{t("stage.lastAction")}</span>
            <div className="stage__result-head">
              <span className="stage__emoji" aria-hidden="true">
                {result.special === "miracle"
                  ? "🌟"
                  : result.wild
                    ? (wildcardById(result.wild)?.emoji ?? "⭐")
                    : (resultInfo?.emoji ?? "🌙")}
              </span>
              <h2 className="stage__title">
                {result.special === "miracle"
                  ? t("stage.miracle")
                  : result.wild
                    ? t(`wild.${result.wild}.title`)
                    : resultInfo
                      ? t(`actions.${resultPrefix}.${result.roll}.title`)
                      : t("stage.calm")}
              </h2>
            </div>
            <p ref={narrativeRef} className="stage__narrative">
              {narrative}
            </p>
          </div>
        ) : (
          <div className="stage__turn">
            {currentPlayer && phase !== "ended" && (
              <>
                <Avatar name={name} size="lg" />
                <div>
                  <h2 className="stage__who">
                    {t("stage.yourTurn", { who: game.possessive(name) })}
                  </h2>
                  <p className="stage__rolls">
                    {game.currentRolls === 1
                      ? t("stage.rollsLeft.one")
                      : t("stage.rollsLeft", { count: game.currentRolls })}
                  </p>
                </div>
              </>
            )}
            {stage === "idle" && phase !== "ended" && (
              <p className="stage__hint">{t("stage.waiting")}</p>
            )}
          </div>
        )}
      </div>

      {/* The dock never changes height, so the roll button stays exactly where the mouse is. */}
      <div className="stage__dock">
        <p
          className={`stage__next ${showNext ? "" : "stage__next--hidden"}`}
          aria-hidden={!showNext}
        >
          {showNext && (
            <>
              <Avatar name={name} size="sm" /> {t("stage.next", { name })}
              <span className="stage__next-rolls">
                {" · "}
                {game.currentRolls === 1
                  ? t("stage.rollsLeft.one")
                  : t("stage.rollsLeft", { count: game.currentRolls })}
              </span>
            </>
          )}
        </p>
        <button
          type="button"
          className={`mega-btn ${game.isBusy ? "mega-btn--busy" : ""}`}
          onClick={() => void game.roll()}
          disabled={!game.canRoll}
        >
          <span className="mega-btn__die" aria-hidden="true">
            🎲
          </span>
          <span className="mega-btn__label">{buttonLabel}</span>
        </button>
      </div>
    </section>
  );
};
