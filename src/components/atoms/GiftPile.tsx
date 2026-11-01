import type { Package } from "../../types/game";

type Props = { packages: Package[]; max?: number; emptyLabel?: string };

/** A little stack of gift icons; frozen gifts are drawn as ice cubes. */
export const GiftPile = ({ packages, max = 8, emptyLabel }: Props) => {
  if (!packages.length) {
    return emptyLabel ? <span className="gift-pile gift-pile--empty">{emptyLabel}</span> : null;
  }
  const sorted = [...packages].sort((a, b) => Number(Boolean(b.locked)) - Number(Boolean(a.locked)));
  const shown = sorted.slice(0, max);
  const extra = packages.length - shown.length;
  return (
    <span className="gift-pile" aria-label={`${packages.length}`}>
      {shown.map((pkg) => (
        <span key={pkg.id} className={`gift ${pkg.locked ? "gift--frozen" : ""}`}>
          {pkg.locked ? "🧊" : "🎁"}
        </span>
      ))}
      {extra > 0 && <span className="gift-pile__more">+{extra}</span>}
    </span>
  );
};
