import type { AggregateStats } from '../../utils/types'

interface AggregateSummaryProps {
  roundCount: number
  aggregateStats: AggregateStats
}

const formatUnits = (value: number, fractionDigits = 1): string => value.toFixed(fractionDigits)

export const AggregateSummary = ({ roundCount, aggregateStats }: AggregateSummaryProps) => (
  <>
    <div className="stats-aggregate__summary">
      <div className="stats-aggregate__summary-card">
        <span className="stats-aggregate__summary-text">
          Analyzing <span className="stats-aggregate__summary-number">{roundCount}</span> practices and <span className="stats-aggregate__summary-number">{aggregateStats.shotCount}</span> shots
        </span>
      </div>
    </div>

    <div className="stats-grid stats-grid--paired">
      <div className="stats-card stats-card--with-badge">
        <span className="stats-card__badge">Accuracy</span>
        <span className="stats-card__label">Avg Distance from Center</span>
        <span className="stats-card__value">{formatUnits(aggregateStats.averageDistanceFromCenter)}</span>
        <span className="stats-card__sublabel">units</span>
      </div>
      <div className="stats-card stats-card--with-badge">
        <span className="stats-card__badge">Precision</span>
        <span className="stats-card__label">Avg Distance From Group Center</span>
        <span className="stats-card__value">{formatUnits(aggregateStats.averagePrecision)}</span>
        <span className="stats-card__sublabel">units per end</span>
      </div>
    </div>
    <div className="stats-grid stats-grid--paired">
      <div className="stats-card">
        <span className="stats-card__label">Average Points</span>
        <span className="stats-card__value">{formatUnits(aggregateStats.averagePoints, 2)}</span>
      </div>
      <div className="stats-card">
        <span className="stats-card__label">Missed Shots</span>
        <span className="stats-card__value">{aggregateStats.missedShots}</span>
      </div>
    </div>
  </>
)
