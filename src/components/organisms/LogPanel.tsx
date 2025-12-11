import { LogEntry } from '../../types/game'

type Props = {
  log: LogEntry[]
  title: string
  subtitle: string
  emptyLabel: string
}

export const LogPanel = ({ log, title, subtitle, emptyLabel }: Props) => (
  <div className="log block">
    <div className="section-head">
      <h3>{title}</h3>
      <p className="label">{subtitle}</p>
    </div>
    {log.length === 0 ? (
      <div className="empty-card">{emptyLabel}</div>
    ) : (
      <ul>
        {log.slice(0, 15).map((entry) => (
          <li key={entry.id}>
            <strong>{entry.message}</strong>
            {entry.detail ? <span className="muted"> — {entry.detail}</span> : null}
          </li>
        ))}
      </ul>
    )}
  </div>
)
