import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HistoryChart, type MetricKey } from './HistoryChart'

// Mock ResizeObserver which is used by Recharts
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('HistoryChart - Metric Highlighting', () => {
  const mockData = [
    { practice: '1', avgScore: 7.5, avgDistance: 8.2, avgPrecision: 6.8 },
    { practice: '2', avgScore: 8.0, avgDistance: 8.5, avgPrecision: 7.2 },
    { practice: '3', avgScore: 8.5, avgDistance: 8.8, avgPrecision: 7.8 },
  ]

  const mockMetrics = [
    { key: 'avgScore' as MetricKey, label: 'Average Score', color: '#3b82f6' },
    { key: 'avgDistance' as MetricKey, label: 'Accuracy', color: '#10b981' },
    { key: 'avgPrecision' as MetricKey, label: 'Grouping Score', color: '#a78bfa' },
  ]

  describe('Initial state - no metrics highlighted', () => {
    it('should show all metrics with equal emphasis when none are highlighted', () => {
      const mockToggle = vi.fn()
      const { container } = render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set()}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      // All legend items should be active (have the active class)
      const legendItems = container.querySelectorAll('.stats-chart__legend-item')
      expect(legendItems).toHaveLength(3)
      legendItems.forEach(item => {
        expect(item.classList.contains('stats-chart__legend-item--active')).toBe(true)
      })
    })
  })

  describe('Single metric highlighted', () => {
    it('should highlight Average Score when clicked', () => {
      const mockToggle = vi.fn()
      const { container } = render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set(['avgScore'])}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      const legendItems = container.querySelectorAll('.stats-chart__legend-item')
      
      // Only the first metric (Average Score) should be active
      expect(legendItems[0].classList.contains('stats-chart__legend-item--active')).toBe(true)
      expect(legendItems[1].classList.contains('stats-chart__legend-item--active')).toBe(false)
      expect(legendItems[2].classList.contains('stats-chart__legend-item--active')).toBe(false)
    })

    it('should highlight Accuracy when clicked', () => {
      const mockToggle = vi.fn()
      const { container } = render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set(['avgDistance'])}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      const legendItems = container.querySelectorAll('.stats-chart__legend-item')
      
      // Only the second metric (Accuracy) should be active
      expect(legendItems[0].classList.contains('stats-chart__legend-item--active')).toBe(false)
      expect(legendItems[1].classList.contains('stats-chart__legend-item--active')).toBe(true)
      expect(legendItems[2].classList.contains('stats-chart__legend-item--active')).toBe(false)
    })

    it('should highlight Grouping Score when clicked', () => {
      const mockToggle = vi.fn()
      const { container } = render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set(['avgPrecision'])}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      const legendItems = container.querySelectorAll('.stats-chart__legend-item')
      
      // Only the third metric (Grouping Score) should be active
      expect(legendItems[0].classList.contains('stats-chart__legend-item--active')).toBe(false)
      expect(legendItems[1].classList.contains('stats-chart__legend-item--active')).toBe(false)
      expect(legendItems[2].classList.contains('stats-chart__legend-item--active')).toBe(true)
    })
  })

  describe('Multiple metrics highlighted', () => {
    it('should highlight both Average Score and Accuracy when both are selected', () => {
      const mockToggle = vi.fn()
      const { container } = render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set(['avgScore', 'avgDistance'])}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      const legendItems = container.querySelectorAll('.stats-chart__legend-item')
      
      // First two metrics should be active
      expect(legendItems[0].classList.contains('stats-chart__legend-item--active')).toBe(true)
      expect(legendItems[1].classList.contains('stats-chart__legend-item--active')).toBe(true)
      expect(legendItems[2].classList.contains('stats-chart__legend-item--active')).toBe(false)
    })

    it('should highlight all three metrics when all are selected', () => {
      const mockToggle = vi.fn()
      const { container } = render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set(['avgScore', 'avgDistance', 'avgPrecision'])}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      const legendItems = container.querySelectorAll('.stats-chart__legend-item')
      
      // All metrics should be active
      legendItems.forEach(item => {
        expect(item.classList.contains('stats-chart__legend-item--active')).toBe(true)
      })
    })
  })

  describe('User interactions', () => {
    it('should call onToggleMetric when Average Score is clicked', () => {
      const mockToggle = vi.fn()
      render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set()}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      const avgScoreButton = screen.getByText('Average Score').closest('button')
      expect(avgScoreButton).not.toBeNull()
      fireEvent.click(avgScoreButton!)

      expect(mockToggle).toHaveBeenCalledTimes(1)
      expect(mockToggle).toHaveBeenCalledWith('avgScore')
    })

    it('should call onToggleMetric when Accuracy is clicked', () => {
      const mockToggle = vi.fn()
      render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set()}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      const accuracyButton = screen.getByText('Accuracy').closest('button')
      expect(accuracyButton).not.toBeNull()
      fireEvent.click(accuracyButton!)

      expect(mockToggle).toHaveBeenCalledTimes(1)
      expect(mockToggle).toHaveBeenCalledWith('avgDistance')
    })

    it('should call onToggleMetric when Grouping Score is clicked', () => {
      const mockToggle = vi.fn()
      render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set()}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      const groupingButton = screen.getByText('Grouping Score').closest('button')
      expect(groupingButton).not.toBeNull()
      fireEvent.click(groupingButton!)

      expect(mockToggle).toHaveBeenCalledTimes(1)
      expect(mockToggle).toHaveBeenCalledWith('avgPrecision')
    })
  })

  describe('Visual indicators', () => {
    it('should display colored swatches for each metric', () => {
      const mockToggle = vi.fn()
      const { container } = render(
        <HistoryChart
          data={mockData}
          metrics={mockMetrics}
          highlightedMetrics={new Set()}
          onToggleMetric={mockToggle}
          showMetricsInfo={false}
          onToggleMetricsInfo={vi.fn()}
          isMobile={false}
        />,
      )

      const swatches = container.querySelectorAll('.stats-chart__legend-swatch')
      expect(swatches).toHaveLength(3)
    })
  })
})
