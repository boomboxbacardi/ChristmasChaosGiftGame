import { useEffect, useRef, useState } from "react";
import {
  EndScreen,
  EndgameBanner,
  FxLayer,
  GameTemplate,
  LogModal,
  RulesModal,
  SetupTemplate,
  TopBar,
  WinterScene,
} from "../components";
import { useChaosGame } from "../hooks/useChaosGame";

export const GamePage = () => {
  const game = useChaosGame();
  const { t, phase } = game;
  const [showRules, setShowRules] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const logoClicks = useRef<number[]>([]);
  const inGame = phase !== "setup";

  // Theme the whole page per phase.
  useEffect(() => {
    document.body.dataset.phase = phase;
  }, [phase]);

  // Space / Enter rolls the dice when nothing else has focus.
  const rollRef = useRef(game.roll);
  rollRef.current = game.roll;
  const canRollRef = useRef(game.canRoll);
  canRollRef.current = game.canRoll && !showRules && !showLog;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(target.tagName)) return;
      if ((e.key === " " || e.key === "Enter") && canRollRef.current) {
        e.preventDefault();
        void rollRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Secret: click the logo five times quickly to toggle debug mode.
  const onLogoClick = () => {
    const now = Date.now();
    logoClicks.current = [...logoClicks.current.filter((ts) => now - ts < 1500), now];
    if (logoClicks.current.length >= 5) {
      logoClicks.current = [];
      game.setDebug(!game.debug);
    }
  };

  const onReset = () => {
    if (phase === "ended" || window.confirm(t("bar.resetConfirm"))) game.newGame("players");
  };

  return (
    <div className={`app app--${phase} ${game.debug ? "app--debug" : ""}`}>
      <WinterScene />
      <FxLayer />
      <TopBar
        game={game}
        onRules={() => setShowRules(true)}
        onLog={inGame ? () => setShowLog(true) : undefined}
        onReset={inGame ? onReset : undefined}
        onLogoClick={onLogoClick}
      />
      {inGame ? <GameTemplate game={game} /> : <SetupTemplate game={game} />}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} t={t} />
      <LogModal
        isOpen={showLog}
        onClose={() => setShowLog(false)}
        log={game.log}
        t={t}
        tm={game.tm}
      />
      <EndgameBanner isOpen={game.banner === "endgame"} onClose={game.dismissBanner} t={t} />
      <EndScreen
        isOpen={game.showEnd}
        players={game.players}
        t={t}
        onClose={() => game.setShowEnd(false)}
        onAgain={game.playAgain}
      />
    </div>
  );
};
