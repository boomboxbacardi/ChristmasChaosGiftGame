import { initials, nameHue } from "../../utils/players";

type Props = { name: string; size?: "sm" | "md" | "lg" };

export const Avatar = ({ name, size = "md" }: Props) => (
  <span
    className={`avatar avatar--${size}`}
    style={{ "--hue": nameHue(name) } as React.CSSProperties}
    aria-hidden="true"
  >
    {initials(name) || "?"}
  </span>
);
