import { useEffect, useMemo, useState } from 'react'
import type { Round } from '../utils/types'
import { calculateAverage, calculateDistanceFromCenter } from '../utils/helpers'
import { computeAggregateStats } from '../utils/aggregateStats'
import { updateRoundNotesInFirestore } from '../utils/firestore'
import { StatsTabs, type StatsTab } from './stats/StatsTabs'
import { AggregateControls } from './stats/AggregateControls'
import { AggregateTarget } from './stats/AggregateTarget'
import { AggregateSummary } from './stats/AggregateSummary'
import { HistoryChart, type MetricKey } from './stats/HistoryChart'
import { PracticeList, type PracticeEntry } from './stats/PracticeList'
import { DeletePracticeModal } from './stats/DeletePracticeModal'

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

type MetricConfig = { key: MetricKey; label: string; color: string }

const CHART_METRICS: MetricConfig[] = [
  { key: 'avgScore', label: 'Average score', color: '#3b82f6' },
  { key: 'avgDistance', label: 'Accuracy', color: '#10b981' },
  { key: 'avgPrecision', label: 'Grouping score', color: '#a78bfa' },
]

const exportToCSV = (rounds: Round[]) => {
  const sortedRounds = [...rounds].sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  )

  const headers = [
    'Practice Number',
    'Date',
    'Total Score',
    'Number of Ends',
    'Average Score per End',
    'Best End',
    'Average Precision',
    'Notes',
  ]

  const rows = sortedRounds.map((round, index) => {
    const practiceNumber = sortedRounds.length - index
    const date = formatDate(round.createdAt)
    const totalScore = round.totalScore
    const numberOfEnds = round.ends.length
    const averagePerEnd = numberOfEnds > 0 ? (totalScore / numberOfEnds).toFixed(2) : '0.00'
    const bestEnd = round.ends.length > 0 ? Math.max(...round.ends.map(end => end.endScore)) : 0
    const precisions = round.ends.map(end => end.precision).filter(value => value > 0)
    const averagePrecision = precisions.length > 0 ? calculateAverage(precisions).toFixed(2) : 'N/A'
    const rawNotes = round.notes ?? ''
    const escapedNotes = rawNotes.replace(/"/g, '""')

    return [
      practiceNumber,
      `"${date}"`,
      totalScore,
      numberOfEnds,
      averagePerEnd,
      bestEnd,
      averagePrecision,
      rawNotes ? `"${escapedNotes}"` : '',
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')

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

type ChartDatum = {
  practice: string
  practiceNumber: number
  avgScore: number
  avgDistance: number
  avgPrecision: number
  totalScore: number
  date: string
}

const prepareChartData = (rounds: Round[]): ChartDatum[] => {
  const clampPerformanceScore = (value: number): number => Math.max(0, Math.min(10, value))

  return rounds.map((round, index) => {
    const shots = round.ends.flatMap(end => end.shots)
    const averageScore = calculateAverage(shots.map(shot => shot.score))
    const averageDistance = calculateAverage(shots.map(shot => calculateDistanceFromCenter(shot)))
    const precisions = round.ends.map(end => end.precision).filter(value => value > 0)
    const averagePrecision = calculateAverage(precisions)

    const averageScoreRounded = Number(averageScore.toFixed(2))
    const averageDistanceScore = clampPerformanceScore(10 - Number(averageDistance.toFixed(2)))
    const averagePrecisionScore = clampPerformanceScore(10 - Number(averagePrecision.toFixed(2)))

    return {
      practice: `#${rounds.length - index}`,
      practiceNumber: rounds.length - index,
      avgScore: averageScoreRounded,
      avgDistance: averageDistanceScore,
      avgPrecision: averagePrecisionScore,
      totalScore: round.totalScore,
      date: formatDate(round.createdAt),
    }
  })
}

export const StatsView = ({ rounds, userId, onDeleteRound }: StatsViewProps) => {
  const [activeTab, setActiveTab] = useState<StatsTab>('history')
  const [range, setRange] = useState(5)
  const [rangeInput, setRangeInput] = useState('5')
  const [highlightedMetrics, setHighlightedMetrics] = useState<Set<MetricKey>>(new Set())
  const [showMetricsInfo, setShowMetricsInfo] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
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

  const sortedRounds = useMemo(
    () => [...rounds].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()),
    [rounds],
  )

  useEffect(() => {
    const maxRange = Math.max(1, sortedRounds.length || 1)
    if (range > maxRange) {
      setRange(maxRange)
      setRangeInput(String(maxRange))
    }
  }, [range, sortedRounds.length])

  const clampRange = (value: number) => Math.max(1, Math.floor(value))

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

  const effectiveRange = Math.max(1, Math.min(range, sortedRounds.length || 1))

  const selectedRounds = useMemo(
    () => sortedRounds.slice(0, activeTab === 'aggregate' ? effectiveRange : sortedRounds.length),
    [sortedRounds, activeTab, effectiveRange],
  )

  const aggregateStats = useMemo(() => computeAggregateStats(selectedRounds), [selectedRounds])
  const chartData = useMemo(() => prepareChartData(sortedRounds).reverse(), [sortedRounds])

  const practiceNumberLookup = useMemo(() => {
    const lookup = new Map<string, number>()
    sortedRounds.forEach((round, index) => {
      lookup.set(round.id, sortedRounds.length - index)
    })
    return lookup
  }, [sortedRounds])

  const historyEntries: PracticeEntry[] = useMemo(
    () => selectedRounds.map((round, index) => ({
      round,
      practiceNumber: practiceNumberLookup.get(round.id) ?? (selectedRounds.length - index),
      formattedDate: formatDate(round.createdAt),
    })),
    [selectedRounds, practiceNumberLookup],
  )

  const handleTabChange = (tab: StatsTab) => {
    setActiveTab(tab)
  }

  const toggleMetricHighlight = (metricKey: MetricKey) => {
    setHighlightedMetrics(previous => {
      const next = new Set(previous)
      if (next.has(metricKey)) {
        next.delete(metricKey)
      } else {
        next.add(metricKey)
      }
      return next
    })
  }

  const handleToggleMetricsInfo = () => {
    setShowMetricsInfo(previous => !previous)
  }

  const handleRequestDelete = (roundId: string) => {
    if (isDeleting) {
      return
    }
    setPendingDeleteId(roundId)
    setDeleteError(null)
  }

  const handleCancelDelete = () => {
    if (isDeleting) {
      return
    }
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

  const handleSaveNotes = async (roundId: string, notes: string) => {
    await updateRoundNotesInFirestore(userId, roundId, notes)
  }

  const pendingDeleteRound = useMemo(
    () => (pendingDeleteId ? sortedRounds.find(round => round.id === pendingDeleteId) ?? null : null),
    [pendingDeleteId, sortedRounds],
  )

  const pendingPracticeNumber = useMemo(() => {
    if (!pendingDeleteRound) {
      return null
    }

    const roundIndex = sortedRounds.findIndex(round => round.id === pendingDeleteRound.id)
    if (roundIndex === -1) {
      return null
    }

    return sortedRounds.length - roundIndex
  }, [pendingDeleteRound, sortedRounds])

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
        <StatsTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {activeTab === 'aggregate' ? (
        <div className="stats-aggregate">
          <AggregateControls
            rangeInput={rangeInput}
            onRangeInputChange={handleRangeInputChange}
            onRangeInputBlur={handleRangeInputBlur}
          />

          <AggregateTarget rounds={selectedRounds} />

          <AggregateSummary roundCount={selectedRounds.length} aggregateStats={aggregateStats} />
        </div>
      ) : (
        <div className="stats-history">
          <HistoryChart
            data={chartData}
            metrics={CHART_METRICS}
            highlightedMetrics={highlightedMetrics}
            onToggleMetric={toggleMetricHighlight}
            showMetricsInfo={showMetricsInfo}
            onToggleMetricsInfo={handleToggleMetricsInfo}
            isMobile={isMobile}
          />

          <div className="stats-chart__actions">
            <button
              className="stats-export-button"
              onClick={() => exportToCSV(rounds)}
              type="button"
              disabled={rounds.length === 0}
              aria-label="Export statistics to CSV"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>

          <PracticeList
            entries={historyEntries}
            onRequestDelete={handleRequestDelete}
            onSaveNotes={handleSaveNotes}
            pendingDeleteId={pendingDeleteId}
            isDeleting={isDeleting}
          />
        </div>
      )}

      {pendingDeleteRound && (
        <DeletePracticeModal
          titleId="delete-practice-title"
          descriptionId="delete-practice-description"
          practiceNumber={pendingPracticeNumber}
          practiceDate={formatDate(pendingDeleteRound.createdAt)}
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
