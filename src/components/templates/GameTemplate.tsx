import { ReactNode } from 'react'
import { HeroHeader, LastRollCard, OrderModal, StatusStrip } from '../molecules'
import { LogPanel, PlayerListPanel, RandomizerPanel, RulesPanel } from '../organisms'
import { ActionNarrativeModal, GiveAwayModal, StealModal, TargetSelectionModal } from '../organisms/modals'
import { GamePhase, LogEntry, Player, RollOutcome } from '../../types/game'

type GameTemplateProps = {
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    actions: ReactNode
  }
  status: {
    phaseLabel: string
    pileLabel: string
    currentPlayerLabel: string
    playerRollsLabel: string
    totalRollsLabel: string
    pileCount: number
    currentPlayerName: string
    playerRolls: number
    totalRolls: number
  }
  players: Player[]
  currentPlayerIndex: number
  phase: GamePhase
  playerTitle: string
  playerLegend: string
  playerEmptyLabel: string
  log: LogEntry[]
  logTitle: string
  logSubtitle: string
  logEmptyLabel: string
  randomizer: {
    phase: GamePhase
    phaseTable: Record<number, { title: string; description: string }>
    headingWarmup: string
    headingEndgame: string
    hint: string
    hintDebug: string
    highlightedIndex: number | null
    isFinalResult: boolean
    canRoll: boolean
    isSpinning: boolean
    onRoll: (forcedRoll?: number, isDebug?: boolean) => void
    rollLabel: string
    rollLabelSpinning: string
    rollLabelFinished: string
    players: Player[]
    currentPlayerIndex: number
    pileCount: number
    debugMode: boolean
  }
  lastRoll: {
    data: RollOutcome | null
    label: string
    emptyLabel: string
  }
  rules: {
    warmupTable: Record<number, { title: string; description: string }>
    endgameTable: Record<number, { title: string; description: string }>
    warmupTitle: string
    endgameTitle: string
    lockedNote?: string
  }
  giveAwayModal: {
    isOpen: boolean
    actorName: string
    target: string | null
    isRandomizing: boolean
    title: string
    verb: string
    closeLabel: string
    onClose: () => void
  }
  stealModal: {
    isOpen: boolean
    actorName: string
    target: string | null
    isRandomizing: boolean
    title: string
    verb: string
    closeLabel: string
    onClose: () => void
  }
  narrativeModal: {
    isOpen: boolean
    title: string
    narrative: string
    closeLabel: string
    onClose: () => void
  }
  selectionModal: {
    isOpen: boolean
    title: string
    verb: string
    actorName: string
    targetName: string | null
    leadEmoji?: string
    trailEmoji?: string
    isRandomizing: boolean
    onClose: () => void
  }
  orderModal?: {
    isOpen: boolean
    order?: string[]
    heading: string
    subtitle: string
    startLabel: string
    startingLabel: string
    isStarting: boolean
    onStart: () => void
    onClose: () => void
  }
}

export const GameTemplate = ({
  hero,
  status,
  players,
  currentPlayerIndex,
  phase,
  playerTitle,
  playerLegend,
  playerEmptyLabel,
  log,
  logTitle,
  logSubtitle,
  logEmptyLabel,
  randomizer,
  lastRoll,
  rules,
  giveAwayModal,
  stealModal,
  narrativeModal,
  selectionModal,
  orderModal,
}: GameTemplateProps) => (
  <div className={`page ${phase === 'endgame' ? 'endgame' : ''}`}>
    <HeroHeader eyebrow={hero.eyebrow} title={hero.title} subtitle={hero.subtitle} actions={hero.actions} />

    <StatusStrip
      phaseLabel={status.phaseLabel}
      pileLabel={status.pileLabel}
      currentPlayerLabel={status.currentPlayerLabel}
      playerRollsLabel={status.playerRollsLabel}
      totalRollsLabel={status.totalRollsLabel}
      pileCount={status.pileCount}
      currentPlayerName={status.currentPlayerName}
      playerRolls={status.playerRolls}
      totalRolls={status.totalRolls}
    />

    <section className="layout">
      <div className="left-panel">
        <PlayerListPanel
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          phase={phase}
          title={playerTitle}
          legend={playerLegend}
          emptyLabel={playerEmptyLabel}
        />
        <LogPanel log={log} title={logTitle} subtitle={logSubtitle} emptyLabel={logEmptyLabel} />
      </div>

      <div className="right-panel">
        <RandomizerPanel
          phase={randomizer.phase}
          phaseTable={randomizer.phaseTable}
          headingWarmup={randomizer.headingWarmup}
          headingEndgame={randomizer.headingEndgame}
          hint={randomizer.hint}
          hintDebug={randomizer.hintDebug}
          highlightedIndex={randomizer.highlightedIndex}
          isFinalResult={randomizer.isFinalResult}
          canRoll={randomizer.canRoll}
          isSpinning={randomizer.isSpinning}
          onRoll={randomizer.onRoll}
          rollLabel={randomizer.rollLabel}
          rollLabelSpinning={randomizer.rollLabelSpinning}
          rollLabelFinished={randomizer.rollLabelFinished}
          players={randomizer.players}
          currentPlayerIndex={randomizer.currentPlayerIndex}
          pileCount={randomizer.pileCount}
          debugMode={randomizer.debugMode}
          onDebugSelect={(roll) => randomizer.onRoll(roll, true)}
        />

        <LastRollCard lastOutcome={lastRoll.data} label={lastRoll.label} emptyLabel={lastRoll.emptyLabel} />

        <RulesPanel
          warmupTable={rules.warmupTable}
          endgameTable={rules.endgameTable}
          warmupTitle={rules.warmupTitle}
          endgameTitle={rules.endgameTitle}
          lockedNote={rules.lockedNote}
        />
      </div>
    </section>

    {giveAwayModal.isOpen && (
      <GiveAwayModal
        currentPlayerName={giveAwayModal.actorName}
        isRandomizingTarget={giveAwayModal.isRandomizing}
        giveAwayTarget={giveAwayModal.target}
        onClose={giveAwayModal.onClose}
        title={giveAwayModal.title}
        verb={giveAwayModal.verb}
        closeLabel={giveAwayModal.closeLabel}
      />
    )}

    {stealModal.isOpen && (
      <StealModal
        currentPlayerName={stealModal.actorName}
        isRandomizingTarget={stealModal.isRandomizing}
        stealTarget={stealModal.target}
        onClose={stealModal.onClose}
        title={stealModal.title}
        verb={stealModal.verb}
        closeLabel={stealModal.closeLabel}
      />
    )}

    <ActionNarrativeModal
      isOpen={narrativeModal.isOpen}
      title={narrativeModal.title}
      narrative={narrativeModal.narrative}
      onClose={narrativeModal.onClose}
      closeLabel={narrativeModal.closeLabel}
    />

    <TargetSelectionModal
      isOpen={selectionModal.isOpen}
      title={selectionModal.title}
      verb={selectionModal.verb}
      actorName={selectionModal.actorName}
      targetName={selectionModal.targetName}
      leadEmoji={selectionModal.leadEmoji}
      trailEmoji={selectionModal.trailEmoji}
      isRandomizing={selectionModal.isRandomizing}
      onClose={selectionModal.onClose}
    />

    {orderModal ? (
      <OrderModal
        isOpen={orderModal.isOpen}
        order={orderModal.order}
        heading={orderModal.heading}
        subtitle={orderModal.subtitle}
        startLabel={orderModal.startLabel}
        startingLabel={orderModal.startingLabel}
        isStarting={orderModal.isStarting}
        onStart={orderModal.onStart}
        onClose={orderModal.onClose}
      />
    ) : null}
  </div>
)
