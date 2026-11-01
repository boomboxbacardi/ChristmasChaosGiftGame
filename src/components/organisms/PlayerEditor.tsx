import { type FormEvent, useState } from "react";
import type { ChaosGame } from "../../hooks/useChaosGame";
import { Avatar } from "../atoms";

type Props = { game: ChaosGame };

export const PlayerEditor = ({ game }: Props) => {
  const { t } = game;
  const [draft, setDraft] = useState("");
  const count = game.names.filter((n) => n.trim()).length;
  const isFull = game.names.length >= game.maxPlayers;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    game.addNames(draft);
    setDraft("");
  };

  return (
    <div className="editor">
      <section className="panel">
        <header className="panel__head">
          <h2>{t("setup.players.title")}</h2>
          <span className="chip">{t("setup.players.count", { count })}</span>
        </header>
        <p className="panel__hint">{t("setup.players.hint")}</p>
        <ul className="name-list">
          {game.names.map((name, idx) => (
            <li key={idx} className="name-row" style={{ "--i": idx } as React.CSSProperties}>
              <Avatar name={name || "?"} size="sm" />
              <input
                value={name}
                onChange={(e) => game.renamePlayer(idx, e.target.value)}
                aria-label={`${t("setup.players.placeholder")} ${idx + 1}`}
                placeholder={t("setup.players.placeholder")}
                maxLength={24}
              />
              <button
                type="button"
                className="name-row__remove"
                onClick={() => game.removePlayer(idx)}
                aria-label={t("setup.players.remove", { name: name || `${idx + 1}` })}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <form className="name-add" onSubmit={submit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (/[,;\n\t]/.test(text)) {
                e.preventDefault();
                game.addNames(text);
              }
            }}
            placeholder={t("setup.players.placeholder")}
            aria-label={t("setup.players.placeholder")}
            maxLength={200}
            disabled={isFull}
          />
          <button type="submit" className="btn btn--candy" disabled={!draft.trim() || isFull}>
            + {t("setup.players.add")}
          </button>
        </form>
      </section>

      <section className="panel">
        <header className="panel__head">
          <h2>{t("setup.pile.title")}</h2>
        </header>
        <div className="stepper">
          <button
            type="button"
            className="stepper__btn"
            onClick={() => game.setSetupPile(game.setupPile - 1)}
            aria-label="−1"
            disabled={game.setupPile <= 1}
          >
            −
          </button>
          <label className="stepper__value">
            <span aria-hidden="true">🎁</span>
            <input
              inputMode="numeric"
              value={game.setupPile}
              onChange={(e) => game.setSetupPile(Number(e.target.value.replace(/\D/g, "")))}
              aria-label={t("setup.pile.title")}
            />
          </label>
          <button
            type="button"
            className="stepper__btn"
            onClick={() => game.setSetupPile(game.setupPile + 1)}
            aria-label="+1"
          >
            +
          </button>
        </div>
        <p className="panel__hint">
          {t("setup.pile.hint", { suggested: game.suggestedPile, per: 2 })}{" "}
          {game.setupPile !== game.suggestedPile && (
            <button type="button" className="link-btn" onClick={game.applySuggestedPile}>
              {t("setup.pile.auto", { suggested: game.suggestedPile })}
            </button>
          )}
        </p>
      </section>

      {game.setupError && (
        <p className="error" role="alert">
          {game.tm(game.setupError)}
        </p>
      )}

      <button type="button" className="mega-btn" onClick={() => void game.shuffleSeating()}>
        <span className="mega-btn__die" aria-hidden="true">
          🪑
        </span>
        <span>{t("setup.cta.seat")}</span>
      </button>
    </div>
  );
};
