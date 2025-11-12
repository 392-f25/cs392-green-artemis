import { useMemo, useCallback } from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'

export type MetricKey = 'avgScore' | 'avgDistance' | 'avgPrecision'

interface ChartDatum {
  practice: string
  avgScore: number
  avgDistance: number
  avgPrecision: number
}

interface LineMetric {
  key: MetricKey
  label: string
  color: string
}

interface HistoryChartProps {
  data: ChartDatum[]
  metrics: LineMetric[]
  highlightedMetrics: Set<MetricKey>
  onToggleMetric: (metric: MetricKey) => void
  showMetricsInfo: boolean
  onToggleMetricsInfo: () => void
  isMobile: boolean
}

const metricStyles: Record<MetricKey, { stroke: string; dotStroke: string; fill: string }> = {
  avgScore: { stroke: '#3b82f6', dotStroke: '#1f6feb', fill: '#3b82f6' },
  avgDistance: { stroke: '#10b981', dotStroke: '#0f766e', fill: '#10b981' },
  avgPrecision: { stroke: '#a78bfa', dotStroke: '#7c3aed', fill: '#a78bfa' },
}

export const HistoryChart = ({
  data,
  metrics,
  highlightedMetrics,
  onToggleMetric,
  showMetricsInfo,
  onToggleMetricsInfo,
  isMobile,
}: HistoryChartProps) => {
  const isMetricActive = useCallback(
    (metric: MetricKey) => highlightedMetrics.size === 0 || highlightedMetrics.has(metric),
    [highlightedMetrics],
  )

  const chartMargin = useMemo(
    () => (isMobile ? { top: 5, right: 20, left: 10, bottom: 28 } : { top: 5, right: 40, left: 15, bottom: 30 }),
    [isMobile],
  )

  const chartHeight = isMobile ? 240 : 300

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

  return (
    <div className="stats-chart">
      <div className="stats-chart__header">
        <h3 className="stats-chart__title">Progress Over Time</h3>
        <button
          className="stats-chart__info-button"
          onClick={onToggleMetricsInfo}
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
        <LineChart data={data} margin={chartMargin}>
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
              color: '#e2e8f0',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            cursor={{ stroke: '#475569', strokeWidth: 2 }}
            wrapperStyle={{ pointerEvents: 'none' }}
          />
          {metrics.map(metric => {
            const styles = metricStyles[metric.key]
            const active = isMetricActive(metric.key)
            return (
              <Line
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                stroke={styles.stroke}
                strokeWidth={active ? 3.5 : 1.5}
                strokeOpacity={active ? 1 : 0.35}
                name={metric.label}
                dot={{ r: active ? 5.5 : 4, stroke: styles.dotStroke, strokeWidth: 1.5, fill: styles.fill }}
                activeDot={{ r: active ? 8 : 6, strokeWidth: 0 }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
      <div className="stats-chart__legend">
        {metrics.map(metric => {
          const isActive = isMetricActive(metric.key)
          return (
            <button
              key={metric.key}
              type="button"
              className={`stats-chart__legend-item ${isActive ? 'stats-chart__legend-item--active' : ''}`}
              onClick={event => {
                event.preventDefault()
                event.stopPropagation()
                onToggleMetric(metric.key)
              }}
              onTouchStart={event => event.stopPropagation()}
              onTouchEnd={event => event.stopPropagation()}
            >
              <span className="stats-chart__legend-swatch" style={{ backgroundColor: metric.color }} />
              <span style={{ color: metric.color }}>{metric.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
