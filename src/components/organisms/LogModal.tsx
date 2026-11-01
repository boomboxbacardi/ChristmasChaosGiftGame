import type { LogEntry, Message } from "../../types/game";
import { Modal } from "../molecules";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  log: LogEntry[];
  t: (key: string) => string;
  tm: (msg: Message) => string;
};

export const LogModal = ({ isOpen, onClose, log, t, tm }: Props) => (
  <Modal isOpen={isOpen} onClose={onClose} labelledBy="log-title">
    <div className="sheet">
      <header className="sheet__head">
        <h2 id="log-title">{t("log.title")}</h2>
        <button type="button" className="sheet__close" onClick={onClose} aria-label={t("log.close")}>
          ✕
        </button>
      </header>
      {log.length === 0 ? (
        <p className="muted">{t("log.empty")}</p>
      ) : (
        <ol className="log-list">
          {log.map((entry, idx) => (
            <li key={entry.id} className={`log-list__item log-list__item--${entry.phase ?? "warmup"}`}>
              <span className="log-list__num">{log.length - idx}</span>
              {tm(entry)}
            </li>
          ))}
        </ol>
      )}
    </div>
  </Modal>
);
