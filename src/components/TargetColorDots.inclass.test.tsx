import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Target } from './Target'
import type { End, Shot } from '../utils/types'

/**
 * Target Component Description:
 * 
 * The Target component displays an archery target with colored rings and shot markers.
 * It visually represents where shots landed on the target and distinguishes between:
 * 
 * 1. Shots that land ON the target (distance from center ≤ 1.0):
 *    - Current end shots: Displayed with green/teal color (class: shot-dot--current)
 *    - Previous end shots: Displayed with dimmed green/teal color (class: shot-dot--previous)
 *    - Preview shot: Displayed with light green color (class: shot-dot--preview)
 * 
 * 2. Shots that land OFF the target (distance from center > 1.0):
 *    - These shots receive an additional 'shot-dot--miss' class
 *    - CSS applies red coloring to shots with this class
 *    - Misses score 0 points regardless of position
 * 
 * The component calculates shot distance using: sqrt(x² + y²)
 * where x and y are normalized coordinates (-1 to 1 for on-target shots)
 * 
 * Edge Cases:
 * - Shots exactly at distance = 1.0 (on the edge) should be green
 * - Shots with distance > 1.0 should be red
 * - Empty shot arrays should render without errors
 * - Multiple ends with mixed on/off target shots
 */

describe('Target Component - Dot Color Tests', () => {
  const mockOnTargetClick = vi.fn()
  const ringColors = ['#e6d100', '#e4442c', '#23a0d6', '#484239', '#d3c5b3']
  const ringCount = 10

  describe('On-target shots (green dots)', () => {
    it('applies shot-dot--current class for current end shots on target (center shot)', () => {
      const currentEnd: End = {
        shots: [{ x: 0, y: 0, score: 10 }], // Center of target
        endScore: 10,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(false)
    })

    it('applies shot-dot--current class for current end shot near edge but on target', () => {
      // Distance = sqrt(0.9² + 0.4²) = sqrt(0.81 + 0.16) = sqrt(0.97) ≈ 0.985 < 1.0
      const currentEnd: End = {
        shots: [{ x: 0.9, y: 0.4, score: 1 }],
        endScore: 1,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(false)
    })

    it('applies shot-dot--current class for shot exactly on target edge (distance = 1.0)', () => {
      // Distance = sqrt(1² + 0²) = 1.0 (exactly on edge)
      const currentEnd: End = {
        shots: [{ x: 1.0, y: 0, score: 0 }],
        endScore: 0,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      // Edge case: distance = 1.0 is NOT a miss (1.0 ≤ 1.0 is false for > 1.0 check)
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(false)
    })

    it('applies shot-dot--previous class for previous end shots on target', () => {
      const previousEnd: End = {
        shots: [{ x: 0.5, y: 0.5, score: 5 }],
        endScore: 5,
        precision: 0,
      }
      const currentEnd: End = {
        shots: [],
        endScore: 0,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[previousEnd, currentEnd]}
          currentEndIndex={1}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--previous')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(false)
    })

    it('applies shot-dot--preview class for preview shot on target', () => {
      const activeShot: Shot = { x: 0.3, y: 0.3, score: 8 }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[{ shots: [], endScore: 0, precision: 0 }]}
          currentEndIndex={0}
          activeShot={activeShot}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const previewDot = container.querySelector('.shot-dot--preview')
      expect(previewDot).toBeTruthy()
      expect(previewDot?.classList.contains('shot-dot--miss')).toBe(false)
    })
  })

  describe('Off-target shots (red dots)', () => {
    it('applies shot-dot--miss class for current end shot off target', () => {
      // Distance = sqrt(1.5² + 0²) = 1.5 > 1.0
      const currentEnd: End = {
        shots: [{ x: 1.5, y: 0, score: 0 }],
        endScore: 0,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(true)
    })

    it('applies shot-dot--miss class for shot far off target', () => {
      // Distance = sqrt(2² + 2²) = sqrt(8) ≈ 2.828 > 1.0
      const currentEnd: End = {
        shots: [{ x: 2.0, y: 2.0, score: 0 }],
        endScore: 0,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(true)
    })

    it('applies shot-dot--miss class for previous end shot off target', () => {
      // Distance = sqrt((-1.2)² + 0.8²) = sqrt(1.44 + 0.64) = sqrt(2.08) ≈ 1.442 > 1.0
      const previousEnd: End = {
        shots: [{ x: -1.2, y: 0.8, score: 0 }],
        endScore: 0,
        precision: 0,
      }
      const currentEnd: End = {
        shots: [],
        endScore: 0,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[previousEnd, currentEnd]}
          currentEndIndex={1}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--previous')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(true)
    })

    it('applies shot-dot--miss class for preview shot off target', () => {
      // Distance = sqrt(1.1² + 0²) = 1.1 > 1.0
      const activeShot: Shot = { x: 1.1, y: 0, score: 0 }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[{ shots: [], endScore: 0, precision: 0 }]}
          currentEndIndex={0}
          activeShot={activeShot}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const previewDot = container.querySelector('.shot-dot--preview')
      expect(previewDot).toBeTruthy()
      expect(previewDot?.classList.contains('shot-dot--miss')).toBe(true)
    })

    it('applies shot-dot--miss class for shot with negative coordinates off target', () => {
      // Distance = sqrt((-1.5)² + (-1.5)²) = sqrt(4.5) ≈ 2.121 > 1.0
      const currentEnd: End = {
        shots: [{ x: -1.5, y: -1.5, score: 0 }],
        endScore: 0,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(true)
    })
  })

  describe('Mixed scenarios', () => {
    it('correctly applies classes to multiple shots with mix of on/off target', () => {
      const currentEnd: End = {
        shots: [
          { x: 0, y: 0, score: 10 },        // On target (center)
          { x: 1.5, y: 0, score: 0 },       // Off target
          { x: 0.7, y: 0.7, score: 3 },     // On target (distance ≈ 0.99)
        ],
        endScore: 13,
        precision: 0.5,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const allDots = container.querySelectorAll('.shot-dot--current')
      expect(allDots.length).toBe(3)

      // First shot should not have miss class
      expect(allDots[0].classList.contains('shot-dot--miss')).toBe(false)
      
      // Second shot should have miss class
      expect(allDots[1].classList.contains('shot-dot--miss')).toBe(true)
      
      // Third shot should not have miss class
      expect(allDots[2].classList.contains('shot-dot--miss')).toBe(false)
    })

    it('handles multiple ends with different shot states', () => {
      const ends: End[] = [
        {
          shots: [{ x: 0.5, y: 0.5, score: 5 }],  // Previous end, on target
          endScore: 5,
          precision: 0,
        },
        {
          shots: [{ x: 1.5, y: 0, score: 0 }],    // Current end, off target
          endScore: 0,
          precision: 0,
        },
      ]

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={ends}
          currentEndIndex={1}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const previousDot = container.querySelector('.shot-dot--previous')
      expect(previousDot).toBeTruthy()
      expect(previousDot?.classList.contains('shot-dot--miss')).toBe(false)

      const currentDot = container.querySelector('.shot-dot--current')
      expect(currentDot).toBeTruthy()
      expect(currentDot?.classList.contains('shot-dot--miss')).toBe(true)
    })
  })

  describe('Edge cases and bad inputs', () => {
    it('handles empty shots array without errors', () => {
      const emptyEnd: End = {
        shots: [],
        endScore: 0,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[emptyEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDots = container.querySelectorAll('.shot-dot')
      expect(shotDots.length).toBe(0)
    })

    it('handles null activeShot without errors', () => {
      const currentEnd: End = {
        shots: [{ x: 0, y: 0, score: 10 }],
        endScore: 10,
        precision: 0,
      }

      expect(() => {
        render(
          <Target
            ringColors={ringColors}
            currentRound={[currentEnd]}
            currentEndIndex={0}
            activeShot={null}
            onTargetClick={mockOnTargetClick}
            ringCount={ringCount}
          />
        )
      }).not.toThrow()
    })

    it('handles shot with very large coordinates (extreme miss)', () => {
      // Distance = sqrt(100² + 100²) = sqrt(20000) ≈ 141.42 >> 1.0
      const currentEnd: End = {
        shots: [{ x: 100, y: 100, score: 0 }],
        endScore: 0,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(true)
    })

    it('handles shot with zero coordinates (center - on target)', () => {
      // Distance = sqrt(0² + 0²) = 0 < 1.0
      const currentEnd: End = {
        shots: [{ x: 0, y: 0, score: 10 }],
        endScore: 10,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(false)
    })

    it('handles shot coordinates that form distance just barely over threshold', () => {
      // Distance = sqrt(1.001² + 0²) = 1.001 > 1.0 (barely a miss)
      const currentEnd: End = {
        shots: [{ x: 1.001, y: 0, score: 0 }],
        endScore: 0,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(true)
    })

    it('handles shot coordinates that form distance just barely under threshold', () => {
      // Distance = sqrt(0.999² + 0²) = 0.999 < 1.0 (barely on target)
      const currentEnd: End = {
        shots: [{ x: 0.999, y: 0, score: 1 }],
        endScore: 1,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(false)
    })

    it('handles negative coordinates on target', () => {
      // Distance = sqrt((-0.6)² + (-0.8)²) = sqrt(0.36 + 0.64) = sqrt(1.0) = 1.0
      const currentEnd: End = {
        shots: [{ x: -0.6, y: -0.8, score: 1 }],
        endScore: 1,
        precision: 0,
      }

      const { container } = render(
        <Target
          ringColors={ringColors}
          currentRound={[currentEnd]}
          currentEndIndex={0}
          activeShot={null}
          onTargetClick={mockOnTargetClick}
          ringCount={ringCount}
        />
      )

      const shotDot = container.querySelector('.shot-dot--current')
      expect(shotDot).toBeTruthy()
      expect(shotDot?.classList.contains('shot-dot--miss')).toBe(false)
    })
  })
})
