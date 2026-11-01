import { type ReactNode, useEffect, useRef } from "react";

type Props = {
  isOpen: boolean;
  onClose?: () => void;
  labelledBy?: string;
  variant?: "sheet" | "takeover";
  children: ReactNode;
};

/** Accessible overlay: Escape closes, focus moves inside and returns afterwards. */
export const Modal = ({ isOpen, onClose, labelledBy, variant = "sheet", children }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      "button, [href], input, [tabindex]:not([tabindex='-1'])"
    );
    // Takeovers focus the panel itself so tall content starts at the top.
    const first = variant === "takeover" ? panelRef.current : (focusable ?? panelRef.current);
    first?.focus({ preventScroll: true });
    panelRef.current?.scrollTo?.({ top: 0 });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [isOpen, onClose, variant]);

  if (!isOpen) return null;
  return (
    <div className={`overlay overlay--${variant}`} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className={`overlay__panel overlay__panel--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
