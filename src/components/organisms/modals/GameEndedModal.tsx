import React from 'react'

type Props = {
  isOpen: boolean
  title: string
  bodyLines: string[]
  closeLabel: string
  onClose: () => void
}

export const GameEndedModal: React.FC<Props> = ({
  isOpen,
  title,
  bodyLines,
  closeLabel,
  onClose,
}) => {
  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onClick={handleOverlayClick}
    >
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={closeLabel}>
          ×
        </button>
        <div className="modal-content">
          <h2>{title}</h2>
          {bodyLines.map((line) => (
            <p key={line} className="modal-line">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
