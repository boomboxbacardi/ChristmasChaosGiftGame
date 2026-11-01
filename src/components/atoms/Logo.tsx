type Props = { size?: "sm" | "xl"; onClick?: () => void };

export const Logo = ({ size = "sm", onClick }: Props) => (
  <span className={`logo logo--${size}`} onClick={onClick} aria-label="Christmas Chaos">
    <span className="logo__line logo__line--top" aria-hidden="true">
      {"CHRISTMAS".split("").map((ch, i) => (
        <span key={i} style={{ "--i": i } as React.CSSProperties}>
          {ch}
        </span>
      ))}
    </span>
    <span className="logo__line logo__line--bottom" aria-hidden="true">
      CHAOS
    </span>
  </span>
);
