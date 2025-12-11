import { Pill, Stat } from '../atoms'

type StatusStripProps = {
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

export const StatusStrip = ({
  phaseLabel,
  pileLabel,
  currentPlayerLabel,
  playerRollsLabel,
  totalRollsLabel,
  pileCount,
  currentPlayerName,
  playerRolls,
  totalRolls,
}: StatusStripProps) => (
  <section className="status">
    <Pill label={phaseLabel} />
    <Stat label={pileLabel} value={pileCount} />
    <Stat label={currentPlayerLabel} value={currentPlayerName} />
    <Stat label={playerRollsLabel} value={playerRolls} />
    <Stat label={totalRollsLabel} value={totalRolls} />
  </section>
)
