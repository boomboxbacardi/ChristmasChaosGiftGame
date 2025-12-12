import { useEffect, useState } from 'react'

type Props = {
  isOpen: boolean
  title: string
  narrative: string
  placeholder: string
  roller?: {
    label: string
    trail: string[]
    isRunning: boolean
  }
}

export const ActionNarrativeModal = ({ isOpen, title, narrative, placeholder, roller }: Props) => {
  const hasNarrative = Boolean(narrative?.trim())
  const displayText = hasNarrative ? narrative : placeholder
  const displayTitle = title?.trim() || "…"
  const [isPulsing, setIsPulsing] = useState(false)

  useEffect(() => {
    const shouldPulse =
      (isOpen && hasNarrative) ||
      Boolean(roller?.isRunning && roller.trail.length > 1)
    if (shouldPulse) {
      setIsPulsing(true)
      const timeout = setTimeout(() => setIsPulsing(false), 900)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [isOpen, hasNarrative, narrative, roller?.isRunning, roller?.trail.length])

  const rollerValue = roller?.trail?.length ? roller.trail[roller.trail.length - 1] : null
  const displayRollerValue = rollerValue ?? '…'

  return (
    <section
      className={`narrative-widget ${isPulsing ? 'narrative-widget--pulse' : ''}`}
      aria-live="polite"
      role="status"
      data-active={hasNarrative}
    >
      <div className="narrative-widget__card">
        <div className="narrative-widget__header">
          <div className="narrative-widget__meta">
            <span className="narrative-widget__pill">{isOpen ? '🎲 Narrative' : '…'}</span>
            <p className="narrative-widget__title">{displayTitle}</p>
          </div>
        </div>
        <p className="narrative-widget__body" data-muted={!hasNarrative}>
          {displayText}
        </p>
        {roller ? (
          <p className="narrative-widget__roller" aria-label={roller.label}>
            <span className="narrative-widget__roller-label">{roller.label}</span>
            <span className="narrative-widget__roller-value" data-running={roller.isRunning}>
              {displayRollerValue}
            </span>
          </p>
        ) : null}
      </div>
    </section>
  )
}
