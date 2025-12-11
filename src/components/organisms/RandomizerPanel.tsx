import { GamePhase, Player } from '../../types/game'

type ActionTable = Record<
  number,
  {
    title: string
    description: string
    requires?: (playerIndex: number, players: Player[], pileCount?: number) => boolean
  }
>

type Props = {
  phase: GamePhase
  phaseTable: ActionTable
  headingWarmup: string
  headingEndgame: string
  hint: string
  hintDebug: string
  highlightedIndex: number | null
  isFinalResult: boolean
  canRoll: boolean
  isSpinning: boolean
  onRoll: () => void
  rollLabel: string
  rollLabelSpinning: string
  rollLabelFinished: string
  players: Player[]
  currentPlayerIndex: number
  pileCount: number
  debugMode?: boolean
  onDebugSelect?: (roll: number) => void
}

export const RandomizerPanel = ({
  phase,
  phaseTable,
  headingWarmup,
  headingEndgame,
  hint,
  hintDebug,
  highlightedIndex,
  isFinalResult,
  canRoll,
  isSpinning,
  onRoll,
  rollLabel,
  rollLabelSpinning,
  rollLabelFinished,
  players,
  currentPlayerIndex,
  pileCount,
  debugMode = false,
  onDebugSelect,
}: Props) => (
  <div className="randomizer block">
    <div className="section-head">
      <h3>{phase === 'warmup' ? headingWarmup : headingEndgame}</h3>
      <p className="label">{debugMode ? hintDebug : hint}</p>
    </div>
    <div className="action-list">
      {Object.entries(phaseTable)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([roll, info], idx) => {
          const isAvailable = !info.requires || info.requires(currentPlayerIndex, players, pileCount)
          const clickable = debugMode && onDebugSelect
          return (
            <div
              key={roll}
              className={`action-row ${highlightedIndex === idx ? (isFinalResult ? 'final' : 'active') : ''} ${!isAvailable ? 'disabled' : ''} ${clickable ? 'debug-clickable' : ''}`}
              onClick={clickable ? () => onDebugSelect?.(Number(roll)) : undefined}
            >
              <div className="action-text">
                <div>
                  <strong>{info.title}</strong>
                  <div className="muted">{info.description}</div>
                </div>
              </div>
              {highlightedIndex === idx && <div className="arrow">⬅</div>}
            </div>
          )
        })}
    </div>
    <div className="spinner-actions">
      <button className={`primary ${phase === 'endgame' ? 'vibe' : ''}`} onClick={() => onRoll()} disabled={!canRoll || isSpinning}>
        {phase === 'ended' ? rollLabelFinished : isSpinning ? rollLabelSpinning : rollLabel}
      </button>
    </div>
  </div>
)
