import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateAverage } from '../../utils/helpers'
import type { Round } from '../../utils/types'
import { PracticeEnd } from './PracticeEnd'

type SaveStatus = 'idle' | 'saving' | 'saved'

interface PracticeCardProps {
  round: Round
  practiceNumber: number
  formattedDate: string
  onRequestDelete: (roundId: string) => void
  onSaveNotes: (roundId: string, notes: string) => Promise<void>
  isDeleting: boolean
  isDeletePending: boolean
}

const formatUnits = (value: number, fractionDigits = 1): string => value.toFixed(fractionDigits)

export const PracticeCard = ({
  round,
  practiceNumber,
  formattedDate,
  onRequestDelete,
  onSaveNotes,
  isDeleting,
  isDeletePending,
}: PracticeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedEnds, setExpandedEnds] = useState<Record<number, boolean>>({})
  const [notes, setNotes] = useState(round.notes ?? '')
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const resetTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    setNotes(round.notes ?? '')
    setHasChanges(false)
    setSaveStatus('idle')
  }, [round.notes])

  useEffect(() => () => {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  const avgRoundPrecision = useMemo(() => {
    const roundPrecisions = round.ends.map(end => end.precision).filter(precision => precision > 0)
    return calculateAverage(roundPrecisions)
  }, [round.ends])

  const handleToggleEnd = (endIndex: number) => {
    setExpandedEnds(previous => ({
      ...previous,
      [endIndex]: !previous[endIndex],
    }))
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    setHasChanges(true)
    setSaveStatus('idle')
  }

  const handleSaveNotes = async () => {
    if (!hasChanges) {
      return
    }

    setSaveStatus('saving')

    try {
      await onSaveNotes(round.id, notes)
      setHasChanges(false)
      setSaveStatus('saved')

      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current)
      }

      resetTimeoutRef.current = window.setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Failed to save notes:', error)
      setSaveStatus('idle')
      alert('Failed to save notes. Please try again.')
    }
  }

  const detailsId = `practice-details-${round.id}`

  return (
    <div className={`practice-card ${isExpanded ? 'practice-card--expanded' : ''}`}>
      <div className="practice-card__header">
        <div>
          <p className="practice-card__title">Practice #{practiceNumber}</p>
          <p className="practice-card__timestamp">{formattedDate}</p>
          {avgRoundPrecision > 0 && (
            <p className="practice-card__precision">
              Avg Precision: {formatUnits(avgRoundPrecision)} units
            </p>
          )}
        </div>
        <div className="practice-card__header-actions">
          <div className="practice-card__score">Total Score: {round.totalScore}</div>
          <div className="practice-card__header-buttons">
            <button
              type="button"
              className="practice-card__toggle"
              onClick={() => setIsExpanded(previous => !previous)}
              aria-expanded={isExpanded}
              aria-controls={detailsId}
            >
              <span>{isExpanded ? 'Hide details' : 'Show details'}</span>
              <svg
                className={`practice-card__toggle-icon ${isExpanded ? 'practice-card__toggle-icon--expanded' : ''}`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                width="16"
                height="16"
              >
                <path d="M5 8l5 5 5-5" />
              </svg>
            </button>
            <button
              type="button"
              className="practice-card__delete"
              onClick={event => {
                event.preventDefault()
                event.stopPropagation()
                onRequestDelete(round.id)
              }}
              aria-label="Delete practice"
              disabled={isDeleting && isDeletePending}
            >
              <svg
                className="practice-card__delete-icon"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div id={detailsId} className="practice-card__content">
          <div className="practice-card__notes">
            <div className="practice-card__notes-header">
              <label htmlFor={`notes-${round.id}`} className="practice-card__notes-label">
                Practice Notes:
              </label>
              <button
                className={`practice-card__notes-save ${saveStatus === 'saved' ? 'practice-card__notes-save--saved' : ''}`}
                onClick={handleSaveNotes}
                disabled={!hasChanges || saveStatus === 'saving'}
                type="button"
              >
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Save'}
              </button>
            </div>
            <textarea
              id={`notes-${round.id}`}
              className="practice-card__notes-textarea"
              placeholder="Add notes about this practice session..."
              value={notes}
              onChange={event => handleNotesChange(event.target.value)}
              rows={3}
            />
          </div>
          <div className="practice-card__body">
            {round.ends.map((end, endIndex) => (
              <PracticeEnd
                key={`${round.id}-end-${endIndex}`}
                roundId={round.id}
                end={end}
                endIndex={endIndex}
                isExpanded={Boolean(expandedEnds[endIndex])}
                onToggle={() => handleToggleEnd(endIndex)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
