import { describe, it, expect } from 'vitest'
import { calculateScore } from './helpers'

describe('calculateScore', () => {
  describe('Center and high-scoring rings', () => {
    it('should return 10 for a shot at exact center (0, 0)', () => {
      expect(calculateScore(0, 0)).toBe(10)
    })

    it('should return 10 for a shot inside ring 10', () => {
      expect(calculateScore(0.05, 0.05)).toBe(10)
    })

    it('should return 9 for a shot in ring 9', () => {
      expect(calculateScore(0.15, 0)).toBe(9)
    })

    it('should return 8 for a shot in ring 8', () => {
      expect(calculateScore(0.25, 0)).toBe(8)
    })
  })

  describe('Mid-range rings', () => {
    it('should return 7 for a shot in ring 7', () => {
      expect(calculateScore(0.35, 0)).toBe(7)
    })

    it('should return 6 for a shot in ring 6', () => {
      expect(calculateScore(0.45, 0)).toBe(6)
    })

    it('should return 5 for a shot in ring 5', () => {
      expect(calculateScore(0.55, 0)).toBe(5)
    })

    it('should return 4 for a shot in ring 4', () => {
      expect(calculateScore(0.65, 0)).toBe(4)
    })
  })

  describe('Outer rings', () => {
    it('should return 3 for a shot in ring 3', () => {
      expect(calculateScore(0.75, 0)).toBe(3)
    })

    it('should return 2 for a shot in ring 2', () => {
      expect(calculateScore(0.85, 0)).toBe(2)
    })

    it('should return 1 for a shot in ring 1', () => {
      expect(calculateScore(0.95, 0)).toBe(1)
    })

    it('should return 0 for a shot at target boundary', () => {
      expect(calculateScore(1.0, 0)).toBe(0)
    })
  })

  describe('Missed shots (outside target)', () => {
    it('should return 0 for a shot just outside the target', () => {
      expect(calculateScore(1.01, 0)).toBe(0)
    })

    it('should return 0 for a shot far outside the target', () => {
      expect(calculateScore(2.0, 0)).toBe(0)
    })

    it('should return 0 for a diagonal missed shot', () => {
      expect(calculateScore(0.8, 0.8)).toBe(0)
    })
  })

  describe('Diagonal and negative coordinates', () => {
    it('should calculate correct score for 45-degree shot in ring 10', () => {
      const coord = 0.05 / Math.sqrt(2)
      expect(calculateScore(coord, coord)).toBe(10)
    })

    it('should calculate correct score for 45-degree shot in ring 5', () => {
      const coord = 0.55 / Math.sqrt(2)
      expect(calculateScore(coord, coord)).toBe(5)
    })

    it('should handle negative coordinates correctly', () => {
      expect(calculateScore(-0.15, 0)).toBe(9)
    })

    it('should handle all four quadrants correctly', () => {
      const coord = 0.35 / Math.sqrt(2)
      expect(calculateScore(-coord, -coord)).toBe(7)
    })
  })
})
