import type { Player } from "../../types/game";
import { Avatar, GiftPile } from "../atoms";
import { Modal } from "../molecules";

type Props = {
  isOpen: boolean;
  players: Player[];
  t: (key: string, params?: Record<string, string | number>) => string;
  onClose: () => void;
  onAgain: () => void;
};

const winnersBy = (players: Player[], score: (p: Player) => number) => {
  const best = Math.max(...players.map(score));
  return { best, names: players.filter((p) => score(p) === best).map((p) => p.name) };
};

export const EndScreen = ({ isOpen, players, t, onClose, onAgain }: Props) => {
  const ranked = [...players].sort((a, b) => b.packages.length - a.packages.length);
  const most = winnersBy(players, (p) => p.packages.length);
  const frozen = winnersBy(players, (p) => p.packages.filter((pkg) => pkg.locked).length);
  const empty = players.filter((p) => !p.packages.length).map((p) => p.name);
  const awards = [
    most.best > 0 && { icon: "👑", title: t("end.award.most"), who: most.names.join(" & ") },
    frozen.best > 0 && { icon: "🧊", title: t("end.award.frozen"), who: frozen.names.join(" & ") },
    empty.length > 0 && { icon: "🥶", title: t("end.award.none"), who: empty.join(" & ") },
  ].filter(Boolean) as { icon: string; title: string; who: string }[];

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="end-title" variant="takeover">
      <div className="takeover takeover--victory">
        <span className="takeover__kicker">{t("end.kicker")}</span>
        <h2 id="end-title" className="takeover__title" data-text={t("end.title")}>
          {t("end.title")}
        </h2>
        <p className="takeover__body">{t("end.body")}</p>
        {awards.length > 0 && (
          <ul className="awards">
            {awards.map((a) => (
              <li key={a.title} className="award">
                <span className="award__icon" aria-hidden="true">
                  {a.icon}
                </span>
                <span className="award__title">{a.title}</span>
                <strong className="award__who">{a.who}</strong>
              </li>
            ))}
          </ul>
        )}
        <ol className="standings">
          {ranked.map((p) => (
            <li key={p.id} className="standings__row">
              <Avatar name={p.name} size="sm" />
              <span className="standings__name">{p.name}</span>
              <GiftPile packages={p.packages} max={10} emptyLabel="—" />
              <span className="standings__count">
                {p.packages.length === 1 ? t("end.gift") : t("end.gifts", { count: p.packages.length })}
              </span>
            </li>
          ))}
        </ol>
        <div className="takeover__actions">
          <button type="button" className="mega-btn" onClick={onAgain}>
            <span className="mega-btn__die" aria-hidden="true">
              🔁
            </span>
            <span>{t("end.again")}</span>
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t("end.close")}
          </button>
        </div>
      </div>
    </Modal>
  );
};
