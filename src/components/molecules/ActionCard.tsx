import { DieFace } from "../atoms";

type Props = {
  roll: number;
  emoji: string;
  title: string;
  description: string;
  state: "idle" | "lit" | "final" | "faded";
  isAvailable: boolean;
  unavailableLabel: string;
  onClick?: () => void;
};

export const ActionCard = ({
  roll,
  emoji,
  title,
  description,
  state,
  isAvailable,
  unavailableLabel,
  onClick,
}: Props) => {
  const className = `action-card action-card--${state} ${isAvailable ? "" : "action-card--off"} ${
    onClick ? "action-card--clickable" : ""
  }`;
  const content = (
    <>
      <span className="action-card__die">
        <DieFace value={roll} />
      </span>
      <span className="action-card__emoji" aria-hidden="true">
        {emoji}
      </span>
      <span className="action-card__text">
        <strong>{title}</strong>
        <span>{isAvailable ? description : unavailableLabel}</span>
      </span>
    </>
  );
  return onClick ? (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={className} aria-current={state === "final" ? "true" : undefined}>
      {content}
    </div>
  );
};
