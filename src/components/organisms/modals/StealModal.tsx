import React from 'react'

type Props = {
  actorName?: string
  currentPlayerName?: string
  isRandomizingTarget: boolean
  stealTarget: string | null
  onClose: () => void
  title: string
  verb: string
  closeLabel: string
}

export const StealModal: React.FC<Props> = ({
  actorName,
  currentPlayerName,
  isRandomizingTarget,
  stealTarget,
  onClose,
  title,
  verb,
  closeLabel,
}) => {
  const displayActor = actorName ?? currentPlayerName ?? '—'
  const displayTarget = stealTarget ?? (isRandomizingTarget ? '…' : '—')

  return (
    <div className="modal-overlay" onClick={!isRandomizingTarget ? onClose : undefined}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label={closeLabel}
          disabled={isRandomizingTarget}
        >
          ×
        </button>
        <div className="modal-content">
          <h2>{title}</h2>
          <p className="modal-line">
            <span className="name-stable">{displayActor}</span>
            <span className="verb"> {verb} </span>
            <span className={`name-stable target ${isRandomizingTarget ? 'pulse' : ''}`}>{displayTarget}</span>
            <span className="emoji sneaky">🎁🥷</span>
          </p>
        </div>
      </div>
    </div>
  )
}
