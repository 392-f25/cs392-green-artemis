import { useMemo, useState } from 'react'
import type { AggregateStats, Round, Shot } from '../utils/types'
import { TARGET_RADIUS_UNITS } from '../utils/constants'
import { calculateAverage, calculateDistanceBetweenShots, calculateDistanceFromCenter } from '../utils/helpers'

type StatsTab = 'history' | 'aggregate'

interface StatsViewProps {
  rounds: Round[]
}

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const formatUnits = (value: number, fractionDigits = 1): string => value.toFixed(fractionDigits)

const shotToDisplayCoordinates = (shot: Shot) => ({
  x: shot.x * TARGET_RADIUS_UNITS,
  y: shot.y * TARGET_RADIUS_UNITS,
})

const computeAggregateStats = (rounds: Round[]): AggregateStats => {
  const shots = rounds.flatMap(round => round.ends.flatMap(end => end.shots))

  const averagePoints = calculateAverage(shots.map(shot => shot.score))
  const averageDistanceFromCenter = calculateAverage(shots.map(shot => calculateDistanceFromCenter(shot)))

  const distancesBetweenShots: number[] = []
  rounds.forEach(round => {
    round.ends.forEach(end => {
      for (let shotIndex = 1; shotIndex < end.shots.length; shotIndex += 1) {
        const current = end.shots[shotIndex]
        const previous = end.shots[shotIndex - 1]
        distancesBetweenShots.push(calculateDistanceBetweenShots(previous, current))
      }
    })
  })

  const averageDistanceBetweenShots = calculateAverage(distancesBetweenShots)

  return {
    averagePoints,
    averageDistanceFromCenter,
    averageDistanceBetweenShots,
    shotCount: shots.length,
  }
}

export const StatsView = ({ rounds }: StatsViewProps) => {
  const [activeTab, setActiveTab] = useState<StatsTab>('history')
  const [range, setRange] = useState(5)

  const sortedRounds = useMemo(
    () => [...rounds].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()),
    [rounds],
  )

  const effectiveRange = Math.max(1, Math.min(range, sortedRounds.length || 1))

  const selectedRounds = useMemo(
    () => sortedRounds.slice(0, activeTab === 'aggregate' ? effectiveRange : sortedRounds.length),
    [sortedRounds, activeTab, effectiveRange],
  )

  const aggregateStats = useMemo(() => computeAggregateStats(selectedRounds), [selectedRounds])

  const handleTabChange = (tab: StatsTab) => {
    setActiveTab(tab)
  }

  const handleRangeChange = (value: number) => {
    if (Number.isNaN(value)) {
      setRange(1)
      return
    }
    setRange(Math.max(1, Math.floor(value)))
  }

  if (rounds.length === 0) {
    return (
      <div className="stats-container">
        <div className="stats-empty">No practices recorded yet. Add your first practice to see your progress.</div>
      </div>
    )
  }

  return (
    <div className="stats-container">
      <div className="stats-tabs">
        <button
          className={`stats-tab ${activeTab === 'history' ? 'stats-tab--active' : ''}`}
          onClick={() => handleTabChange('history')}
          type="button"
        >
          Practice History
        </button>
        <button
          className={`stats-tab ${activeTab === 'aggregate' ? 'stats-tab--active' : ''}`}
          onClick={() => handleTabChange('aggregate')}
          type="button"
        >
          Aggregate Stats
        </button>
      </div>

      {activeTab === 'aggregate' ? (
        <div className="stats-aggregate">
          <div className="stats-aggregate__controls">
            <label className="stats-aggregate__label" htmlFor="aggregate-range">
              Practices to include
            </label>
            <input
              id="aggregate-range"
              className="number-input"
              type="number"
              min={1}
              value={range}
              onChange={event => handleRangeChange(Number(event.target.value))}
              aria-label="Number of recent practices to include in aggregate statistics"
            />
            <span className="stats-aggregate__hint">Analyzing last {effectiveRange} practice{effectiveRange === 1 ? '' : 's'}.</span>
          </div>

          <div className="stats-grid">
            <div className="stats-card">
              <span className="stats-card__label">Practices Analyzed</span>
              <span className="stats-card__value">{selectedRounds.length}</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__label">Shots Analyzed</span>
              <span className="stats-card__value">{aggregateStats.shotCount}</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__label">Average Points</span>
              <span className="stats-card__value">{formatUnits(aggregateStats.averagePoints, 2)}</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__label">Avg Distance from Center</span>
              <span className="stats-card__value">{formatUnits(aggregateStats.averageDistanceFromCenter)}</span>
              <span className="stats-card__sublabel">units</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__label">Avg Distance Between Shots</span>
              <span className="stats-card__value">{formatUnits(aggregateStats.averageDistanceBetweenShots)}</span>
              <span className="stats-card__sublabel">units</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="stats-history">
          {selectedRounds.map((round, roundIndex) => (
            <div key={round.id} className="practice-card">
              <div className="practice-card__header">
                <div>
                  <p className="practice-card__title">Practice #{sortedRounds.length - roundIndex}</p>
                  <p className="practice-card__timestamp">{formatDate(round.createdAt)}</p>
                </div>
                <div className="practice-card__score">Total Score: {round.totalScore}</div>
              </div>
              <div className="practice-card__body">
                {round.ends.map((end, endIndex) => (
                  <div key={`${round.id}-end-${endIndex}`} className="practice-card__end">
                    <div className="practice-card__end-header">
                      <span className="practice-card__end-label">End {endIndex + 1}</span>
                      <span className="practice-card__end-score">{end.endScore} pts</span>
                    </div>
                    <ul className="practice-card__shots">
                      {end.shots.map((shot, shotIndex) => {
                        const coordinates = shotToDisplayCoordinates(shot)
                        const distanceFromCenter = calculateDistanceFromCenter(shot)
                        return (
                          <li key={`${round.id}-end-${endIndex}-shot-${shotIndex}`} className="practice-card__shot">
                            <span className="practice-card__shot-label">Shot {shotIndex + 1}</span>
                            <span className="practice-card__shot-metric">{shot.score} pts</span>
                            <span className="practice-card__shot-metric">x: {formatUnits(coordinates.x)}</span>
                            <span className="practice-card__shot-metric">y: {formatUnits(coordinates.y)}</span>
                            <span className="practice-card__shot-metric">dist: {formatUnits(distanceFromCenter)}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
