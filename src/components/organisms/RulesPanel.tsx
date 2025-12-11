type ActionTable = Record<number, { title: string; description: string }>

type Props = {
  warmupTable: ActionTable
  endgameTable: ActionTable
  warmupTitle: string
  endgameTitle: string
  lockedNote?: string
}

export const RulesPanel = ({ warmupTable, endgameTable, warmupTitle, endgameTitle, lockedNote }: Props) => (
  <div className="rules block">
    {lockedNote ? <p className="muted rules-note">{lockedNote}</p> : null}
    <div className="rules-col">
      <h3>{warmupTitle}</h3>
      <ul>
        {Object.entries(warmupTable).map(([roll, info]) => (
          <li key={roll}>
            <div>
              <strong>{info.title}</strong>
              <div className="muted">{info.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
    <div className="rules-col">
      <h3>{endgameTitle}</h3>
      <ul>
        {Object.entries(endgameTable).map(([roll, info]) => (
          <li key={roll}>
            <div>
              <strong>{info.title}</strong>
              <div className="muted">{info.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
)
