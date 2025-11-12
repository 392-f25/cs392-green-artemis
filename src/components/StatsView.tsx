import { useMemo, useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { AggregateStats, Round, Shot } from '../utils/types'
import { RING_COUNT } from '../utils/constants'
import { calculateAverage, calculateDistanceFromCenter, generateRingColors } from '../utils/helpers'
import { updateRoundNotesInFirestore } from '../utils/firestore'

type StatsTab = 'history' | 'aggregate'

interface StatsViewProps {
  rounds: Round[]
  userId: string
  onDeleteRound: (roundId: string) => Promise<void>
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

type MetricKey = 'avgScore' | 'avgDistance' | 'avgPrecision'

const CHART_METRICS: Array<{ key: MetricKey; label: string; color: string }> = [
  { key: 'avgScore', label: 'Average score', color: '#3b82f6' },
  { key: 'avgDistance', label: 'Accuracy', color: '#10b981' },
  { key: 'avgPrecision', label: 'Grouping score', color: '#a78bfa' },
]

const exportToCSV = (rounds: Round[]) => {
  // Sort rounds by date (newest first)
  const sortedRounds = [...rounds].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Create CSV header
  const headers = [
    'Practice Number',
    'Date',
    'Total Score',
    'Number of Ends',
    'Average Score per End',
    'Best End',
    'Average Precision',
    'Notes'
  ]

  // Create CSV rows
  const rows = sortedRounds.map((round, index) => {
    const practiceNumber = sortedRounds.length - index
    const date = formatDate(round.createdAt)
    const totalScore = round.totalScore
    const numEnds = round.ends.length
    const avgPerEnd = (totalScore / numEnds).toFixed(2)
    const bestEnd = round.ends.length > 0 ? Math.max(...round.ends.map(end => end.endScore)) : 0
    const precisions = round.ends.map(end => end.precision).filter(p => p > 0)
    const avgPrecision = precisions.length > 0 ? calculateAverage(precisions).toFixed(2) : 'N/A'
    const notes = round.notes ? `"${round.notes.replace(/"/g, '""')}"` : ''

    return [
      practiceNumber,
      `"${date}"`,
      totalScore,
      numEnds,
      avgPerEnd,
      bestEnd,
      avgPrecision,
      notes
    ].join(',')
  })

  // Combine headers and rows
  const csv = [headers.join(','), ...rows].join('\n')

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `artemis-practice-stats-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const computeAggregateStats = (rounds: Round[]): AggregateStats => {
  const shots = rounds.flatMap(round => round.ends.flatMap(end => end.shots))

  const averagePoints = calculateAverage(shots.map(shot => shot.score))
  const averageDistanceFromCenter = calculateAverage(shots.map(shot => calculateDistanceFromCenter(shot)))

  // Count missed shots (score = 0)
  const missedShots = shots.filter(shot => shot.score === 0).length

  // Calculate average precision (calculated as mean radius - average distance from group center)
  const endPrecisions = rounds.flatMap(round =>
    round.ends.map(end => end.precision).filter(p => p > 0)
  )
  const averagePrecision = calculateAverage(endPrecisions)

  return {
    averagePoints,
    averageDistanceFromCenter,
    missedShots,
    averagePrecision,
    shotCount: shots.length,
  }
}

const prepareChartData = (rounds: Round[]) => {
  return rounds.map((round, index) => {
    const shots = round.ends.flatMap(end => end.shots)
    const avgScore = calculateAverage(shots.map(shot => shot.score))
    const avgDistance = calculateAverage(shots.map(shot => calculateDistanceFromCenter(shot)))
    const precisions = round.ends.map(end => end.precision).filter(p => p > 0)
    const avgPrecision = calculateAverage(precisions)

    return {
      practice: `#${rounds.length - index}`,
      practiceNumber: rounds.length - index,
      avgScore: Number(avgScore.toFixed(2)),
      avgDistance: 10 - Number(avgDistance.toFixed(2)),
      avgPrecision: 10 - Number(avgPrecision.toFixed(2)),
      totalScore: round.totalScore,
      date: formatDate(round.createdAt),
    }
  })
}

interface MiniTargetProps {
  shots: Shot[]
}

const MiniTarget = ({ shots }: MiniTargetProps) => {
  const ringColors = useMemo(() => generateRingColors(RING_COUNT), [])

  return (
    <div className="mini-target">
      {ringColors.map((color, index) => (
        <div
          key={index}
          className="mini-target__ring"
          style={{
            backgroundColor: color,
            width: `${100 - (index / RING_COUNT) * 100}%`,
            height: `${100 - (index / RING_COUNT) * 100}%`,
          }}
        />
      ))}
      {shots.map((shot, shotIndex) => (
        <div
          key={shotIndex}
          className="mini-target__dot"
          style={{
            left: `${(shot.x + 1) * 50}%`,
            top: `${(shot.y + 1) * 50}%`,
          }}
        />
      ))}
    </div>
  )
}

interface AggregateTargetProps {
  rounds: Round[]
}

const PRACTICE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // violet
]

const AggregateTarget = ({ rounds }: AggregateTargetProps) => {
  const ringColors = useMemo(() => generateRingColors(RING_COUNT), [])
  const [highlightedRoundId, setHighlightedRoundId] = useState<string | null>(null)
  const [showOnlyAverage, setShowOnlyAverage] = useState(false)

  const handlePracticeClick = (roundId: string) => {
    setShowOnlyAverage(false)
    setHighlightedRoundId(prev => prev === roundId ? null : roundId)
  }

  const handleAverageClick = () => {
    setHighlightedRoundId(null)
    setShowOnlyAverage(prev => !prev)
  }

  // Calculate average position of all shots
  const allShots = useMemo(() => rounds.flatMap(round => round.ends.flatMap(end => end.shots)), [rounds])
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
          const isDimmed = highlightedRoundId !== null && highlightedRoundId !== round.id || showOnlyAverage

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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePracticeClick(round.id)
                }
              }}
            />
          ))
        })}
        {/* Average position marker - Red X */}
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
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
          const isDimmed = highlightedRoundId !== null && highlightedRoundId !== round.id || showOnlyAverage

          return (
            <div
              key={round.id}
              className={`aggregate-target__legend-item ${isHighlighted ? 'aggregate-target__legend-item--highlighted' : ''} ${isDimmed ? 'aggregate-target__legend-item--dimmed' : ''}`}
              onClick={() => handlePracticeClick(round.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
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

type SaveStatus = 'idle' | 'saving' | 'saved'

export const StatsView = ({ rounds, userId, onDeleteRound }: StatsViewProps) => {
  const [activeTab, setActiveTab] = useState<StatsTab>('history')
  const [range, setRange] = useState(5)
  const [rangeInput, setRangeInput] = useState('5')
  const [expandedEnds, setExpandedEnds] = useState<Record<string, boolean>>({})
  const [expandedPractices, setExpandedPractices] = useState<Record<string, boolean>>({})
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})
  const [notesChanged, setNotesChanged] = useState<Record<string, boolean>>({})
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({})
  const [showMetricsInfo, setShowMetricsInfo] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [highlightedMetrics, setHighlightedMetrics] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 480px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    setIsMobile(mediaQuery.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  const yAxisLabelRenderer = useCallback(({ viewBox }: { viewBox?: { x: number; y: number; width: number; height: number } }) => {
    if (!viewBox) {
      return null
    }

    const { x, y, height } = viewBox
    const labelX = x - (isMobile ? -5 : -20)
    const labelY = y + height / 2

    return (
      <text
        x={labelX}
        y={labelY}
        fill="#94a3b8"
        fontSize={12}
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(-90, ${labelX}, ${labelY})`}
      >
        Performance Score
      </text>
    )
  }, [isMobile])

  const chartMargin = useMemo(() => (
    isMobile
      ? { top: 5, right: 20, left: 10, bottom: 28 }
      : { top: 5, right: 40, left: 15, bottom: 30 }
  ), [isMobile])

  const chartHeight = isMobile ? 240 : 300

  // Initialize local notes from rounds
  useEffect(() => {
    const notesMap: Record<string, string> = {}
    rounds.forEach(round => {
      if (round.notes) {
        notesMap[round.id] = round.notes
      }
    })
    setLocalNotes(notesMap)
  }, [rounds])

  const handleNotesChange = (roundId: string, notes: string) => {
    // Update local state immediately for responsive UI
    setLocalNotes(prev => ({
      ...prev,
      [roundId]: notes,
    }))

    // Mark as changed
    setNotesChanged(prev => ({
      ...prev,
      [roundId]: true,
    }))

    // Reset save status
    setSaveStatus(prev => ({
      ...prev,
      [roundId]: 'idle',
    }))
  }

  const handleSaveNotes = async (roundId: string) => {
    const notes = localNotes[roundId] ?? ''

    setSaveStatus(prev => ({
      ...prev,
      [roundId]: 'saving',
    }))

    try {
      await updateRoundNotesInFirestore(userId, roundId, notes)

      setNotesChanged(prev => ({
        ...prev,
        [roundId]: false,
      }))

      setSaveStatus(prev => ({
        ...prev,
        [roundId]: 'saved',
      }))

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({
          ...prev,
          [roundId]: 'idle',
        }))
      }, 2000)
    } catch (error) {
      console.error('Failed to save notes:', error)
      setSaveStatus(prev => ({
        ...prev,
        [roundId]: 'idle',
      }))
      alert('Failed to save notes. Please try again.')
    }
  }

  const sortedRounds = useMemo(
    () => [...rounds].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()),
    [rounds],
  )

  const toggleEndExpansion = (roundId: string, endIndex: number) => {
    const key = `${roundId}-${endIndex}`
    setExpandedEnds(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const togglePracticeExpansion = (roundId: string) => {
    setExpandedPractices(prev => ({
      ...prev,
      [roundId]: !prev[roundId],
    }))
  }

  const effectiveRange = Math.max(1, Math.min(range, sortedRounds.length || 1))

  const selectedRounds = useMemo(
    () => sortedRounds.slice(0, activeTab === 'aggregate' ? effectiveRange : sortedRounds.length),
    [sortedRounds, activeTab, effectiveRange],
  )

  const aggregateStats = useMemo(() => computeAggregateStats(selectedRounds), [selectedRounds])
  const chartData = useMemo(() => prepareChartData(sortedRounds).reverse(), [sortedRounds])

  useEffect(() => {
    setExpandedEnds(prev => {
      const nextState: Record<string, boolean> = {}
      selectedRounds.forEach(round => {
        round.ends.forEach((_, endIndex) => {
          const key = `${round.id}-${endIndex}`
          nextState[key] = prev[key] ?? false
        })
      })
      return nextState
    })
  }, [selectedRounds])

  useEffect(() => {
    setExpandedPractices(prev => {
      const nextState: Record<string, boolean> = {}
      selectedRounds.forEach(round => {
        nextState[round.id] = prev[round.id] ?? false
      })
      return nextState
    })
  }, [selectedRounds])

  const handleTabChange = (tab: StatsTab) => {
    setActiveTab(tab)
  }

  const clampRange = (value: number) => Math.max(1, Math.floor(value))

  const toggleMetricHighlight = (metricKey: string) => {
    setHighlightedMetrics(prev => {
      const next = new Set(prev)
      if (next.has(metricKey)) {
        next.delete(metricKey)
      } else {
        next.add(metricKey)
      }
      return next
    })
  }

  const isMetricActive = (metricKey: string) => highlightedMetrics.size === 0 || highlightedMetrics.has(metricKey)

  const handleRangeInputChange = (value: string) => {
    setRangeInput(value)

    if (value === '') {
      return
    }

    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      return
    }

    const clamped = clampRange(parsed)
    setRange(clamped)
  }

  const handleRangeInputBlur = () => {
    if (rangeInput === '') {
      setRangeInput(String(range))
      return
    }

    const parsed = Number(rangeInput)
    if (Number.isNaN(parsed)) {
      setRangeInput(String(range))
      return
    }

    const clamped = clampRange(parsed)
    setRange(clamped)
    setRangeInput(String(clamped))
  }

  const pendingDeleteRound = useMemo(
    () => (pendingDeleteId ? sortedRounds.find(round => round.id === pendingDeleteId) ?? null : null),
    [pendingDeleteId, sortedRounds],
  )

  const pendingPracticeNumber = useMemo(() => {
    if (!pendingDeleteRound) {
      return null
    }
    const index = sortedRounds.findIndex(round => round.id === pendingDeleteRound.id)
    if (index === -1) {
      return null
    }
    return sortedRounds.length - index
  }, [pendingDeleteRound, sortedRounds])

  const deleteModalTitleId = 'delete-practice-title'
  const deleteModalDescriptionId = 'delete-practice-description'

  const handleRequestDelete = (roundId: string) => {
    if (isDeleting) return
    setPendingDeleteId(roundId)
    setDeleteError(null)
  }

  const handleCancelDelete = () => {
    if (isDeleting) return
    setPendingDeleteId(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) {
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await onDeleteRound(pendingDeleteId)
      setPendingDeleteId(null)
    } catch (error) {
      console.error('Failed to delete practice:', error)
      setDeleteError('Failed to delete this practice. Please try again.')
    } finally {
      setIsDeleting(false)
    }
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
      <div className="stats-header">
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
      </div>

      {activeTab === 'aggregate' ? (
        <div className="stats-aggregate">
          <div className="stats-aggregate__controls">
            <label className="stats-aggregate__selector ends-selector" htmlFor="aggregate-range">
              <span className="ends-selector__label">Practices to Analyze</span>
              <input
                id="aggregate-range"
                className="number-input ends-selector__input"
                type="number"
                min={1}
                value={rangeInput}
                onChange={event => handleRangeInputChange(event.target.value)}
                onBlur={handleRangeInputBlur}
                aria-label="Number of recent practices to analyze in aggregate statistics"
              />
            </label>
          </div>

          <AggregateTarget rounds={selectedRounds} />

          <div className="stats-aggregate__summary">
            <div className="stats-aggregate__summary-card">
              <span className="stats-aggregate__summary-text">
                Analyzing <span className="stats-aggregate__summary-number">{selectedRounds.length}</span> practices and <span className="stats-aggregate__summary-number">{aggregateStats.shotCount}</span> shots
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
        </div>
      ) : (
        <div className="stats-history">
          <div className="stats-chart">
            <div className="stats-chart__header">
              <h3 className="stats-chart__title">Progress Over Time</h3>
              <button
                className="stats-chart__info-button"
                onClick={() => setShowMetricsInfo(!showMetricsInfo)}
                type="button"
                aria-label="Show metrics information"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>
            </div>
            <p className="stats-chart__tip">Click on a metric below to highlight its trend line.</p>
            {showMetricsInfo && (
              <div className="stats-chart__info">
                <div className="stats-chart__info-item">
                  <span className="stats-chart__info-label" style={{ color: '#10b981' }}>Accuracy:</span>
                  <span className="stats-chart__info-text">A measure of how close your shots are to the center out of 10 (higher is better). </span>
                </div>
                <div className="stats-chart__info-item">
                  <span className="stats-chart__info-label" style={{ color: '#a78bfa' }}>Grouping Score:</span>
                  <span className="stats-chart__info-text">A measure of how consistent your shot grouping is out of 10 (higher is better).</span>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={chartData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="practice"
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Practice Number', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  domain={[0, 10]}
                  label={yAxisLabelRenderer}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  cursor={{ stroke: '#475569', strokeWidth: 2 }}
                  wrapperStyle={{ pointerEvents: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#3b82f6"
                  strokeWidth={isMetricActive('avgScore') ? 3.5 : 1.5}
                  strokeOpacity={isMetricActive('avgScore') ? 1 : 0.35}
                  name="Average score"
                  dot={{ r: isMetricActive('avgScore') ? 5.5 : 4, stroke: '#1f6feb', strokeWidth: 1.5, fill: '#3b82f6' }}
                  activeDot={{ r: isMetricActive('avgScore') ? 8 : 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgDistance"
                  stroke="#10b981"
                  strokeWidth={isMetricActive('avgDistance') ? 3.5 : 1.5}
                  strokeOpacity={isMetricActive('avgDistance') ? 1 : 0.35}
                  name="Accuracy"
                  dot={{ r: isMetricActive('avgDistance') ? 5.5 : 4, stroke: '#0f766e', strokeWidth: 1.5, fill: '#10b981' }}
                  activeDot={{ r: isMetricActive('avgDistance') ? 8 : 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgPrecision"
                  stroke="#a78bfa"
                  strokeWidth={isMetricActive('avgPrecision') ? 3.5 : 1.5}
                  strokeOpacity={isMetricActive('avgPrecision') ? 1 : 0.35}
                  name="Grouping score"
                  dot={{ r: isMetricActive('avgPrecision') ? 5.5 : 4, stroke: '#7c3aed', strokeWidth: 1.5, fill: '#a78bfa' }}
                  activeDot={{ r: isMetricActive('avgPrecision') ? 8 : 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="stats-chart__legend">
              {CHART_METRICS.map(metric => {
                const isActive = isMetricActive(metric.key)
                return (
                  <button
                    key={metric.key}
                    type="button"
                    className={`stats-chart__legend-item ${isActive ? 'stats-chart__legend-item--active' : ''}`}
                    onClick={event => {
                      event.preventDefault()
                      event.stopPropagation()
                      toggleMetricHighlight(metric.key)
                    }}
                    onTouchStart={event => {
                      event.stopPropagation()
                    }}
                    onTouchEnd={event => {
                      event.stopPropagation()
                    }}
                  >
                    <span className="stats-chart__legend-swatch" style={{ backgroundColor: metric.color }} />
                    <span style={{ color: metric.color }}>{metric.label}</span>
                  </button>
                )
              })}
            </div>
            <div className="stats-chart__actions">
              <button
                className="stats-export-button"
                onClick={() => exportToCSV(rounds)}
                type="button"
                disabled={rounds.length === 0}
                aria-label="Export statistics to CSV"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {selectedRounds.map((round, roundIndex) => {
            const roundPrecisions = round.ends.map(end => end.precision).filter(p => p > 0)
            const avgRoundPrecision = calculateAverage(roundPrecisions)
            const isPracticeExpanded = expandedPractices[round.id] ?? false
            const detailsId = `practice-details-${round.id}`

            return (
              <div
                key={round.id}
                className={`practice-card ${isPracticeExpanded ? 'practice-card--expanded' : ''}`}
              >
                <div className="practice-card__header">
                  <div>
                    <p className="practice-card__title">Practice #{sortedRounds.length - roundIndex}</p>
                    <p className="practice-card__timestamp">{formatDate(round.createdAt)}</p>
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
                        onClick={() => togglePracticeExpansion(round.id)}
                        aria-expanded={isPracticeExpanded}
                        aria-controls={detailsId}
                      >
                        <span>{isPracticeExpanded ? 'Hide details' : 'Show details'}</span>
                        <svg
                          className={`practice-card__toggle-icon ${isPracticeExpanded ? 'practice-card__toggle-icon--expanded' : ''}`}
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
                          handleRequestDelete(round.id)
                        }}
                        aria-label="Delete practice"
                        disabled={isDeleting && pendingDeleteId === round.id}
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

                {isPracticeExpanded && (
                  <div id={detailsId} className="practice-card__content">
                    <div className="practice-card__notes">
                      <div className="practice-card__notes-header">
                        <label htmlFor={`notes-${round.id}`} className="practice-card__notes-label">
                          Practice Notes:
                        </label>
                        <button
                          className={`practice-card__notes-save ${saveStatus[round.id] === 'saved' ? 'practice-card__notes-save--saved' : ''}`}
                          onClick={() => handleSaveNotes(round.id)}
                          disabled={!notesChanged[round.id] || saveStatus[round.id] === 'saving'}
                          type="button"
                        >
                          {saveStatus[round.id] === 'saving' ? 'Saving...' : saveStatus[round.id] === 'saved' ? 'Saved ✓' : 'Save'}
                        </button>
                      </div>
                      <textarea
                        id={`notes-${round.id}`}
                        className="practice-card__notes-textarea"
                        placeholder="Add notes about this practice session..."
                        value={localNotes[round.id] ?? ''}
                        onChange={(e) => handleNotesChange(round.id, e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="practice-card__body">
                      {round.ends.map((end, endIndex) => {
                        const endKey = `${round.id}-${endIndex}`
                        const isEndExpanded = expandedEnds[endKey] || false
                        return (
                          <div key={`${round.id}-end-${endIndex}`} className="practice-card__end">
                            <div
                              className="practice-card__end-header practice-card__end-header--clickable"
                              onClick={() => toggleEndExpansion(round.id, endIndex)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  toggleEndExpansion(round.id, endIndex)
                                }
                              }}
                            >
                              <div className="practice-card__end-header-left">
                                <span className="practice-card__end-label">End {endIndex + 1}</span>
                                <span className="practice-card__end-score">{end.endScore} pts</span>
                              </div>
                              <svg
                                className={`practice-card__dropdown-icon ${isEndExpanded ? 'practice-card__dropdown-icon--expanded' : ''}`}
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
                            {isEndExpanded && (
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
                                      <li key={`${round.id}-end-${endIndex}-shot-${shotIndex}`} className="practice-card__shot">
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
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {pendingDeleteRound && (
        <div
          className="modal-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={deleteModalTitleId}
          aria-describedby={deleteModalDescriptionId}
        >
          <div className="modal">
            <h3 id={deleteModalTitleId} className="modal__title">Delete Practice?</h3>
            <p id={deleteModalDescriptionId} className="modal__description">
              This will permanently remove{' '}
              {pendingPracticeNumber ? `Practice #${pendingPracticeNumber}` : 'this practice'}
              {pendingDeleteRound ? ` recorded on ${formatDate(pendingDeleteRound.createdAt)}` : ''}.
            </p>
            {deleteError ? <p className="modal__error">{deleteError}</p> : null}
            <div className="modal__actions">
              <button
                type="button"
                className="modal__button modal__button--secondary"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal__button modal__button--destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
