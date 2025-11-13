import { describe, it, expect } from 'vitest'
import { computeAggregateStats } from './aggregateStats'
import type { Round } from './types'

describe('computeAggregateStats', () => {
  describe('with a single practice round', () => {
    it('should correctly calculate statistics for one round with perfect shots', () => {
      const mockRounds: Round[] = [
        {
          id: '1',
          createdAt: '2025',
          ends: [
            {
              shots: [
                { x: 0, y: 0, score: 10 },
                { x: 0, y: 0, score: 10 },
                { x: 0, y: 0, score: 10 },
              ],
              endScore: 30,
              precision: 0,
            },
          ],
          totalScore: 30,
        },
      ]

      const result = computeAggregateStats(mockRounds)

      expect(result.averagePoints).toBe(10)
      expect(result.averageDistanceFromCenter).toBe(0)
      expect(result.missedShots).toBe(0)
      expect(result.shotCount).toBe(3)
      expect(result.averagePrecision).toBe(0)
    })

    it('should correctly count missed shots', () => {
      const mockRounds: Round[] = [
        {
          id: '1',
          createdAt: '2025',
          ends: [
            {
              shots: [
                { x: 0, y: 0, score: 10 },
                { x: 1.5, y: 1.5, score: 0 },
                { x: 2, y: 2, score: 0 },
              ],
              endScore: 10,
              precision: 5.2,
            },
          ],
          totalScore: 10,
        },
      ]

      const result = computeAggregateStats(mockRounds)

      expect(result.missedShots).toBe(2)
      expect(result.shotCount).toBe(3)
      expect(result.averagePoints).toBe(10/3)
    })

    it('should calculate average precision from end precisions', () => {
      const mockRounds: Round[] = [
        {
          id: '1',
          createdAt: '2025',
          ends: [
            {
              shots: [
                { x: 0.1, y: 0.1, score: 10 },
                { x: 0.2, y: 0.2, score: 9 },
              ],
              endScore: 19,
              precision: 3.5,
            },
            {
              shots: [
                { x: 0.3, y: 0.3, score: 9 },
                { x: 0.4, y: 0.4, score: 8 },
              ],
              endScore: 17,
              precision: 2.5,
            },
          ],
          totalScore: 36,
        },
      ]

      const result = computeAggregateStats(mockRounds)

      expect(result.averagePrecision).toBe(3.0) // (3.5 + 2.5) / 2
      expect(result.shotCount).toBe(4)
    })
  })

  describe('edge cases', () => {
    it('should return zeros for empty rounds array', () => {
      const mockRounds: Round[] = []

      const result = computeAggregateStats(mockRounds)

      expect(result.averagePoints).toBe(0)
      expect(result.averageDistanceFromCenter).toBe(0)
      expect(result.missedShots).toBe(0)
      expect(result.averagePrecision).toBe(0)
      expect(result.shotCount).toBe(0)
    })

    it('should filter out zero precision values when calculating average precision', () => {
      const mockRounds: Round[] = [
        {
          id: '1',
          createdAt: '2025',
          ends: [
            {
              shots: [{ x: 0, y: 0, score: 10 }],
              endScore: 10,
              precision: 0,
            },
            {
              shots: [{ x: 0.1, y: 0.1, score: 10 }],
              endScore: 10,
              precision: 4.0,
            },
            {
              shots: [{ x: 0.2, y: 0.2, score: 9 }],
              endScore: 9,
              precision: 2.0,
            },
          ],
          totalScore: 29,
        },
      ]

      const result = computeAggregateStats(mockRounds)

      expect(result.averagePrecision).toBe(3.0)
    })

    it('should handle all shots being misses', () => {
      const mockRounds: Round[] = [
        {
          id: '1',
          createdAt: '2025',
          ends: [
            {
              shots: [
                { x: 5, y: 5, score: 0 },
                { x: 6, y: 6, score: 0 },
                { x: 7, y: 7, score: 0 },
              ],
              endScore: 0,
              precision: 8.5,
            },
          ],
          totalScore: 0,
        },
      ]

      const result = computeAggregateStats(mockRounds)

      expect(result.averagePoints).toBe(0)
      expect(result.missedShots).toBe(3)
      expect(result.shotCount).toBe(3)
    })
  })

  describe('end to end scenarios', () => {
    it('should calculate stats for typical practice session with varying performance across the session', () => {
      const mockRounds: Round[] = [
        {
          id: '1',
          createdAt: '2025',
          ends: [
            {
              shots: [
                { x: 0.3, y: 0.4, score: 8 },
                { x: 0.5, y: 0.6, score: 7 },
                { x: 1.2, y: 1.3, score: 0 },
              ],
              endScore: 15,
              precision: 4.5,
            },
            {
              shots: [
                { x: 0.05, y: 0.05, score: 10 },
                { x: 0.08, y: 0.07, score: 10 },
                { x: 0.1, y: 0.09, score: 10 },
              ],
              endScore: 30,
              precision: 1.2,
            },
          ],
          totalScore: 45,
        },
      ]

      const result = computeAggregateStats(mockRounds)

      expect(result.shotCount).toBe(6)
      expect(result.missedShots).toBe(1)
      expect(result.averagePoints).toBe(7.5)
      expect(result.averagePrecision).toBe(2.85)
    })
  })
})

