import { calculateDistanceFromCenter } from '../../utils/helpers'
import type { End } from '../../utils/types'
import { MiniTarget } from './MiniTarget'

interface PracticeEndProps {
  roundId: string
  end: End
  endIndex: number
  isExpanded: boolean
  onToggle: () => void
}

const formatUnits = (value: number, fractionDigits = 1): string => value.toFixed(fractionDigits)

export const PracticeEnd = ({ roundId, end, endIndex, isExpanded, onToggle }: PracticeEndProps) => (
  <div className="practice-card__end">
    <div
      className="practice-card__end-header practice-card__end-header--clickable"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onToggle()
        }
      }}
    >
      <div className="practice-card__end-header-left">
        <span className="practice-card__end-label">End {endIndex + 1}</span>
        <span className="practice-card__end-score">{end.endScore} pts</span>
      </div>
      <svg
        className={`practice-card__dropdown-icon ${isExpanded ? 'practice-card__dropdown-icon--expanded' : ''}`}
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <div className="practice-card__end-target">
      <MiniTarget shots={end.shots} />
    </div>
    {isExpanded && (
      <div className="practice-card__end-details">
        <div className="practice-card__end-precision">
          <span className="practice-card__precision-label">End Precision:</span>
          <span className="practice-card__precision-value">
            {end.precision > 0 ? formatUnits(end.precision) : 'N/A'}
          </span>
          <span className="practice-card__precision-sublabel">avg units from group center</span>
        </div>
        <ul className="practice-card__shots">
          {end.shots.map((shot, shotIndex) => {
            const distanceFromCenter = calculateDistanceFromCenter(shot)
            return (
              <li key={`${roundId}-end-${endIndex}-shot-${shotIndex}`} className="practice-card__shot">
                <span className="practice-card__shot-label">Shot {shotIndex + 1}</span>
                <span className="practice-card__shot-metric">{shot.score} pts</span>
                <span className="practice-card__shot-metric">dist: {formatUnits(distanceFromCenter)}</span>
              </li>
            )
          })}
        </ul>
      </div>
    )}
  </div>
)
