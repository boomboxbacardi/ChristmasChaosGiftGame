import { ENDGAME_ROLLS, WARMUP_ROLLS, endgameTable, warmupTable } from "../../constants/tables";
import { Modal } from "../molecules";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export const RulesModal = ({ isOpen, onClose, t }: Props) => (
  <Modal isOpen={isOpen} onClose={onClose} labelledBy="rules-title">
    <div className="sheet">
      <header className="sheet__head">
        <h2 id="rules-title">{t("rules.title")}</h2>
        <button type="button" className="sheet__close" onClick={onClose} aria-label={t("rules.close")}>
          ✕
        </button>
      </header>
      <p>{t("rules.intro")}</p>
      <p className="sheet__note">{t("rules.seats")}</p>
      <div className="rules-grid">
        {(
          [
            ["warmup", warmupTable, t("rules.warmup", { rolls: WARMUP_ROLLS })],
            ["endgame", endgameTable, t("rules.endgame", { rolls: ENDGAME_ROLLS })],
          ] as const
        ).map(([prefix, table, intro]) => (
          <section key={prefix} className={`rules-col rules-col--${prefix}`}>
            <p className="rules-col__intro">{intro}</p>
            <ul>
              {Object.entries(table).map(([roll, info]) => (
                <li key={roll}>
                  <span className="rules-col__emoji" aria-hidden="true">
                    {info.emoji}
                  </span>
                  <span>
                    <strong>
                      {roll}. {t(`actions.${prefix}.${roll}.title`)}
                    </strong>
                    <span className="muted"> {t(`actions.${prefix}.${roll}.desc`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="sheet__note">{t("rules.locked")}</p>
      <p className="sheet__note">{t("rules.miracle")}</p>
      <button type="button" className="btn btn--candy" onClick={onClose}>
        {t("rules.close")}
      </button>
    </div>
  </Modal>
);
