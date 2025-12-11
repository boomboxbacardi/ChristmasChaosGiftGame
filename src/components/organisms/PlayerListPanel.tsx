import { Player } from '../../types/game'

type Props = {
  players: Player[]
  currentPlayerIndex: number
  phase: string
  title: string
  legend: string
  emptyLabel: string
}

export const PlayerListPanel = ({ players, currentPlayerIndex, phase, title, legend, emptyLabel }: Props) => (
  <div className="players block">
    <div className="section-head">
      <h3>{title}</h3>
      <p className="label">{legend}</p>
    </div>
    <div className="player-list">
      {players.map((player, idx) => {
        const isActive = idx === currentPlayerIndex && phase !== 'ended'
        const unlocked = player.packages.filter((p) => !p.locked)
        const locked = player.packages.filter((p) => p.locked)
        return (
          <div key={player.id} className={`player-row ${isActive ? 'active' : ''}`}>
            <div className="player-name">{player.name}</div>
            <div className="gifts">
              {unlocked.map((pkg) => (
                <span key={pkg.id} className="gift">🎁</span>
              ))}
              {locked.map((pkg) => (
                <span key={pkg.id} className="gift locked">🔒🎁</span>
              ))}
              {player.packages.length === 0 && <span className="muted">{emptyLabel}</span>}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)
