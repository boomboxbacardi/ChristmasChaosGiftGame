import type { ChaosGame } from "../../hooks/useChaosGame";
import { Logo } from "../atoms";
import { IconButton } from "../molecules";

type Props = {
  game: ChaosGame;
  onRules: () => void;
  onLog?: () => void;
  onReset?: () => void;
  onLogoClick?: () => void;
};

export const TopBar = ({ game, onRules, onLog, onReset, onLogoClick }: Props) => {
  const { t, phase } = game;
  const inGame = phase === "warmup" || phase === "endgame" || phase === "ended";
  return (
    <header className="topbar">
      <Logo onClick={onLogoClick} />
      {inGame && (
        <div className="topbar__status">
          <span className={`chip chip--phase chip--${phase}`}>{t(`phase.${phase}`)}</span>
          {phase === "warmup" && (
            <span className="chip chip--pile" title={t("bar.pile")}>
              🎁 <strong>{game.pile}</strong> <span className="chip__label">{t("table.pile")}</span>
            </span>
          )}
        </div>
      )}
      <nav className="topbar__tools" aria-label="Settings">
        <IconButton
          icon={game.sound ? "🔊" : "🔇"}
          label={game.sound ? t("bar.sound.on") : t("bar.sound.off")}
          onClick={() => game.setSound(!game.sound)}
          isActive={game.sound}
        />
        <IconButton icon="⚡" label={t("bar.turbo")} onClick={() => game.setTurbo(!game.turbo)} isActive={game.turbo} />
        <IconButton
          icon={game.lang === "sv" ? "🇬🇧" : "🇸🇪"}
          label={t("bar.lang")}
          onClick={() => game.setLang(game.lang === "sv" ? "en" : "sv")}
        />
        <IconButton icon="📜" label={t("bar.rules")} onClick={onRules} />
        {onLog && <IconButton icon="🧾" label={t("bar.log")} onClick={onLog} />}
        {game.debug && inGame && phase !== "ended" && (
          <IconButton icon="⏭️" label={t("bar.debug")} onClick={game.debugSkipPhase} />
        )}
        {onReset && <IconButton icon="↺" label={t("bar.reset")} onClick={onReset} />}
      </nav>
    </header>
  );
};
