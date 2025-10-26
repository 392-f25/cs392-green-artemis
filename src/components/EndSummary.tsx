import type { End } from '../utils/types'

interface EndSummaryProps {
  currentRound: End[]
  currentEndIndex: number
  onEndClick: (index: number) => void
}

export const EndSummary = ({ currentRound, currentEndIndex, onEndClick }: EndSummaryProps) => {
  return (
    <div className="end-summary">
      {currentRound.map((end, index) => (
        <div
          key={index}
          className={`end-summary__item ${index === currentEndIndex ? 'end-summary__item--active' : ''}`}
          onClick={() => onEndClick(index)}
          role="button"
          tabIndex={0}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              onEndClick(index)
            }
          }}
        >
          <span className="end-summary__label">End {index + 1}</span>
          <span className="end-summary__score">{end.endScore}</span>
        </div>
      ))}
    </div>
  )
}
