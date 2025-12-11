import React from 'react'

type Props = {
  isOpen: boolean
  title: string
  actorName: string
  targetName: string | null
  verb: string
  leadEmoji?: string
  trailEmoji?: string
  isRandomizing: boolean
  onClose: () => void
}

export const TargetSelectionModal: React.FC<Props> = ({
  isOpen,
  title,
  actorName,
  targetName,
  verb,
  leadEmoji = '🎲',
  trailEmoji = '🎁',
  isRandomizing,
  onClose,
}) => {
  if (!isOpen) return null
  const displayTarget = targetName ?? (isRandomizing ? '…' : '—')

  return (
    <div className="modal-overlay" onClick={!isRandomizing ? onClose : undefined}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close" disabled={isRandomizing}>
          ×
        </button>
        <div className="modal-content">
          <h2>{title}</h2>
          <p className="modal-line">
            <span className="name-stable">{actorName}</span>
            <span className="verb"> {verb} </span>
            <span className="emoji">{leadEmoji}</span>
            <span className={`name-stable target ${isRandomizing ? 'pulse' : ''}`}>{displayTarget}</span>
            <span className="emoji celebration">{trailEmoji}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
