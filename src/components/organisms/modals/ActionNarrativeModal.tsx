type Props = {
  isOpen: boolean
  title: string
  narrative: string
  onClose: () => void
  closeLabel: string
}

export const ActionNarrativeModal = ({ isOpen, title, narrative, onClose, closeLabel }: Props) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={closeLabel}>
          ×
        </button>
        <div className="modal-content">
          <h2>{title}</h2>
          <p className="modal-line">{narrative}</p>
        </div>
      </div>
    </div>
  )
}
