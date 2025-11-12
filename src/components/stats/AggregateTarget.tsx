import { useMemo, useState } from 'react'
import { RING_COUNT } from '../../utils/constants'
import { calculateAverage, generateRingColors } from '../../utils/helpers'
import type { Round } from '../../utils/types'

const PRACTICE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
  '#a855f7',
]

interface AggregateTargetProps {
  rounds: Round[]
}

export const AggregateTarget = ({ rounds }: AggregateTargetProps) => {
  const ringColors = useMemo(() => generateRingColors(RING_COUNT), [])
  const [highlightedRoundId, setHighlightedRoundId] = useState<string | null>(null)
  const [showOnlyAverage, setShowOnlyAverage] = useState(false)

  const handlePracticeClick = (roundId: string) => {
    setShowOnlyAverage(false)
    setHighlightedRoundId(previous => (previous === roundId ? null : roundId))
  }

  const handleAverageClick = () => {
    setHighlightedRoundId(null)
    setShowOnlyAverage(previous => !previous)
  }

  const allShots = useMemo(
    () => rounds.flatMap(round => round.ends.flatMap(end => end.shots)),
    [rounds],
  )
  const averageX = useMemo(() => calculateAverage(allShots.map(shot => shot.x)), [allShots])
  const averageY = useMemo(() => calculateAverage(allShots.map(shot => shot.y)), [allShots])

  return (
    <div className="aggregate-target-container">
      <h3 className="aggregate-target__title">All Shots Overlay</h3>
      <p className="aggregate-target__subtitle">Click on a practice below to highlight its shots. </p>
      <div className="aggregate-target">
        {ringColors.map((color, index) => (
          <div
            key={index}
            className="aggregate-target__ring"
            style={{
              backgroundColor: color,
              width: `${100 - (index / RING_COUNT) * 100}%`,
              height: `${100 - (index / RING_COUNT) * 100}%`,
            }}
          />
        ))}
        {rounds.map((round, roundIndex) => {
          const shots = round.ends.flatMap(end => end.shots)
          const practiceColor = PRACTICE_COLORS[roundIndex % PRACTICE_COLORS.length]
          const isHighlighted = highlightedRoundId === round.id
          const isDimmed = (highlightedRoundId !== null && highlightedRoundId !== round.id) || showOnlyAverage

          return shots.map((shot, shotIndex) => (
            <div
              key={`${round.id}-${shotIndex}`}
              className={`aggregate-target__dot ${isHighlighted ? 'aggregate-target__dot--highlighted' : ''} ${isDimmed ? 'aggregate-target__dot--dimmed' : ''}`}
              style={{
                left: `${(shot.x + 1) * 50}%`,
                top: `${(shot.y + 1) * 50}%`,
                backgroundColor: practiceColor,
                borderColor: practiceColor,
              }}
              onClick={() => handlePracticeClick(round.id)}
              role="button"
              tabIndex={0}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handlePracticeClick(round.id)
                }
              }}
            />
          ))
        })}
        {allShots.length > 0 && !highlightedRoundId && (
          <div
            className={`aggregate-target__average-marker ${showOnlyAverage ? 'aggregate-target__average-marker--highlighted' : ''}`}
            style={{
              left: `${(averageX + 1) * 50}%`,
              top: `${(averageY + 1) * 50}%`,
            }}
            aria-label="Average shot position"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6L18 18M18 6L6 18" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      <div className="aggregate-target__legend">
        {allShots.length > 0 && !highlightedRoundId && (
          <div
            className={`aggregate-target__legend-item ${showOnlyAverage ? 'aggregate-target__legend-item--highlighted' : ''}`}
            onClick={handleAverageClick}
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleAverageClick()
              }
            }}
          >
            <div className="aggregate-target__legend-average">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18M18 6L6 18" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <span className="aggregate-target__legend-label">
              Average Shot Location
            </span>
          </div>
        )}
        {rounds.map((round, roundIndex) => {
          const isHighlighted = highlightedRoundId === round.id
          const isDimmed = (highlightedRoundId !== null && highlightedRoundId !== round.id) || showOnlyAverage

          return (
            <div
              key={round.id}
              className={`aggregate-target__legend-item ${isHighlighted ? 'aggregate-target__legend-item--highlighted' : ''} ${isDimmed ? 'aggregate-target__legend-item--dimmed' : ''}`}
              onClick={() => handlePracticeClick(round.id)}
              role="button"
              tabIndex={0}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handlePracticeClick(round.id)
                }
              }}
            >
              <div
                className="aggregate-target__legend-color"
                style={{ backgroundColor: PRACTICE_COLORS[roundIndex % PRACTICE_COLORS.length] }}
              />
              <span className="aggregate-target__legend-label">
                Practice #{rounds.length - roundIndex}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
