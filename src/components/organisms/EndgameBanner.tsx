import { Modal } from "../molecules";

type Props = { isOpen: boolean; onClose: () => void; t: (key: string) => string };

export const EndgameBanner = ({ isOpen, onClose, t }: Props) => (
  <Modal isOpen={isOpen} onClose={onClose} labelledBy="endgame-title" variant="takeover">
    <div className="takeover takeover--endgame">
      <span className="takeover__kicker">{t("banner.endgame.kicker")}</span>
      <h2 id="endgame-title" className="takeover__title" data-text={t("banner.endgame.title")}>
        {t("banner.endgame.title")}
      </h2>
      <p className="takeover__body">{t("banner.endgame.body")}</p>
      <button type="button" className="mega-btn mega-btn--fire" onClick={onClose}>
        <span className="mega-btn__die" aria-hidden="true">
          🔥
        </span>
        <span>{t("banner.endgame.cta")}</span>
      </button>
    </div>
  </Modal>
);
