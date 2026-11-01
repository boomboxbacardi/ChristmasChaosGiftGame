import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  showLabel?: boolean;
};

export const IconButton = ({ icon, label, onClick, isActive, showLabel = true }: Props) => (
  <button
    type="button"
    className={`icon-btn ${isActive ? "icon-btn--on" : ""}`}
    onClick={onClick}
    aria-label={label}
    aria-pressed={isActive}
    title={label}
  >
    <span aria-hidden="true">{icon}</span>
    {showLabel && <span className="icon-btn__label">{label}</span>}
  </button>
);
